import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useGetProformaById,
  useUpdateProformaStatus,
  useAddSectionComment,
  useUpdateSectionItems,
  useUpdateSectionApproval,
  useUpdateProformaLineItem,
  useSetActiveTravelMode,
} from "@/store/useProformaStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  Clock,
  ShieldCheck,
  Paperclip,
  Loader2,
  ArrowRight,
  Download,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import ProformaSectionNotes from "@/components/proforma/ProformaSectionNotes";
import ProformaActivityLog, { ProformaLatestChangeBanner } from "@/components/proforma/ProformaActivityLog";
import ProformaTravelRoadCard from "@/components/proforma/ProformaTravelRoadCard";
import ProformaTravelFixedCard from "@/components/proforma/ProformaTravelFixedCard";
import ProformaContextSummary from "@/components/proforma/ProformaContextSummary";
import ProformaEditableClaimRow from "@/components/proforma/ProformaEditableClaimRow";
import {
  ProformaInvoiceDocument,
  downloadProformaInvoicePdf,
  openProformaInvoiceTab,
} from "@/components/admin/ProformaInvoiceDocument";
import { getActiveTravelMode, activeTravelModeLabel } from "@/utils/proformaTravelMode";

const SECTION_KEYS = ["TEACHING", "TRAVEL", "FOOD", "STAY", "MISCELLANEOUS"];

const CATEGORY_TOGGLE_KEY = {
  TRAVEL: "travel_enabled",
  FOOD: "food_enabled",
  STAY: "stay_enabled",
  MISCELLANEOUS: "miscellaneous_enabled",
};

const SECTIONS = [
  { key: "TEACHING", title: "1. Teaching Fee", totalKey: "teaching_total", qtyLabel: "Blocks" },
  { key: "TRAVEL", title: "2. Travel Allowance", totalKey: "travel_total", qtyLabel: "Distance (KM)" },
  { key: "FOOD", title: "3. Meal Allowance", totalKey: "food_total", qtyLabel: "Days" },
  { key: "STAY", title: "4. Stay / Accommodation", totalKey: "stay_total", qtyLabel: "Nights" },
  { key: "MISCELLANEOUS", title: "5. Miscellaneous", totalKey: "miscellaneous_total", qtyLabel: "Amount" },
];

function savedQty(item) {
  if (!item || !item.item_type) return 0;
  if (item.item_type === "TEACHING") {
    return Number(item.blocks ?? item.multiplier ?? 0);
  }
  if (item.item_type === "TRAVEL") {
    const mode = String(item.travel_mode || "ROAD").toUpperCase();
    if (mode === "RAIL" || mode === "FLIGHT" || mode === "FIXED") return Number(item.multiplier ?? 1);
    if (item.road_billable_km != null) return Number(item.road_billable_km);
    if (item.road_one_way_km != null) {
      const trip = Number(item.road_multiplier) || 2;
      const freeKm =
        item.road_free_km_threshold != null ? Number(item.road_free_km_threshold) : 100;
      return Math.max(0, Number(item.road_one_way_km) * trip - freeKm);
    }
    return Number(item.distance_km ?? item.multiplier ?? 0);
  }
  if (item.item_type === "FOOD" || item.item_type === "STAY") {
    // Preserve explicit 0 (teacher has not claimed yet)
    return Number(item.multiplier ?? 0);
  }
  return Number(item.multiplier ?? item.distance_km ?? item.hours ?? 0);
}

function sectionHasAmount(proforma, itemsByType, sec) {
  const totalKey = SECTIONS.find((s) => s.key === sec)?.totalKey;
  if (totalKey && Number(proforma?.[totalKey] || 0) > 0) return true;
  return (itemsByType[sec] || []).some((i) => Number(i.line_total) > 0);
}

function sectionNeedsDocument(proforma, sec, itemsByType) {
  const policy = proforma?.proof_policy || {};
  if (sec === "STAY") return policy.stay?.requires_receipt === true;
  if (sec === "MISCELLANEOUS") return policy.miscellaneous?.proof_required === true;
  if (sec === "TRAVEL") {
    const travelItems = itemsByType.TRAVEL || [];
    return travelItems.some((item) => {
      if (Number(item.line_total) <= 0) return false;
      const mode = String(item.travel_mode || "ROAD").toLowerCase();
      if (mode === "fixed") return false;
      const modeKey = ["road", "rail", "flight"].includes(mode) ? mode : "road";
      return policy.travel?.[modeKey]?.proof_required === true;
    });
  }
  if (sec === "FOOD") {
    // Meal receipts when days > 0 and settings require (if configured)
    if (Number(proforma?.food_total || 0) <= 0) return false;
    return policy.food?.requires_receipt === true;
  }
  return false;
}

