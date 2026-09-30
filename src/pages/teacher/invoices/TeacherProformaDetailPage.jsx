import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useGetProformaById,
  useSignProforma,
  useAddSectionComment,
  useUpdateSectionApproval,
  useSubmitTeacherUpdate,
  useAddSectionAttachment,
} from "@/store/useProformaStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  FileText,
  Loader2,
  Paperclip,
  PenTool,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import MultiFileSectionUploader from "@/components/common/MultiFileSectionUploader";
import ProformaSectionNotes from "@/components/proforma/ProformaSectionNotes";
import ProformaActivityLog, { ProformaLatestChangeBanner } from "@/components/proforma/ProformaActivityLog";

const SECTION_KEYS = ["TEACHING", "TRAVEL", "FOOD", "STAY", "MISCELLANEOUS"];
const EXPENSE_SECTIONS = ["TRAVEL", "STAY", "MISCELLANEOUS"];

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
  { key: "MISCELLANEOUS", title: "5. Miscellaneous", totalKey: "miscellaneous_total", qtyLabel: "Quantity" },
];

function savedQty(item) {
  if (!item) return 1;
  if (item.item_type === "TEACHING") {
    return Number(item.blocks || item.multiplier || 1);
  }
  if (item.item_type === "TRAVEL") {
    if ((item.travel_mode || "ROAD") === "ROAD") {
      return Number(item.distance_km || item.multiplier || 1);
    }
    return 1;
  }
  return Number(item.multiplier || item.distance_km || item.hours || 1);
}

function travelModeOf(item) {
  return (item?.travel_mode || "ROAD").toUpperCase();
}

