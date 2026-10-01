import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useGetProformaById,
  useUpdateProformaStatus,
  useUpdateSectionApproval,
  useAddSectionComment,
  useUpdateSectionItems,
} from "@/store/useProformaStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  Clock,
  ShieldCheck,
  Paperclip,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import ProformaSectionNotes from "@/components/proforma/ProformaSectionNotes";
import ProformaActivityLog, { ProformaLatestChangeBanner } from "@/components/proforma/ProformaActivityLog";
import { openProformaInvoiceTab } from "@/components/admin/ProformaInvoiceDocument";

const SECTION_KEYS = ["TEACHING", "TRAVEL", "FOOD", "STAY", "MISCELLANEOUS"];

const CATEGORY_TOGGLE_KEY = {
  TRAVEL: "travel_enabled",
  FOOD: "food_enabled",
  STAY: "stay_enabled",
  MISCELLANEOUS: "miscellaneous_enabled",
};

const SECTIONS = [
  { key: "TEACHING", title: "1. Teaching Fee", totalKey: "teaching_total", qtyLabel: "Blocks" },
  { key: "TRAVEL", title: "2. Travel Expenses", totalKey: "travel_total", qtyLabel: "Distance (KM)" },
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
    if (mode === "RAIL" || mode === "FLIGHT") return 1;
    const billable =
      item.distance_km ??
      (item.road_one_way_km != null && item.road_multiplier != null
        ? Number(item.road_one_way_km) * Number(item.road_multiplier)
        : null) ??
      item.multiplier;
    return Number(billable ?? 0);
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
  const params = useParams({ strict: false });
  const id = params?.id || params?.["$id"];
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: responseData, isLoading, isError, error } = useGetProformaById(id, {
    enabled: Boolean(id),
  });
  const proforma = responseData?.data || responseData;

  const updateStatusMutation = useUpdateProformaStatus();
  const updateApprovalMutation = useUpdateSectionApproval();
  const addCommentMutation = useAddSectionComment();
  const updateItemsMutation = useUpdateSectionItems();

  const [notes, setNotes] = useState({});
  const [draft, setDraft] = useState({});
  const [savingSection, setSavingSection] = useState(null);

  useEffect(() => {
    if (proforma?.proforma_number) {
      updateBreadcrumbs([
        { label: "Finance Management", path: "/admin/finance-reports", navigable: true },
        { label: "Teacher Proforma Invoices", path: "/admin/proforma-invoices", navigable: true },
        { label: proforma.proforma_number },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [proforma, updateBreadcrumbs]);

  const itemsByType = useMemo(() => {
    const map = {};
    SECTION_KEYS.forEach((k) => {
      map[k] = (proforma?.items || []).filter((i) => i.item_type === k);
    });
    return map;
  }, [proforma]);

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
  const allAccepted = activeSections.every((k) => dual[k]?.admin_approved);
  const allConfirmed = activeSections.every((k) => dual[k]?.teacher_approved);
  const isSigned =
    proforma?.digital_signature?.is_signed || proforma?.status === "TEACHER_SIGNED_APPROVED";
  const inFinance = proforma?.status === "MOVED_TO_FINANCE" || proforma?.status === "PAID";
  const canSendToFinance =
    isSigned && allAccepted && allConfirmed && proforma?.status === "TEACHER_SIGNED_APPROVED";

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
        <p className="text-sm text-muted-foreground font-medium">Loading proforma invoice details...</p>
      </div>
    );
  }

  if (isError || !proforma) {
    return (
      <div className="space-y-4 mt-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/admin/proforma-invoices" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Proforma Queue
        </Button>
        <div className="p-8 border border-destructive/20 bg-destructive/10 rounded-2xl text-center text-destructive">
          Failed to load proforma invoice: {error?.message || "Invoice not found"}
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
        ...(sec === "TRAVEL" ? { travel_mode: travelMode } : {}),
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
        onSuccess: () => discard(sec),
      }
    );
  };

  const accept = (sec) => {
    if (!dual[sec]?.teacher_approved) {
      toast.error("Teacher must confirm this section first");
      return;
    }
    if (isDirty(sec)) {
      toast.error("Save or discard edits first");
      return;
    }
    if (dual[sec]?.admin_approved) return;
    updateApprovalMutation.mutate({
      id: proforma._id,
      section: sec,
      action: "APPROVE",
      notes: `Admin accepted ${sec}`,
    });
  };

  const sendToFinance = () => {
    if (!canSendToFinance) {
      toast.error("Teacher must sign and all sections must be accepted");
      return;
    }
    updateStatusMutation.mutate({
      id: proforma._id,
      data: { status: "MOVED_TO_FINANCE", notes: "Moved to Finance Payout Queue" },
    });
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
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {proforma.teacher_id?.full_name || proforma.teacher_id?.name || "Teacher"}
              {" · "}
              <span className="font-semibold text-foreground">
                {proforma.planning_id?.city || proforma.region_snapshot_name || "—"}
              </span>
              {" · "}
              <span className="font-mono font-semibold text-foreground">
                €{Number(proforma.grand_total || 0).toFixed(2)}
              </span>
            </p>
            {proforma.teacher_id?.IBAN && (
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                IBAN: <span className="font-semibold text-foreground">{proforma.teacher_id.IBAN}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {inFinance && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold flex items-center gap-1.5"
              onClick={() => openProformaInvoiceTab(proforma._id)}
            >
              <Printer className="w-4 h-4" />
              View invoice
            </Button>
          )}
          {!inFinance ? (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              onClick={sendToFinance}
              disabled={!canSendToFinance || updateStatusMutation.isPending}
              title={!canSendToFinance ? "Requires teacher signature and all sections accepted" : undefined}
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

      <ProformaLatestChangeBanner proforma={proforma} viewerRole="ADMIN" />

      {isSigned && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 px-1">
          <CheckCircle2 className="w-4 h-4" />
          Digitally signed by {proforma.digital_signature?.signed_by_name}
        </div>
      )}

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
          const item = sec.key === "TRAVEL" ? roadItem || fixedTravelItems[0] || items[0] : items[0];
          const docs = items.flatMap((i) => i.attachments || []);
          const comments = (proforma.section_comments || []).filter((c) => c.section === sec.key);
          const form = formFor(sec.key);
          const dirty = isDirty(sec.key);
          const teacherOk = dual[sec.key]?.teacher_approved;
          const adminOk = dual[sec.key]?.admin_approved;
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
                  {sec.key === "TRAVEL" && (
                    <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-border text-foreground bg-muted/50">
                      {fixedTravelItems.length > 0
                        ? `fixed · ${fixedTravelItems.length} session(s)`
                        : roadItem
                          ? "weekend fee"
                          : "tickets only"}
                      {ticketItems.length > 0 ? ` · ${ticketItems.length} ticket(s)` : ""}
                    </span>
                  )}
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
                      No amount — no accept needed
                    </span>
                  ) : (
                    <>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border flex items-center gap-1 ${
                          teacherOk
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {teacherOk ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />} Teacher confirmed
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border flex items-center gap-1 ${
                          adminOk
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {adminOk ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />} Accepted
                      </span>
                    </>
                  )}
                  {active &&
                    Array.isArray(proforma.last_revision?.sections) &&
                    proforma.last_revision.sections.includes(sec.key) && (
                      <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-amber-400 text-amber-800 bg-amber-50">
                        Recently changed
                      </span>
                    )}
                </div>

                {!inFinance && active && (
                  <Button
                    size="sm"
                    variant={adminOk ? "default" : "outline"}
                    className={
                      adminOk
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold"
                        : "h-7 text-xs"
                    }
                    disabled={adminOk || !teacherOk || dirty}
                    onClick={() => accept(sec.key)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {adminOk ? "Accepted" : "Accept"}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  {pendingChange && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm space-y-1">
                      <p className="font-semibold text-amber-950 text-xs uppercase tracking-wide">
                        Teacher update
                      </p>
                      {pendingChange.before != null && pendingChange.after != null && (
                        <p className="text-sm text-amber-950">
                          {sec.key === "TEACHING" ? (
                            <>
                              Blocks {pendingChange.before?.blocks ?? "—"} → {pendingChange.after?.blocks ?? "—"}
                              <span className="font-mono text-xs ml-2 text-amber-900/80">
                                (€{Number(pendingChange.before?.line_total || 0).toFixed(2)} → €
                                {Number(pendingChange.after?.line_total || 0).toFixed(2)})
                              </span>
                            </>
                          ) : (
                            <span className="font-mono text-xs">
                              {JSON.stringify(pendingChange.before)} → {JSON.stringify(pendingChange.after)}
                            </span>
                          )}
                        </p>
                      )}
                      {pendingChange.note && (
                        <p className="text-xs text-amber-900/90">Note: {pendingChange.note}</p>
                      )}
                    </div>
                  )}

                  {sec.key === "TRAVEL" && roadItem ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs uppercase font-semibold">Teaching weekend fee</Label>
                        <Input value="Travel (road)" disabled className="mt-1 text-sm bg-muted" />
                      </div>
                      <div>
                        <Label className="text-xs uppercase font-semibold">Distance (KM)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={form.multiplier}
                          disabled={inFinance}
                          onChange={(e) => setField(sec.key, "multiplier", e.target.value)}
                          className="font-mono text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs uppercase font-semibold">Unit rate (€/km)</Label>
                        <Input
                          type="number"
                          step="0.0001"
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
                      <div className="sm:col-span-3">
                        <p className="text-xs text-muted-foreground">
                          {roadItem.calculation_breakdown || roadItem.description}
                        </p>
                      </div>
                    </div>
                  ) : sec.key === "TRAVEL" && fixedTravelItems.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                        Fixed session travel
                      </p>
                      {fixedTravelItems.map((line) => (
                        <div
                          key={line._id}
                          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{line.description}</p>
                            <p className="text-xs font-mono text-muted-foreground">
                              {line.calculation_breakdown ||
                                `€${Number(line.line_total || 0).toFixed(2)}`}
                            </p>
                            {line.session_date && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {new Date(line.session_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <span className="font-mono text-sm font-semibold">
                            €{Number(line.line_total || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : sec.key === "TRAVEL" && !roadItem && ticketItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No travel lines.</p>
                  ) : sec.key === "STAY" && items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No accommodation claimed yet — €0.00. Teacher can add hotel/stay items with receipts.
                    </p>
                  ) : sec.key === "FOOD" && items.filter((i) => Number(i.line_total) > 0).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No meal items claimed yet — €0.00. Teacher can add meal items with receipts.
                    </p>
                  ) : sec.key === "MISCELLANEOUS" && items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No miscellaneous claims yet — €0.00.
                    </p>
                  ) : sec.key === "FOOD" ? (
                    null
                  ) : sec.key === "MISCELLANEOUS" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label className="text-xs uppercase font-semibold">Description</Label>
                      <Input
                        value={form.description}
                        disabled={inFinance}
                        onChange={(e) => setField(sec.key, "description", e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase font-semibold">Amount (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.unit_rate}
                        disabled={inFinance}
                        onChange={(e) => {
                          setFields(sec.key, { unit_rate: e.target.value, multiplier: 1 });
                        }}
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                  </div>
                  ) : sec.key !== "TRAVEL" ? (
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
                  ) : null}

                  {/* Extra claim / ticket lines */}
                  {(ticketItems.length > 0 ||
                    (["FOOD", "STAY", "MISCELLANEOUS"].includes(sec.key) &&
                      items.filter((i) => Number(i.line_total) > 0).length > (sec.key === "FOOD" ? 0 : 1))) && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                        {sec.key === "TRAVEL"
                          ? "Rail / Air tickets"
                          : sec.key === "FOOD"
                            ? "Meal items"
                            : "Additional lines"}
                      </p>
                      {(sec.key === "TRAVEL"
                        ? ticketItems
                        : sec.key === "FOOD"
                          ? items.filter((i) => Number(i.line_total) > 0)
                          : items.slice(1)
                      ).map((line) => (
                        <div
                          key={line._id}
                          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {sec.key === "TRAVEL" && (
                                <span className="uppercase text-[10px] font-bold text-muted-foreground mr-2">
                                  {line.travel_mode}
                                </span>
                              )}
                              {line.description}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              €{Number(line.line_total || 0).toFixed(2)}
                            </p>
                            {(line.attachments || []).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {line.attachments.map((doc, idx) => (
                                  <a
                                    key={doc._id || doc.file_url || idx}
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-indigo-600 hover:underline inline-flex items-center gap-1"
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    {doc.file_name}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" /> Teacher documents
                      {sectionNeedsDocument(proforma, sec.key, itemsByType) && active && (
                        <span
                          className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            sectionHasDocuments(itemsByType, sec.key)
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {sectionHasDocuments(itemsByType, sec.key) ? "Provided" : "Required"}
                        </span>
                      )}
                    </p>
                    {docs.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {docs.map((doc, idx) => (
                          <a
                            key={doc._id || doc.file_url || idx}
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border text-xs font-medium hover:border-indigo-400 transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{doc.file_name || `Document #${idx + 1}`}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        {sectionNeedsDocument(proforma, sec.key, itemsByType) && active
                          ? "No documents uploaded yet — receipt/proof is required for this section."
                          : "No documents uploaded yet."}
                      </p>
                    )}
                  </div>
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