function sectionHasDocuments(itemsByType, sec) {
  return (itemsByType[sec] || []).some((i) => Array.isArray(i.attachments) && i.attachments.length > 0);
}

export default function ProformaInvoiceDetailPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params?.id || params?.["$id"];
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: responseData, isLoading, isError, error } = useGetProformaById(id, {
    enabled: Boolean(id),
  });
  const proforma = responseData?.data || responseData;

  const updateStatusMutation = useUpdateProformaStatus();
  const addCommentMutation = useAddSectionComment();
  const updateItemsMutation = useUpdateSectionItems();
  const updateApprovalMutation = useUpdateSectionApproval();
  const updateLineItemMutation = useUpdateProformaLineItem();
  const setTravelModeMutation = useSetActiveTravelMode();

  const [notes, setNotes] = useState({});
  const [draft, setDraft] = useState({});
  const [savingSection, setSavingSection] = useState(null);
  const [adjustingTravel, setAdjustingTravel] = useState(false);
  const [travelOneWay, setTravelOneWay] = useState("");
  const [lineBusy, setLineBusy] = useState(false);
  const [travelTab, setTravelTab] = useState("ROAD");
  const [rejectReasons, setRejectReasons] = useState({});
  const [rejectingSection, setRejectingSection] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (proforma?.proforma_number) {
      updateBreadcrumbs([
        { label: t("finance.title"), path: "/admin/finance-reports", navigable: true },
        { label: t("proforma.teacherInvoices"), path: "/admin/proforma-invoices", navigable: true },
        { label: proforma.proforma_number },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [proforma, updateBreadcrumbs, t]);

  const itemsByType = useMemo(() => {
    const map = {};
    SECTION_KEYS.forEach((k) => {
      map[k] = (proforma?.items || []).filter((i) => i.item_type === k);
    });
    return map;
  }, [proforma]);

  const travelItems = itemsByType.TRAVEL || [];
  const pageActiveTravelMode = useMemo(
    () => getActiveTravelMode(travelItems),
    [travelItems]
  );
  const hasFixedTravel = travelItems.some(
    (i) => String(i.travel_mode || "").toUpperCase() === "FIXED"
  );
  const adminTravelTabs = useMemo(() => {
    const primary = hasFixedTravel
      ? { key: "FIXED", label: "Fixed module" }
      : { key: "ROAD", label: "Road" };
    return [primary, { key: "RAIL", label: "Rail" }, { key: "FLIGHT", label: "Air" }];
  }, [hasFixedTravel]);

  useEffect(() => {
    if (!proforma?._id || !pageActiveTravelMode) return;
    setTravelTab(pageActiveTravelMode);
    setAdjustingTravel(false);
  }, [proforma?._id, pageActiveTravelMode]);

  const dual = proforma?.dual_section_approvals || {};

  const sectionIsActive = (sec) => sectionHasAmount(proforma, itemsByType, sec);

  /** Hide sections turned off in settings (unless this invoice already has an amount). */
  const sectionIsVisible = (sec) => {
    if (sec === "TEACHING") return true;
    const toggleKey = CATEGORY_TOGGLE_KEY[sec];
    if (!toggleKey) return true;
    const enabled = proforma?.category_toggles?.[toggleKey];
    if (enabled === false) return sectionIsActive(sec);
    return true;
  };

  const visibleSections = SECTIONS.filter((s) => sectionIsVisible(s.key));
  const activeSections = SECTION_KEYS.filter((k) => sectionIsVisible(k) && sectionIsActive(k));
  const allConfirmed = activeSections.every((k) => dual[k]?.teacher_approved);
  const isSigned =
    proforma?.digital_signature?.is_signed || proforma?.status === "TEACHER_SIGNED_APPROVED";
  const inFinance = proforma?.status === "MOVED_TO_FINANCE" || proforma?.status === "PAID";
  const canSendToFinance =
    isSigned && allConfirmed && proforma?.status === "TEACHER_SIGNED_APPROVED";

  const statusBadges = {
    SENT_TO_TEACHER: {
      label: "Awaiting teacher",
      bg: "bg-blue-100 text-blue-800 border-blue-200",
    },
    CHANGE_REQUESTED: {
      label: proforma?.workflow_next_actor === "ADMIN" ? "Awaiting admin" : "Awaiting teacher",
      bg: "bg-amber-100 text-amber-800 border-amber-200",
    },
    TEACHER_SIGNED_APPROVED: {
      label: "Signed — ready for finance",
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    MOVED_TO_FINANCE: {
      label: "In finance queue",
      bg: "bg-purple-100 text-purple-800 border-purple-200",
    },
    PAID: { label: "Paid", bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    REJECTED: { label: "Rejected", bg: "bg-red-100 text-red-800 border-red-200" },
  };
  const badgeInfo = statusBadges[proforma?.status] || {
    label: proforma?.status || "Open",
    bg: "bg-muted text-muted-foreground",
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">{t("proforma.loadingDetails")}</p>
      </div>
    );
  }

  if (isError || !proforma) {
    return (
      <div className="space-y-4 mt-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/proforma-invoices" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("proforma.backToList")}
        </Button>
        <div className="p-8 border border-destructive/20 bg-destructive/10 rounded-2xl text-center text-destructive">
          {t("proforma.loadFailed")}: {error?.message || t("proforma.notFound")}
        </div>
      </div>
    );
  }

  const baseForm = (sec) => {
    const list = itemsByType[sec] || [];
    const item =
      sec === "TRAVEL"
        ? list.find((i) => (i.travel_mode || "ROAD") === "ROAD") || list[0] || {}
        : list[0] || {};
    const hasItem = Boolean(item._id || item.item_type);
    return {
      description: hasItem
        ? item.description || `${sec} Fee`
        : sec === "STAY"
          ? "Stay"
          : sec === "FOOD"
            ? "Food"
            : sec === "MISCELLANEOUS"
              ? "Miscellaneous"
              : `${sec} Fee`,
      multiplier: sec === "MISCELLANEOUS" ? 1 : hasItem ? savedQty(item) : 0,
      unit_rate:
        sec === "MISCELLANEOUS" && hasItem
          ? Number(item.line_total ?? item.unit_rate ?? 0)
          : Number(item.unit_rate || (sec === "FOOD" ? proforma?.food_daily_rate : 0) || 0),
      _itemId: item._id,
      _hasItem: hasItem,
    };
  };

  const formFor = (sec) => draft[sec] || baseForm(sec);

  const isDirty = (sec) => {
    if (!draft[sec]) return false;
    const base = baseForm(sec);
    const d = draft[sec];
    return (
      String(d.description) !== String(base.description) ||
      Number(d.multiplier) !== Number(base.multiplier) ||
      Number(d.unit_rate) !== Number(base.unit_rate)
    );
  };

  const setField = (sec, field, value) => {
    setDraft((prev) => {
      const current = prev[sec] || baseForm(sec);
      return {
        ...prev,
        [sec]: { ...current, [field]: value },
      };
    });
  };

  const setFields = (sec, patch) => {
    setDraft((prev) => {
      const current = prev[sec] || baseForm(sec);
      return {
        ...prev,
        [sec]: { ...current, ...patch },
      };
    });
  };

  const discard = (sec) => {
    setDraft((prev) => {
      const next = { ...prev };
      delete next[sec];
      return next;
    });
    if (sec === "TRAVEL") {
      setAdjustingTravel(false);
      setTravelOneWay("");
    }
  };

  const save = (sec) => {
    const form = formFor(sec);
    const existingList = itemsByType[sec] || [];
    const primary =
      sec === "TRAVEL"
        ? existingList.find((i) => (i.travel_mode || "ROAD") === "ROAD") || existingList[0]
        : existingList[0];
    const travelMode = String(primary?.travel_mode || "ROAD").toUpperCase();
    const isActualTravel = sec === "TRAVEL" && ["RAIL", "FLIGHT"].includes(travelMode);

    // Preserve all sibling lines; only patch the primary editable line
    const itemsPayload = existingList.map((row) => {
      const isPrimary = String(row._id) === String(primary?._id);
      if (!isPrimary) {
        return {
          description: row.description,
          multiplier: row.multiplier,
          unit_rate: row.unit_rate,
          ...(sec === "TRAVEL" ? { travel_mode: row.travel_mode || "ROAD" } : {}),
          attachments: row.attachments || [],
        };
      }
      return {
        description: form.description,
        multiplier:
          sec === "MISCELLANEOUS"
            ? 1
            : sec === "FOOD" || sec === "STAY"
              ? Number(form.multiplier) || 0
              : isActualTravel
                ? 1
                : parseFloat(form.multiplier) || 1,
        unit_rate: parseFloat(form.unit_rate) || 0,
        ...(sec === "TRAVEL"
          ? {
              travel_mode: travelMode,
              ...(travelMode === "ROAD" && travelOneWay !== ""
                ? { road_one_way_km: parseFloat(travelOneWay) || 0 }
                : {}),
            }
          : {}),
        attachments: row.attachments || [],
      };
    });

    if (itemsPayload.length === 0) {
      itemsPayload.push({
        description: form.description,
        multiplier: sec === "MISCELLANEOUS" ? 1 : sec === "FOOD" || sec === "STAY" ? Number(form.multiplier) || 0 : parseFloat(form.multiplier) || 1,
        unit_rate: parseFloat(form.unit_rate) || 0,
      });
    }

    setSavingSection(sec);
    updateItemsMutation.mutate(
      {
        id: proforma._id,
        section: sec,
        items: itemsPayload,
      },
      {
        onSettled: () => setSavingSection(null),
        onSuccess: () => {
          discard(sec);
          if (sec === "TRAVEL") {
            setAdjustingTravel(false);
            setTravelOneWay("");
          }
        },
      }
    );
  };

  const sendToFinance = () => {
    if (!canSendToFinance) {
      toast.error("Teacher must confirm all sections and digitally sign first");
      return;
    }
    updateStatusMutation.mutate({
      id: proforma._id,
      data: { status: "MOVED_TO_FINANCE", notes: "Moved to Finance Payout Queue" },
    });
  };

  const downloadSignedPdf = async () => {
    try {
      setDownloadingPdf(true);
      await new Promise((r) => requestAnimationFrame(() => r()));
      const ok = await downloadProformaInvoicePdf(proforma);
      if (!ok) toast.error("Could not prepare PDF");
    } catch (err) {
      toast.error(err?.message || "Could not download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6 mt-4 pb-12 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground font-mono">{proforma.proforma_number}</h1>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${badgeInfo.bg}`}>
                {badgeInfo.label}
              </span>
              <span className="font-mono text-sm font-bold text-foreground">
                €{Number(proforma.grand_total || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isSigned && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold flex items-center gap-1.5"
              disabled={downloadingPdf}
              onClick={downloadSignedPdf}
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {t("proforma.downloadPdf")}
            </Button>
          )}
          {inFinance && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold flex items-center gap-1.5"
              onClick={() => openProformaInvoiceTab(proforma._id)}
            >
              <Printer className="w-4 h-4" />
              {t("proforma.viewInvoice")}
            </Button>
          )}
          {!inFinance ? (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              onClick={sendToFinance}
              disabled={!canSendToFinance || updateStatusMutation.isPending}
              title={!canSendToFinance ? "Requires teacher confirm + digital signature" : undefined}
            >
              <ArrowRight className="w-4 h-4" />
              {updateStatusMutation.isPending ? "Sending..." : "Send to finance"}
            </Button>
          ) : (
            <span className="bg-purple-600 text-white px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> In Finance Queue
            </span>
          )}
        </div>
      </div>

      {isSigned && (
        <div
          aria-hidden
          className="fixed left-[-10000px] top-0 w-[794px] pointer-events-none"
        >
          <ProformaInvoiceDocument proforma={proforma} />
        </div>
      )}

      <ProformaContextSummary proforma={proforma} showTeacherName />

      <ProformaLatestChangeBanner proforma={proforma} viewerRole="ADMIN" />

      <div className="space-y-6">
        {visibleSections.map((sec) => {
          const items = itemsByType[sec.key] || [];
          const roadItem =
            sec.key === "TRAVEL"
              ? items.find((i) => (i.travel_mode || "ROAD") === "ROAD")
              : null;
          const fixedTravelItems =
            sec.key === "TRAVEL"
              ? items.filter((i) => String(i.travel_mode || "").toUpperCase() === "FIXED")
              : [];
          const ticketItems =
            sec.key === "TRAVEL"
              ? items.filter((i) => ["RAIL", "FLIGHT"].includes(String(i.travel_mode || "").toUpperCase()))
              : [];
          const activeTravelMode =
            sec.key === "TRAVEL" ? getActiveTravelMode(items) : null;
          const ticketsActive =
            sec.key === "TRAVEL" &&
            (activeTravelMode === "RAIL" || activeTravelMode === "FLIGHT");
          const roadSuperseded = Boolean(roadItem) && ticketsActive;
          const fixedSuperseded = fixedTravelItems.length > 0 && ticketsActive;
          const stayClaimed = (proforma?.items || []).some(
            (i) =>
              i.item_type === "STAY" &&
              (Number(i.line_total) > 0 || Number(i.multiplier) > 0)
          );
          const roadReferenceTotal = roadItem
            ? Number(roadItem.road_calculated_total) > 0
              ? Number(roadItem.road_calculated_total)
              : (() => {
                  const oneWay = Number(roadItem.road_one_way_km) || 0;
                  const trip = Number(roadItem.road_multiplier) || 2;
                  const freeKm =
                    roadItem.road_free_km_threshold != null
                      ? Number(roadItem.road_free_km_threshold)
                      : 100;
                  const rate = Number(roadItem.road_unit_rate ?? roadItem.unit_rate) || 0;
                  const sessions = stayClaimed
                    ? 1
                    : Math.max(1, Number(roadItem.road_session_count) || 1);
                  const billable = Math.max(0, oneWay * trip - freeKm);
                  return Math.round(billable * rate * sessions * 100) / 100;
                })()
            : 0;
          const fixedReferenceTotal = fixedTravelItems.reduce(
            (acc, line) =>
              acc + (Number(line.road_calculated_total) || Number(line.line_total) || 0),
            0
          );
          const activeTicketItems =
            sec.key === "TRAVEL"
              ? ticketItems.filter(
                  (t) => String(t.travel_mode || "").toUpperCase() === activeTravelMode
                )
              : [];
          const item = sec.key === "TRAVEL" ? roadItem || fixedTravelItems[0] || items[0] : items[0];
          const comments = (proforma.section_comments || []).filter((c) => c.section === sec.key);
          const form = formFor(sec.key);
          const dirty = isDirty(sec.key);
          const teacherOk = dual[sec.key]?.teacher_approved;
          const active = sectionIsActive(sec.key);
          const isSaving = savingSection === sec.key && updateItemsMutation.isPending;
          const preview =
            Math.round(Number(form.unit_rate || 0) * Number(form.multiplier || 0) * 100) / 100;
          const pendingChange = (proforma.pending_teacher_changes || []).find(
            (c) => c.section === sec.key && c.status === "PENDING"
          );

          return (
            <Card
              key={sec.key}
              className={`border overflow-hidden ${dirty ? "border-amber-400" : "border-border"}`}
            >
              <CardHeader className="py-3.5 px-5 bg-muted/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-bold text-foreground">{sec.title}</CardTitle>
                  <span className="font-mono text-xs font-bold text-foreground bg-background px-2.5 py-0.5 rounded border">
                    €{Number(proforma[sec.totalKey] || 0).toFixed(2)}
                  </span>
                  {pendingChange && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-amber-400 text-amber-800 bg-amber-50">
                      Teacher update
                    </span>
                  )}
                  {(() => {
                    const needsDoc = sectionNeedsDocument(proforma, sec.key, itemsByType);
                    const hasDoc = sectionHasDocuments(itemsByType, sec.key);
                    if (!needsDoc || !active) return null;
                    return (
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border flex items-center gap-1 ${
                          hasDoc
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        <Paperclip className="w-3 h-3" />
                        {hasDoc ? "Document attached" : "Document required"}
                      </span>
                    );
                  })()}
                  {!active ? (
                    <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-border text-muted-foreground bg-muted/50">
                      No amount — no confirm needed
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border flex items-center gap-1 ${
                        teacherOk
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {teacherOk ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />} Teacher confirmed
                    </span>
                  )}
                  {active &&
                    Array.isArray(proforma.last_revision?.sections) &&
                    proforma.last_revision.sections.includes(sec.key) && (
                      <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-amber-400 text-amber-800 bg-amber-50">
                        Recently changed
                      </span>
                    )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  {pendingChange && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm space-y-2">
                      <p className="font-semibold text-amber-950 text-xs uppercase tracking-wide">
                        Teacher update request
                      </p>
                      {pendingChange.before != null && pendingChange.after != null && (
                        <p className="text-sm text-amber-950">
                          {sec.key === "TEACHING" && pendingChange.after?.blocks != null ? (
                            <>
                              Blocks {pendingChange.before?.blocks ?? "—"} → {pendingChange.after?.blocks ?? "—"}
                              <span className="font-mono text-xs ml-2 text-amber-900/80">
                                (€{Number(pendingChange.before?.line_total || pendingChange.before?.section_total || 0).toFixed(2)} → €
                                {Number(pendingChange.after?.line_total || 0).toFixed(2)})
                              </span>
                            </>
                          ) : sec.key === "FOOD" &&
                            (pendingChange.after?.days != null || pendingChange.after?.multiplier != null) ? (
                            <>
                              Days {pendingChange.before?.days ?? pendingChange.before?.multiplier ?? "—"} →{" "}
                              {pendingChange.after?.days ?? pendingChange.after?.multiplier ?? "—"}
                              <span className="font-mono text-xs ml-2 text-amber-900/80">
                                (€{Number(pendingChange.before?.line_total || pendingChange.before?.section_total || pendingChange.before?.amount || 0).toFixed(2)} → €
                                {Number(pendingChange.after?.line_total || pendingChange.after?.amount || 0).toFixed(2)})
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-xs">
                              Previous total €
                              {Number(
                                pendingChange.before?.section_total ??
                                  pendingChange.before?.amount ??
                                  pendingChange.before?.line_total ??
                                  0
                              ).toFixed(2)}
                              {pendingChange.after?.amount != null || pendingChange.after?.line_total != null
                                ? ` → €${Number(pendingChange.after?.amount ?? pendingChange.after?.line_total ?? 0).toFixed(2)}`
                                : " (will restore on reject)"}
                            </span>
                          )}
                        </p>
                      )}
                      {pendingChange.note && (
                        <p className="text-xs text-amber-900/90">Note: {pendingChange.note}</p>
                      )}
                      {!inFinance && (
                        <div className="space-y-2 pt-1">
                          {rejectingSection === sec.key ? (
                            <>
                              <Textarea
                                value={rejectReasons[sec.key] || ""}
                                onChange={(e) =>
                                  setRejectReasons((prev) => ({ ...prev, [sec.key]: e.target.value }))
                                }
                                placeholder="Reason for rejecting (required)"
                                className="min-h-[72px] text-sm bg-background"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs"
                                  disabled={updateApprovalMutation.isPending}
                                  onClick={() => {
                                    const reason = String(rejectReasons[sec.key] || "").trim();
                                    if (reason.length < 3) {
                                      toast.error("Reject reason is required (min 3 characters)");
                                      return;
                                    }
                                    updateApprovalMutation.mutate(
                                      {
                                        id: proforma._id,
                                        section: sec.key,
                                        action: "REJECT_UPDATE",
                                        notes: reason,
                                      },
                                      {
                                        onSuccess: () => {
                                          setRejectingSection(null);
                                          setRejectReasons((prev) => {
                                            const next = { ...prev };
                                            delete next[sec.key];
                                            return next;
                                          });
                                        },
                                      }
                                    );
                                  }}
                                >
                                  {updateApprovalMutation.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  ) : null}
                                  Confirm reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  disabled={updateApprovalMutation.isPending}
                                  onClick={() => setRejectingSection(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={updateApprovalMutation.isPending}
                                onClick={() =>
                                  updateApprovalMutation.mutate({
                                    id: proforma._id,
                                    section: sec.key,
                                    action: "APPROVE",
                                    notes: "Admin accepted teacher update request",
                                  })
                                }
                              >
                                <Check className="w-3.5 h-3.5 mr-1" /> Accept update
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                                disabled={updateApprovalMutation.isPending}
                                onClick={() => setRejectingSection(sec.key)}
                              >
                                Reject update
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {sec.key === "TRAVEL" ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                          {adminTravelTabs.map((tab) => (
                            <button
                              key={tab.key}
                              type="button"
                              onClick={() => {
                                setTravelTab(tab.key);
                                setAdjustingTravel(false);
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                travelTab === tab.key
                                  ? "bg-background text-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                        <span className="px-2 py-1 text-[11px] rounded-full font-semibold border border-primary/30 bg-primary/10 text-foreground">
                          Billed: {activeTravelModeLabel(activeTravelMode)}
                          {ticketsActive ? ` · ${activeTicketItems.length} ticket(s)` : ""}
                        </span>
                      </div>

                      {travelTab === "FIXED" &&
                        (fixedTravelItems.length > 0 ? (
                          fixedSuperseded ? (
                            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                              <p className="text-sm font-semibold text-foreground">
                                Fixed module not selected
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Estimated €{fixedReferenceTotal.toFixed(2)} (reference only).{" "}
                                {activeTravelModeLabel(activeTravelMode)} is currently billed.
                              </p>
                              {!inFinance && (
                                <Button
                                  size="sm"
                                  disabled={setTravelModeMutation.isPending}
                                  onClick={() =>
                                    setTravelModeMutation.mutate({
                                      id: proforma._id,
                                      travel_mode: "FIXED",
                                    })
                                  }
                                >
                                  {setTravelModeMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  ) : null}
                                  Switch to fixed module
                                </Button>
                              )}
                            </div>
                          ) : (
                            <ProformaTravelFixedCard
                              items={fixedTravelItems}
                              editable={!inFinance}
                              busy={lineBusy}
                              onSaveRate={async (rate) => {
                                setLineBusy(true);
                                try {
                                  for (const line of fixedTravelItems) {
                                    await updateLineItemMutation.mutateAsync({
                                      id: proforma._id,
                                      itemId: line._id,
                                      data: { amount: rate },
                                      silent: true,
                                    });
                                  }
                                  toast.success("Fixed travel rate updated");
                                } finally {
                                  setLineBusy(false);
                                }
                              }}
                            />
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("proforma.detail.noFixedTravel")}
                          </p>
                        ))}

                      {travelTab === "ROAD" &&
                        (roadItem ? (
                          roadSuperseded ? (
                            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                              <p className="text-sm font-semibold text-foreground">
                                Road allowance not selected
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Estimated €{roadReferenceTotal.toFixed(2)} (reference only).{" "}
                                {activeTravelModeLabel(activeTravelMode)} is currently billed.
                              </p>
                              {!inFinance && (
                                <Button
                                  size="sm"
                                  disabled={setTravelModeMutation.isPending}
                                  onClick={() =>
                                    setTravelModeMutation.mutate({
                                      id: proforma._id,
                                      travel_mode: "ROAD",
                                    })
                                  }
                                >
                                  {setTravelModeMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                  ) : null}
                                  Switch to road
                                </Button>
                              )}
                            </div>
                          ) : (
                            <ProformaTravelRoadCard
                              item={roadItem}
                              editable={!inFinance}
                              adjusting={adjustingTravel}
                              dirty={dirty || adjustingTravel}
                              hasHotel={stayClaimed}
                              oneWayKm={
                                adjustingTravel
                                  ? travelOneWay
                                  : roadItem.road_one_way_km ??
                                    (Number(form.multiplier) &&
                                    Number(roadItem.road_multiplier || 2)
                                      ? Number(form.multiplier) /
                                        Number(roadItem.road_multiplier || 2)
                                      : 0)
                              }
                              ratePerKm={form.unit_rate}
                              onToggleAdjust={(on) => {
                                if (on) {
                                  const ow =
                                    roadItem.road_one_way_km != null
                                      ? Number(roadItem.road_one_way_km)
                                      : 0;
                                  setTravelOneWay(String(ow || ""));
                                  setAdjustingTravel(true);
                                } else {
                                  setAdjustingTravel(false);
                                  discard(sec.key);
                                }
                              }}
                              onOneWayChange={(v) => {
                                setTravelOneWay(v);
                                const trip = Number(roadItem.road_multiplier || 2) || 2;
                                const freeKm =
                                  roadItem.road_free_km_threshold != null
                                    ? Number(roadItem.road_free_km_threshold)
                                    : 100;
                                const sessions = stayClaimed
                                  ? 1
                                  : Math.max(1, Number(roadItem.road_session_count) || 1);
                                const oneWay = Number(v || 0);
                                const billableKm = Math.max(0, oneWay * trip - freeKm);
                                // multiplier stores billable×sessions for dirty tracking; save sends road_one_way_km
                                setFields(sec.key, {
                                  multiplier: Math.round(billableKm * sessions * 1000) / 1000,
                                });
                              }}
                              onRateChange={(v) => setField(sec.key, "unit_rate", v)}
                            />
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {t("proforma.detail.noRoadTravel")}
                          </p>
                        ))}

                      {(travelTab === "RAIL" || travelTab === "FLIGHT") && (
                        <div className="space-y-2">
                          {ticketItems
                            .filter(
                              (t) => String(t.travel_mode || "").toUpperCase() === travelTab
                            )
                            .map((line) => (
                              <ProformaEditableClaimRow
                                key={line._id}
                                line={line}
                                editable={!inFinance}
                                busy={lineBusy}
                                modeBadge={line.travel_mode}
                                onSave={async (data) => {
                                  setLineBusy(true);
                                  try {
                                    await updateLineItemMutation.mutateAsync({
                                      id: proforma._id,
                                      itemId: line._id,
                                      data,
                                      silent: true,
                                    });
                                    toast.success("Line updated");
                                  } finally {
                                    setLineBusy(false);
                                  }
                                }}
                              />
                            ))}
                          {ticketItems.filter(
                            (t) => String(t.travel_mode || "").toUpperCase() === travelTab
                          ).length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              {t("proforma.detail.noTickets", {
                                mode: travelTab === "RAIL" ? "rail" : "flight",
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {!roadItem &&
                        fixedTravelItems.length === 0 &&
                        ticketItems.length === 0 && (
                          <p className="text-sm text-muted-foreground">No travel lines.</p>
                        )}
                    </div>
                  ) : sec.key === "STAY" && items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No accommodation claimed yet — €0.00. Teacher can add hotel/stay items with receipts.
                    </p>
                  ) : sec.key === "MISCELLANEOUS" && items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No miscellaneous claims yet — €0.00.
                    </p>
                  ) : sec.key === "STAY" || sec.key === "MISCELLANEOUS" ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                        {sec.key === "STAY" ? "Stay claims" : "Miscellaneous claims"}
                      </p>
                      {items.map((line) => (
                        <ProformaEditableClaimRow
                          key={line._id}
                          line={line}
                          editable={!inFinance}
                          busy={lineBusy}
                          onSave={async (data) => {
                            setLineBusy(true);
                            try {
                              await updateLineItemMutation.mutateAsync({
                                id: proforma._id,
                                itemId: line._id,
                                data,
                                silent: true,
                              });
                              toast.success("Line updated");
                            } finally {
                              setLineBusy(false);
                            }
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-3">
                      <Label className="text-xs uppercase font-semibold">Description</Label>
                      <Input
                        value={form.description}
                        disabled={inFinance}
                        onChange={(e) => setField(sec.key, "description", e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-semibold">{sec.qtyLabel}</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={form.multiplier}
                        disabled={inFinance}
                        onChange={(e) => setField(sec.key, "multiplier", e.target.value)}
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-semibold">Unit Rate (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.unit_rate}
                        disabled={inFinance}
                        onChange={(e) => setField(sec.key, "unit_rate", e.target.value)}
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-semibold">Amount (€)</Label>
                      <Input
                        value={preview.toFixed(2)}
                        disabled
                        className={`font-mono text-sm mt-1 ${dirty ? "bg-amber-50" : "bg-muted"}`}
                      />
                    </div>
                  </div>
                  )}

                </div>

                {dirty && !inFinance && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-amber-50 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-900">
                      Unsaved edits — teacher must re-confirm after save
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => discard(sec.key)}
                        disabled={isSaving}
                      >
                        Discard
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        onClick={() => save(sec.key)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...
                          </>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <ProformaSectionNotes
                  comments={comments}
                  value={notes[sec.key] || ""}
                  onChange={(v) => setNotes({ ...notes, [sec.key]: v })}
                  onSend={() => {
                    const comment = notes[sec.key]?.trim();
                    if (!comment) return;
                    addCommentMutation.mutate(
                      { id: proforma._id, section: sec.key, comment },
                      { onSuccess: () => setNotes({ ...notes, [sec.key]: "" }) }
                    );
                  }}
                  pending={addCommentMutation.isPending}
                  myRole="ADMIN"
                  placeholder="Ask the teacher a question about this section…"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ProformaActivityLog logs={proforma.audit_logs} />
    </div>
  );
}