const statusBadge = (p) => {
  if (p?.status === "MOVED_TO_FINANCE" || p?.status === "PAID") {
    return { label: "In Finance", className: "bg-purple-100 text-purple-800 border-purple-300" };
  }
  if (p?.digital_signature?.is_signed || p?.status === "TEACHER_SIGNED_APPROVED") {
    return { label: "Signed — awaiting admin", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
  if (p?.workflow_next_actor === "TEACHER" && p?.last_revision?.requested_by_role === "BACKOFFICE") {
    return { label: "Admin updated — re-confirm", className: "bg-orange-100 text-orange-800 border-orange-300" };
  }
  return { label: "Needs confirm & sign", className: "bg-amber-100 text-amber-800 border-amber-300" };
};

export default function TeacherProformaDetailPage() {
  const params = useParams({ strict: false });
  const id = params?.id || params?.["$id"];
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: responseData, isLoading, isError, error } = useGetProformaById(id, {
    enabled: Boolean(id),
  });
  const proforma = responseData?.data || responseData;

  const signMutation = useSignProforma();
  const addCommentMutation = useAddSectionComment();
  const updateApprovalMutation = useUpdateSectionApproval();
  const submitUpdateMutation = useSubmitTeacherUpdate();
  const addAttachmentMutation = useAddSectionAttachment();

  const [signedByName, setSignedByName] = useState("");
  const [notes, setNotes] = useState({});
  const [draftQty, setDraftQty] = useState({});
  const [draftFiles, setDraftFiles] = useState({});
  const [draftTravelMode, setDraftTravelMode] = useState({});
  const [draftActualAmount, setDraftActualAmount] = useState({});
  const [savingSection, setSavingSection] = useState(null);

  useEffect(() => {
    if (proforma?.proforma_number) {
      updateBreadcrumbs([
        { label: "My Invoices", path: "/teacher/proforma-invoices", navigable: true },
        { label: proforma.proforma_number },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [proforma, updateBreadcrumbs]);

  const signed =
    proforma?.digital_signature?.is_signed ||
    ["TEACHER_SIGNED_APPROVED", "MOVED_TO_FINANCE", "PAID"].includes(proforma?.status);

  const itemsByType = useMemo(() => {
    const map = {};
    SECTION_KEYS.forEach((k) => {
      map[k] = (proforma?.items || []).filter((i) => i.item_type === k);
    });
    return map;
  }, [proforma]);

  const dual = proforma?.dual_section_approvals || {};

  const sectionIsActive = (sec) => {
    const totalKey = SECTIONS.find((s) => s.key === sec)?.totalKey;
    if (totalKey && Number(proforma?.[totalKey] || 0) > 0) return true;
    return (itemsByType[sec] || []).some(
      (i) => Number(i.line_total) > 0 || Number(i.unit_rate) > 0
    );
  };

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
  const allAccepted = activeSections.every((k) => dual[k]?.admin_approved);

  const anyDirty = useMemo(
    () =>
      SECTION_KEYS.some((k) => {
        const item = (itemsByType[k] || [])[0];
        const qtyDirty = draftQty[k] != null && Number(draftQty[k]) !== savedQty(item);
        const priorMode = item ? travelModeOf(item) : "";
        const modeDirty =
          k === "TRAVEL" &&
          draftTravelMode[k] != null &&
          draftTravelMode[k] !== priorMode;
        const amountDirty =
          k === "TRAVEL" &&
          draftActualAmount[k] != null &&
          String(draftActualAmount[k]).trim() !== "" &&
          Number(draftActualAmount[k]) !== Number(item?.line_total || 0);
        return qtyDirty || modeDirty || amountDirty || (draftFiles[k] || []).length > 0;
      }),
    [draftQty, draftFiles, draftTravelMode, draftActualAmount, itemsByType]
  );

  const missingReceipts = useMemo(() => {
    if (!proforma) return [];
    const policy = proforma.proof_policy || {};
    const toggles = proforma.category_toggles || {};
    const needed = [];

    if (Number(proforma.travel_total) > 0 && toggles.travel_enabled !== false) {
      const travelItem = (itemsByType.TRAVEL || [])[0];
      const mode = String(draftTravelMode.TRAVEL || travelItem?.travel_mode || "ROAD").toLowerCase();
      const modeKey = ["road", "rail", "flight"].includes(mode) ? mode : "road";
      if (policy.travel?.[modeKey]?.proof_required === true) needed.push("TRAVEL");
    }
    if (
      Number(proforma.stay_total) > 0 &&
      toggles.stay_enabled !== false &&
      policy.stay?.requires_receipt === true
    ) {
      needed.push("STAY");
    }
    if (
      Number(proforma.miscellaneous_total) > 0 &&
      toggles.miscellaneous_enabled !== false &&
      policy.miscellaneous?.proof_required === true
    ) {
      needed.push("MISCELLANEOUS");
    }

    return needed.filter((sec) => {
      const saved = (itemsByType[sec] || []).some((i) => (i.attachments || []).length > 0);
      const draft = (draftFiles[sec] || []).length > 0;
      return !saved && !draft;
    });
  }, [proforma, itemsByType, draftFiles, draftTravelMode]);

  const canSign = !signed && !anyDirty && allConfirmed && allAccepted && missingReceipts.length === 0;
  const badge = statusBadge(proforma);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Loading your proforma invoice...</p>
      </div>
    );
  }

  if (isError || !proforma) {
    return (
      <div className="space-y-4 mt-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/teacher/proforma-invoices" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Invoices
        </Button>
        <div className="p-8 border border-destructive/20 bg-destructive/10 rounded-2xl text-center text-destructive">
          Failed to load proforma invoice: {error?.message || "Invoice not found"}
        </div>
      </div>
    );
  }

  const isSectionDirty = (sec) => {
    const item = (itemsByType[sec] || [])[0];
    const qtyDirty = draftQty[sec] != null && Number(draftQty[sec]) !== savedQty(item);
    const priorMode = item ? travelModeOf(item) : "";
    const modeDirty =
      sec === "TRAVEL" &&
      draftTravelMode[sec] != null &&
      draftTravelMode[sec] !== priorMode;
    const amountDirty =
      sec === "TRAVEL" &&
      draftActualAmount[sec] != null &&
      String(draftActualAmount[sec]).trim() !== "" &&
      Number(draftActualAmount[sec]) !== Number(item?.line_total || 0);
    return qtyDirty || modeDirty || amountDirty || (draftFiles[sec] || []).length > 0;
  };

  const displayQty = (sec) => (draftQty[sec] != null ? draftQty[sec] : savedQty((itemsByType[sec] || [])[0]));

  const displayTravelMode = (item) => {
    if (draftTravelMode.TRAVEL) return draftTravelMode.TRAVEL;
    if (item) return travelModeOf(item);
    return "";
  };

  const discardSection = (sec) => {
    setDraftQty((prev) => {
      const next = { ...prev };
      delete next[sec];
      return next;
    });
    setDraftFiles((prev) => {
      const next = { ...prev };
      delete next[sec];
      return next;
    });
    if (sec === "TRAVEL") {
      setDraftTravelMode((prev) => {
        const next = { ...prev };
        delete next.TRAVEL;
        return next;
      });
      setDraftActualAmount((prev) => {
        const next = { ...prev };
        delete next.TRAVEL;
        return next;
      });
    }
  };

  const saveSection = (sec) => {
    const item = (itemsByType[sec] || [])[0];
    const files = draftFiles[sec] || [];

    if (sec === "TRAVEL") {
      const mode = displayTravelMode(item);
      const priorMode = item ? travelModeOf(item) : "";
      const modeChanged = Boolean(mode) && mode !== priorMode;
      const creatingTravel = !item && ["RAIL", "FLIGHT"].includes(mode);
      const amountRaw =
        draftActualAmount.TRAVEL != null && String(draftActualAmount.TRAVEL).trim() !== ""
          ? Number(draftActualAmount.TRAVEL)
          : Number(item?.line_total || 0);
      const amount = amountRaw;
      const amountChanged =
        ["RAIL", "FLIGHT"].includes(mode) &&
        draftActualAmount.TRAVEL != null &&
        String(draftActualAmount.TRAVEL).trim() !== "" &&
        Number(amount) !== Number(item?.line_total || 0);

      if (!modeChanged && !amountChanged && !creatingTravel && files.length === 0) return;

      if (creatingTravel || ["RAIL", "FLIGHT"].includes(mode)) {
        if (!["RAIL", "FLIGHT"].includes(mode)) {
          toast.error("Select Rail or Flight");
          return;
        }
        if (!amount || amount <= 0) {
          toast.error("Enter the ticket cost for Rail or Flight");
          return;
        }
        const modeKey = mode.toLowerCase();
        const needsProof = proforma.proof_policy?.travel?.[modeKey]?.proof_required === true;
        const hasProof = (item?.attachments || []).length > 0 || files.length > 0;
        if (needsProof && !hasProof) {
          toast.error("Attach proof (ticket/receipt) for Rail or Flight");
          return;
        }
      }

      if (mode === "ROAD" && !item) {
        toast.error("Road travel needs a calculated distance. Choose Rail or Flight instead.");
        return;
      }

      const section_updates =
        modeChanged || amountChanged || creatingTravel
          ? [
              {
                section: "TRAVEL",
                travel_mode: mode,
                ...(mode === "ROAD" ? {} : { actual_amount: amount, multiplier: 1 }),
              },
            ]
          : [];

      if (section_updates.length === 0 && files.length === 0) return;

      setSavingSection(sec);
      submitUpdateMutation.mutate(
        {
          id: proforma._id,
          data: {
            section_updates,
            attachments: files.length ? [{ section: "TRAVEL", files }] : [],
            reason: creatingTravel
              ? `Teacher added travel (${mode})`
              : modeChanged
                ? `Teacher switched travel to ${mode}`
                : files.length
                  ? "Teacher attached travel documents"
                  : "Teacher updated travel",
          },
        },
        {
          onSettled: () => setSavingSection(null),
          onSuccess: () => discardSection(sec),
        }
      );
      return;
    }

    const qty = Number(displayQty(sec));
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    const qtyChanged = qty !== savedQty(item);
    if (!qtyChanged && files.length === 0) return;

    setSavingSection(sec);
    submitUpdateMutation.mutate(
      {
        id: proforma._id,
        data: {
          section_updates: qtyChanged ? [{ section: sec, multiplier: qty }] : [],
          attachments: files.length ? [{ section: sec, files }] : [],
        },
      },
      {
        onSettled: () => setSavingSection(null),
        onSuccess: () => discardSection(sec),
      }
    );
  };

  const confirmSection = (sec) => {
    if (isSectionDirty(sec)) {
      toast.error("Save your changes first");
      return;
    }
    if (dual[sec]?.teacher_approved) return;
    updateApprovalMutation.mutate({
      id: proforma._id,
      section: sec,
      action: "APPROVE",
      notes: `Teacher confirmed ${sec}`,
    });
  };

  const sign = () => {
    if (!signedByName.trim()) {
      toast.error("Type your full legal name");
      return;
    }
    if (!canSign) {
      toast.error("Confirm all sections and wait for admin accept before signing");
      return;
    }
    signMutation.mutate({ id: proforma._id, data: { signed_by_name: signedByName.trim() } });
  };

  return (
    <div className="space-y-6 mt-4 pb-12 w-full max-w-full">
      {/* Header — matches list/detail pages */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground font-mono">{proforma.proforma_number}</h1>
              <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {proforma.planning_id?.title || proforma.planning_id?.description || "Course"}
              {" · "}
              <span className="font-semibold text-foreground">
                {proforma.planning_id?.city || proforma.region_snapshot_name || "—"}
              </span>
              {" · "}
              <span className="font-mono font-semibold text-foreground">
                €{Number(proforma.grand_total || 0).toFixed(2)}
              </span>
            </p>
            {proforma.last_revision?.reason && proforma.last_revision?.requested_by_role === "BACKOFFICE" && (
              <p className="text-xs text-amber-700 mt-1">Admin note: {proforma.last_revision.reason}</p>
            )}
          </div>
        </div>
      </div>

      <ProformaLatestChangeBanner proforma={proforma} viewerRole="TEACHER" />

      {/* Sections */}
      <div className="space-y-6">
        {visibleSections.map((sec) => {
          const items = itemsByType[sec.key] || [];
          const item = items[0];
          const comments = (proforma.section_comments || []).filter((c) => c.section === sec.key);
          const savedDocs = items.flatMap((i) => i.attachments || []);
          const pending = draftFiles[sec.key] || [];
          const dirty = isSectionDirty(sec.key);
          const teacherOk = dual[sec.key]?.teacher_approved;
          const adminOk = dual[sec.key]?.admin_approved;
          const active = sectionIsActive(sec.key);
          const qty = displayQty(sec.key);
          const rate = Number(item?.unit_rate || 0);
          const preview = Math.round(rate * Number(qty || 0) * 100) / 100;
          const isSaving = savingSection === sec.key && submitUpdateMutation.isPending;

          return (
            <Card
              key={sec.key}
              className={`border overflow-hidden ${
                dirty ? "border-amber-400" : "border-border"
              }`}
            >
              <CardHeader className="py-3.5 px-5 bg-muted/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm font-bold text-foreground">{sec.title}</CardTitle>
                  <span className="font-mono text-xs font-bold text-foreground bg-background px-2.5 py-0.5 rounded border">
                    €{Number(proforma[sec.totalKey] || 0).toFixed(2)}
                  </span>
                  {!active ? (
                    <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-border text-muted-foreground bg-muted/50">
                      No amount — no confirm needed
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
                        {teacherOk ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />} Confirmed
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border flex items-center gap-1 ${
                          adminOk
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : "bg-gray-100 text-gray-700 border-gray-300"
                        }`}
                      >
                        {adminOk ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />} Admin accepted
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

                {!signed && active && (
                  <Button
                    size="sm"
                    variant={teacherOk ? "default" : "outline"}
                    className={
                      teacherOk
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold"
                        : "h-7 text-xs"
                    }
                    disabled={teacherOk || dirty}
                    onClick={() => confirmSection(sec.key)}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    {teacherOk ? "Confirmed" : "Confirm"}
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-0">
                <div className="p-5 space-y-4">
                  {item ? (
                    sec.key === "TRAVEL" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs uppercase font-semibold">Travel mode</Label>
                            <select
                              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                              disabled={signed}
                              value={displayTravelMode(item)}
                              onChange={(e) => {
                                const mode = e.target.value;
                                setDraftTravelMode((prev) => ({ ...prev, TRAVEL: mode }));
                                if (mode === "ROAD") {
                                  setDraftActualAmount((prev) => {
                                    const next = { ...prev };
                                    delete next.TRAVEL;
                                    return next;
                                  });
                                }
                              }}
                            >
                              <option value="ROAD">Road (formula)</option>
                              <option value="RAIL">Rail</option>
                              <option value="FLIGHT">Flight</option>
                            </select>
                          </div>

                          {displayTravelMode(item) === "ROAD" ? (
                            <>
                              <div>
                                <Label className="text-xs uppercase font-semibold">Distance (KM)</Label>
                                <Input
                                  value={Number(
                                    item.road_one_way_km && item.road_multiplier
                                      ? item.road_one_way_km * item.road_multiplier
                                      : item.road_calculated_total
                                      ? item.distance_km || item.road_one_way_km * 2
                                      : item.distance_km || item.road_one_way_km || 0
                                  ).toFixed(1)}
                                  disabled
                                  className="font-mono text-sm mt-1 bg-muted"
                                />
                              </div>
                              <div>
                                <Label className="text-xs uppercase font-semibold">Unit rate (€/km)</Label>
                                <Input
                                  value={Number(item.road_unit_rate || item.unit_rate || 0).toFixed(4)}
                                  disabled
                                  className="font-mono text-sm mt-1 bg-muted"
                                />
                              </div>
                              <div>
                                <Label className="text-xs uppercase font-semibold">Amount (€)</Label>
                                <Input
                                  value={Number(
                                    item.road_calculated_total || item.line_total || 0
                                  ).toFixed(2)}
                                  disabled
                                  className="font-mono text-sm mt-1 bg-muted"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <Label className="text-xs uppercase font-semibold">Amount (€)</Label>
                                <Input
                                  value={Number(
                                    draftActualAmount.TRAVEL != null && draftActualAmount.TRAVEL !== ""
                                      ? draftActualAmount.TRAVEL
                                      : item.line_total || 0
                                  ).toFixed(2)}
                                  disabled
                                  className="font-mono text-sm mt-1 bg-muted"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  Amount stays €{Number(item.line_total || 0).toFixed(2)} when you switch
                                  mode — only attach proof unless the ticket cost differs.
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs uppercase font-semibold">
                                  Override ticket cost (€)
                                  <span className="ml-1 font-normal normal-case text-muted-foreground">
                                    optional
                                  </span>
                                </Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  disabled={signed}
                                  placeholder={Number(item.line_total || 0).toFixed(2)}
                                  value={
                                    draftActualAmount.TRAVEL != null ? draftActualAmount.TRAVEL : ""
                                  }
                                  onChange={(e) =>
                                    setDraftActualAmount((prev) => ({
                                      ...prev,
                                      TRAVEL: e.target.value,
                                    }))
                                  }
                                  className="font-mono text-sm mt-1"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {displayTravelMode(item) === "ROAD"
                            ? item.calculation_breakdown ||
                              (item.road_one_way_km
                                ? `${item.road_one_way_km} km × ${item.road_multiplier || 2} × €${Number(
                                    item.road_unit_rate || 0
                                  ).toFixed(4)}`
                                : item.description)
                            : `Mode: ${displayTravelMode(item).toLowerCase()} · amount €${Number(
                                draftActualAmount.TRAVEL != null && draftActualAmount.TRAVEL !== ""
                                  ? draftActualAmount.TRAVEL
                                  : item.line_total || 0
                              ).toFixed(2)} (unchanged unless you override)`}
                          {item.blocks_source ? ` · ${item.blocks_source}` : ""}
                        </p>
                        {displayTravelMode(item) === "ROAD" &&
                          (item.road_calculated_total != null || item.road_one_way_km) && (
                          <p className="text-xs text-emerald-700">
                            Road formula is saved on this invoice. Switching back to Road restores it.
                          </p>
                        )}
                        {["RAIL", "FLIGHT"].includes(displayTravelMode(item)) &&
                          proforma.proof_policy?.travel?.[displayTravelMode(item).toLowerCase()]
                            ?.proof_required === true && (
                          <p className="text-xs text-amber-700">
                            Attach ticket/receipt proof below before saving Rail or Flight.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs uppercase font-semibold">{sec.qtyLabel}</Label>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={qty}
                            disabled={signed}
                            onChange={(e) =>
                              setDraftQty((prev) => ({ ...prev, [sec.key]: e.target.value }))
                            }
                            className="font-mono text-sm mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs uppercase font-semibold">Unit Rate (€)</Label>
                          <Input
                            value={rate.toFixed(2)}
                            disabled
                            className="font-mono text-sm mt-1 bg-muted"
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
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                    )
                  ) : sec.key === "TRAVEL" && !signed ? (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        No road distance was calculated for this planning. You can still claim Rail or
                        Flight travel with ticket cost and proof.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs uppercase font-semibold">Travel mode</Label>
                          <select
                            className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                            value={displayTravelMode(null)}
                            onChange={(e) =>
                              setDraftTravelMode((prev) => ({ ...prev, TRAVEL: e.target.value }))
                            }
                          >
                            <option value="">Select mode…</option>
                            <option value="RAIL">Rail</option>
                            <option value="FLIGHT">Flight</option>
                          </select>
                        </div>
                        {["RAIL", "FLIGHT"].includes(displayTravelMode(null)) && (
                          <div>
                            <Label className="text-xs uppercase font-semibold">Ticket cost (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={draftActualAmount.TRAVEL ?? ""}
                              onChange={(e) =>
                                setDraftActualAmount((prev) => ({
                                  ...prev,
                                  TRAVEL: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                              className="font-mono text-sm mt-1"
                            />
                          </div>
                        )}
                      </div>
                      {["RAIL", "FLIGHT"].includes(displayTravelMode(null)) &&
                        proforma.proof_policy?.travel?.[displayTravelMode(null).toLowerCase()]
                          ?.proof_required === true && (
                          <p className="text-xs text-amber-700">
                            Attach ticket/receipt proof below, then Save changes.
                          </p>
                        )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No line items for this section.</p>
                  )}

                  <div>
                    <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" /> Documents
                    </p>
                    {pending.length > 0 && (
                      <ul className="mb-2 space-y-1.5">
                        {pending.map((f, idx) => (
                          <li
                            key={`${f.file_url}-${idx}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs"
                          >
                            <span className="flex items-center gap-1.5 truncate text-amber-900 font-medium">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              {f.file_name}
                              <span className="font-normal opacity-70">· not saved</span>
                            </span>
                            <button
                              type="button"
                              className="p-1 text-amber-700 hover:text-red-600"
                              onClick={() =>
                                setDraftFiles((prev) => ({
                                  ...prev,
                                  [sec.key]: (prev[sec.key] || []).filter((_, i) => i !== idx),
                                }))
                              }
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <MultiFileSectionUploader
                      sectionKey={sec.key}
                      existingAttachments={savedDocs}
                      disabled={signed || addAttachmentMutation.isPending}
                      successToastMessage={false}
                      onUploadSuccess={(files) => {
                        if (!files?.length || !proforma?._id) return;
                        // Persist immediately so admin can see docs without a separate Save
                        addAttachmentMutation.mutate(
                          { id: proforma._id, section: sec.key, files },
                          {
                            onError: () => {
                              // Fallback: keep as draft so teacher can still Save changes
                              setDraftFiles((prev) => ({
                                ...prev,
                                [sec.key]: [...(prev[sec.key] || []), ...files],
                              }));
                            },
                          }
                        );
                      }}
                    />
                  </div>
                </div>

                {dirty && !signed && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 bg-amber-50 border-t border-amber-200">
                    <p className="text-xs font-medium text-amber-900">
                      Unsaved changes
                      {pending.length > 0 ? ` · ${pending.length} file(s)` : ""}
                      {sec.key === "TRAVEL" &&
                      draftTravelMode.TRAVEL &&
                      draftTravelMode.TRAVEL !== travelModeOf(item)
                        ? " · travel mode"
                        : ""}
                      {sec.key !== "TRAVEL" &&
                      draftQty[sec.key] != null &&
                      Number(draftQty[sec.key]) !== savedQty(item)
                        ? " · quantity"
                        : ""}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => discardSection(sec.key)}
                        disabled={isSaving}
                      >
                        Discard
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        onClick={() => saveSection(sec.key)}
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
                  disabled={signed}
                  pending={addCommentMutation.isPending}
                  myRole="TEACHER"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sign — same Card pattern as rest of app */}
      <Card className="border border-emerald-500/30">
        <CardHeader className="py-4 px-5 border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <PenTool className="w-5 h-5" /> Digital signature
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {signed ? (
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">Signed</p>
                <p className="text-xs text-muted-foreground">
                  {proforma.digital_signature?.signed_by_name}
                  {proforma.digital_signature?.signed_at && (
                    <>
                      {" · "}
                      {new Date(proforma.digital_signature.signed_at).toLocaleDateString()}
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-xs">
                <p className="font-semibold text-foreground text-sm">Before you can sign</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    {anyDirty ? (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {anyDirty ? "Save all unsaved section changes" : "No unsaved changes"}
                  </li>
                  <li className="flex items-center gap-2">
                    {allConfirmed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    Confirm every section with an amount
                    {!allConfirmed && (
                      <span className="font-mono">
                        ({activeSections.filter((k) => dual[k]?.teacher_approved).length}/{activeSections.length})
                      </span>
                    )}
                  </li>
                  <li className="flex items-center gap-2">
                    {allAccepted ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    Admin accepts every section with an amount
                    {!allAccepted && (
                      <span className="font-mono">
                        ({activeSections.filter((k) => dual[k]?.admin_approved).length}/{activeSections.length})
                      </span>
                    )}
                  </li>
                  {missingReceipts.length > 0 && (
                    <li className="flex items-center gap-2 text-amber-700">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attach receipts for: {missingReceipts.join(", ")}
                    </li>
                  )}
                </ul>
              </div>

              {canSign && (
                <p className="text-xs text-emerald-700 font-medium">
                  All checks passed. Enter your full legal name and sign.
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 max-w-md space-y-1.5">
                  <Label className="text-xs uppercase font-semibold">Full legal name</Label>
                  <Input
                    type="text"
                    placeholder="Type your full legal name"
                    value={signedByName}
                    onChange={(e) => setSignedByName(e.target.value)}
                    className="font-semibold text-sm"
                    disabled={!canSign}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={sign}
                    disabled={!canSign || !signedByName.trim() || signMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 h-10"
                  >
                    {signMutation.isPending ? "Signing..." : "Sign invoice"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ProformaActivityLog logs={proforma.audit_logs} />
    </div>
  );
}
