import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useGetProformaById,
  useSignProforma,
  useUpdateSectionApproval,
  useSubmitTeacherUpdate,
  useAddProformaLineItem,
  useUpdateProformaLineItem,
  useRemoveProformaLineItem,
  useSetActiveTravelMode,
  useAddSectionComment,
  useAddSectionAttachment,
} from "@/store/useProformaStore";
import { getActiveTravelMode, activeTravelModeLabel } from "@/utils/proformaTravelMode";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Paperclip,
  Download,
  PenTool,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import MultiFileSectionUploader from "@/components/common/MultiFileSectionUploader";
import ProformaSectionNotes from "@/components/proforma/ProformaSectionNotes";
import ProformaActivityLog, { ProformaLatestChangeBanner } from "@/components/proforma/ProformaActivityLog";
import ProformaTravelRoadCard from "@/components/proforma/ProformaTravelRoadCard";
import ProformaTravelFixedCard from "@/components/proforma/ProformaTravelFixedCard";
import ProformaContextSummary from "@/components/proforma/ProformaContextSummary";
import ProformaSignDialog from "@/components/proforma/ProformaSignDialog";
import ProformaEditableClaimRow from "@/components/proforma/ProformaEditableClaimRow";
import {
  ProformaInvoiceDocument,
  downloadProformaInvoicePdf,
} from "@/components/admin/ProformaInvoiceDocument";

const SECTION_KEYS = ["TEACHING", "TRAVEL", "FOOD", "STAY", "MISCELLANEOUS"];

const CATEGORY_TOGGLE_KEY = {
  TRAVEL: "travel_enabled",
  FOOD: "food_enabled",
  STAY: "stay_enabled",
  MISCELLANEOUS: "miscellaneous_enabled",
};

const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

const statusBadge = (p) => {
  if (p?.status === "MOVED_TO_FINANCE" || p?.status === "PAID") {
    return { label: "In Finance", className: "bg-purple-100 text-purple-800 border-purple-300" };
  }
  if (p?.digital_signature?.is_signed || p?.status === "TEACHER_SIGNED_APPROVED") {
    return { label: "Signed — awaiting admin", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
  if (p?.workflow_next_actor === "ADMIN" && p?.status === "CHANGE_REQUESTED") {
    return { label: "Awaiting admin acceptance", className: "bg-orange-100 text-orange-800 border-orange-300" };
  }
  if (p?.workflow_next_actor === "TEACHER" && p?.last_revision?.requested_by_role === "BACKOFFICE") {
    return { label: "Admin sent back — review", className: "bg-orange-100 text-orange-800 border-orange-300" };
  }
  return { label: "Needs confirm & sign", className: "bg-amber-100 text-amber-800 border-amber-300" };
};

export default function TeacherProformaDetailPage() {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params?.id || params?.["$id"];
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const { data: responseData, isLoading, isError, error } = useGetProformaById(id, {
    enabled: Boolean(id),
  });
  const proforma = responseData?.data || responseData;

  const signMutation = useSignProforma();
  const updateApprovalMutation = useUpdateSectionApproval();
  const submitUpdateMutation = useSubmitTeacherUpdate();
  const addItemMutation = useAddProformaLineItem();
  const updateItemMutation = useUpdateProformaLineItem();
  const removeItemMutation = useRemoveProformaLineItem();
  const setTravelModeMutation = useSetActiveTravelMode();
  const addCommentMutation = useAddSectionComment();
  const addAttachmentMutation = useAddSectionAttachment();

  const [showSignDialog, setShowSignDialog] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [travelTab, setTravelTab] = useState("ROAD");
  const [editingTeaching, setEditingTeaching] = useState(false);
  const [teachingBlocks, setTeachingBlocks] = useState("");
  const [teachingNote, setTeachingNote] = useState("");
  const [editingFood, setEditingFood] = useState(false);
  const [foodDays, setFoodDays] = useState("");
  const [ticketForm, setTicketForm] = useState({ description: "", amount: "", files: [] });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [itemForm, setItemForm] = useState({ description: "", amount: "", files: [] });
  const [addingSection, setAddingSection] = useState(null); // STAY | MISCELLANEOUS
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (proforma?.proforma_number) {
      updateBreadcrumbs([
        { label: t("proforma.myInvoicesShort"), path: "/teacher/proforma-invoices", navigable: true },
        { label: proforma.proforma_number },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [proforma, updateBreadcrumbs, t]);

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
  const pendingChanges = (proforma?.pending_teacher_changes || []).filter((c) => c.status === "PENDING");
  const teachingPending = pendingChanges.find((c) => c.section === "TEACHING");
  const teachingItem = (itemsByType.TEACHING || [])[0];
  const foodLine = (itemsByType.FOOD || [])[0];
  const hasPendingFor = (section) => pendingChanges.some((c) => c.section === section);
  const hasAnyPending = pendingChanges.length > 0;
  const latestRejectedFor = (section) => {
    const rejected = (proforma?.pending_teacher_changes || [])
      .filter((c) => c.section === section && c.status === "REJECTED")
      .sort(
        (a, b) =>
          new Date(b.resolved_at || b.requested_at || 0) - new Date(a.resolved_at || a.requested_at || 0)
      );
    const latest = rejected[0];
    if (!latest) return null;
    // Only surface if this section was part of the latest admin action
    if (
      Array.isArray(proforma?.last_revision?.sections) &&
      !proforma.last_revision.sections.includes(section)
    ) {
      return null;
    }
    return latest;
  };

  const RejectedUpdateBanner = ({ section }) => {
    if (hasPendingFor(section)) return null;
    const rejected = latestRejectedFor(section);
    if (!rejected) return null;
    const reason = rejected.reject_reason || rejected.note || "";
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 space-y-0.5">
        <p className="font-semibold">Admin rejected your update</p>
        {reason ? <p className="text-rose-800/90">Reason: {reason.replace(/^Rejected:\s*/i, "")}</p> : null}
      </div>
    );
  };
  /** Any teacher save that changes amounts is a Request for update until admin Accepts */
  const requestUpdateLabel = () => "Request for update";

  const roadLine = (itemsByType.TRAVEL || []).find((i) => (i.travel_mode || "ROAD") === "ROAD");
  const fixedTravelLines = (itemsByType.TRAVEL || []).filter(
    (i) => String(i.travel_mode || "").toUpperCase() === "FIXED"
  );
  const railTickets = (itemsByType.TRAVEL || []).filter((i) => i.travel_mode === "RAIL");
  const airTickets = (itemsByType.TRAVEL || []).filter((i) => i.travel_mode === "FLIGHT");
  const activeTravelMode = useMemo(
    () => getActiveTravelMode(itemsByType.TRAVEL || []),
    [itemsByType.TRAVEL]
  );
  const primaryTravelKey = fixedTravelLines.length > 0 ? "FIXED" : "ROAD";
  const ticketsActive = activeTravelMode === "RAIL" || activeTravelMode === "FLIGHT";
  const roadSuperseded = ticketsActive && Boolean(roadLine);

  const travelTabs = useMemo(() => {
    const primary =
      fixedTravelLines.length > 0
        ? { key: "FIXED", label: "Fixed module" }
        : { key: "ROAD", label: "Road" };
    return [primary, { key: "RAIL", label: "Rail" }, { key: "FLIGHT", label: "Air" }];
  }, [fixedTravelLines.length]);

  const usePrimaryTravelAllowance = () => {
    if (signed) return;
    setBusy(true);
    setTravelModeMutation.mutate(
      { id: proforma._id, travel_mode: primaryTravelKey, silent: true },
      {
        onSettled: () => setBusy(false),
        onSuccess: () => {
          setTravelTab(primaryTravelKey);
          toast.success(
            `Switched to ${primaryTravelKey === "FIXED" ? "fixed module" : "road"} allowance — tickets removed`
          );
        },
      }
    );
  };

  // Land on the billed travel mode whenever it changes (invoice load / mode switch)
  useEffect(() => {
    if (!proforma?._id || !activeTravelMode) return;
    setTravelTab(activeTravelMode);
    setShowTicketForm(false);
  }, [proforma?._id, activeTravelMode]);

  useEffect(() => {
    const primaryKey = fixedTravelLines.length > 0 ? "FIXED" : "ROAD";
    if (
      travelTab === "WEEKEND" ||
      (travelTab === "FIXED" && fixedTravelLines.length === 0) ||
      (travelTab === "ROAD" && !roadLine && fixedTravelLines.length > 0)
    ) {
      setTravelTab(primaryKey);
    }
  }, [fixedTravelLines.length, roadLine, travelTab]);

  const roadReferenceTotal = useMemo(() => {
    if (!roadLine) return 0;
    const snap = Number(roadLine.road_calculated_total) || 0;
    if (snap > 0) return snap;
    const oneWay = Number(roadLine.road_one_way_km) || 0;
    const trip = Number(roadLine.road_multiplier) || 2;
    const rate = Number(roadLine.road_unit_rate ?? roadLine.unit_rate) || 0;
    return Math.round(oneWay * trip * rate * 100) / 100;
  }, [roadLine]);

  const fixedReferenceTotal = useMemo(() => {
    return fixedTravelLines.reduce(
      (acc, line) => acc + (Number(line.road_calculated_total) || Number(line.line_total) || 0),
      0
    );
  }, [fixedTravelLines]);

  const sectionIsActive = (sec) => {
    const totals = {
      TEACHING: proforma?.teaching_total,
      TRAVEL: proforma?.travel_total,
      FOOD: proforma?.food_total,
      STAY: proforma?.stay_total,
      MISCELLANEOUS: proforma?.miscellaneous_total,
    };
    if (Number(totals[sec] || 0) > 0) return true;
    return (itemsByType[sec] || []).some((i) => Number(i.line_total) > 0);
  };

  const sectionIsVisible = (sec) => {
    if (sec === "TEACHING") return true;
    const toggleKey = CATEGORY_TOGGLE_KEY[sec];
    if (!toggleKey) return true;
    const enabled = proforma?.category_toggles?.[toggleKey];
    if (enabled === false) return sectionIsActive(sec);
    return true;
  };

  const activeSections = SECTION_KEYS.filter((k) => sectionIsVisible(k) && sectionIsActive(k));
  const allConfirmed = activeSections.every((k) => dual[k]?.teacher_approved);

  const missingReceipts = useMemo(() => {
    if (!proforma) return [];
    const policy = proforma.proof_policy || {};
    const needed = [];

    const travelLines = (itemsByType.TRAVEL || []).filter((i) => Number(i.line_total) > 0);
    const travelNeeds = travelLines.some((item) => {
      const mode = String(item.travel_mode || "ROAD").toLowerCase();
      if (mode === "fixed") return false;
      const modeKey = ["road", "rail", "flight"].includes(mode) ? mode : "road";
      if (policy.travel?.[modeKey]?.proof_required !== true) return false;
      return !(item.attachments || []).length;
    });
    if (travelNeeds) needed.push("TRAVEL");

    if (
      Number(proforma.stay_total) > 0 &&
      policy.stay?.requires_receipt === true &&
      !(itemsByType.STAY || []).some((i) => (i.attachments || []).length)
    ) {
      needed.push("STAY");
    }
    if (
      Number(proforma.food_total) > 0 &&
      policy.food?.requires_receipt === true &&
      !(itemsByType.FOOD || []).some((i) => (i.attachments || []).length)
    ) {
      needed.push("FOOD");
    }
    if (
      Number(proforma.miscellaneous_total) > 0 &&
      policy.miscellaneous?.proof_required === true &&
      !(itemsByType.MISCELLANEOUS || []).some((i) => (i.attachments || []).length)
    ) {
      needed.push("MISCELLANEOUS");
    }
    return needed;
  }, [proforma, itemsByType]);

  const canSign =
    !signed &&
    allConfirmed &&
    !hasAnyPending &&
    missingReceipts.length === 0;

  const badge = statusBadge(proforma);

  // Admin note / change request (last_revision) — teacher must revise & re-confirm
  const adminQuery = useMemo(() => {
    if (!proforma) return null;
    const awaitingTeacher =
      proforma.status === "CHANGE_REQUESTED" ||
      (proforma.workflow_next_actor === "TEACHER" &&
        (proforma.last_revision?.requested_by_role === "BACKOFFICE" ||
          proforma.last_revision?.requested_by_role === "ADMIN"));

    const rev = proforma.last_revision;
    const revIsAdmin =
      rev &&
      (rev.requested_by_role === "BACKOFFICE" || rev.requested_by_role === "ADMIN") &&
      rev.reason;
    if (revIsAdmin) {
      return {
        reason: rev.reason,
        sections: rev.sections || [],
        name: rev.requested_by_name || "Admin",
        at: rev.requested_at,
      };
    }

    if (!awaitingTeacher) return null;

    // Legacy: older invoices may only have SENT_BACK audit
    const logs = [...(proforma.audit_logs || [])]
      .filter((l) => l.action === "SENT_BACK_TO_TEACHER")
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const latest = logs[0];
    if (!latest) return null;
    return {
      reason:
        latest.notes?.replace(/^Admin sent back sections \[[^\]]+\]:\s*/, "") ||
        latest.notes ||
        "Please revise",
      sections: [],
      name: latest.performed_by_name || "Admin",
      at: latest.timestamp,
    };
  }, [proforma]);

  const commentsFor = (sec) => (proforma?.section_comments || []).filter((c) => c.section === sec);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">{t("proforma.loadingYour")}</p>
      </div>
    );
  }

  if (isError || !proforma) {
    return (
      <div className="space-y-4 mt-6">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/teacher/proforma-invoices" })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("proforma.backToMyInvoices")}
        </Button>
        <div className="p-8 border border-destructive/20 bg-destructive/10 rounded-2xl text-center text-destructive">
          {t("proforma.loadFailed")}: {error?.message || t("proforma.notFound")}
        </div>
      </div>
    );
  }

  const openTeachingEdit = () => {
    setTeachingBlocks(String(teachingItem?.blocks || teachingItem?.multiplier || 15));
    setTeachingNote(teachingPending?.note || "");
    setEditingTeaching(true);
  };

  const saveTeachingChange = () => {
    const blocks = Number(teachingBlocks);
    if (!blocks || blocks <= 0) {
      toast.error("Enter a valid number of blocks");
      return;
    }
    setBusy(true);
    submitUpdateMutation.mutate(
      {
        id: proforma._id,
        data: {
          section_updates: [
            {
              section: "TEACHING",
              multiplier: blocks,
              note: teachingNote.trim() || undefined,
            },
          ],
          reason: teachingNote.trim() || `Teaching blocks changed to ${blocks}`,
        },
        silent: true,
      },
      {
        onSettled: () => setBusy(false),
        onSuccess: () => {
          setEditingTeaching(false);
          toast.success("Update requested — awaiting admin acceptance");
        },
      }
    );
  };

  const saveFoodDays = () => {
    const days = Number(foodDays);
    if (Number.isNaN(days) || days < 0) {
      toast.error("Enter a valid number of days");
      return;
    }
    setBusy(true);
    const onDone = {
      onSettled: () => setBusy(false),
      onSuccess: () => {
        setEditingFood(false);
        toast.success("Update requested — awaiting admin acceptance");
      },
    };
    if (foodLine?._id) {
      updateItemMutation.mutate(
        {
          id: proforma._id,
          itemId: foodLine._id,
          data: { multiplier: days },
          silent: true,
        },
        onDone
      );
    } else {
      // No FOOD shell yet — create via teacher update with regional rate
      submitUpdateMutation.mutate(
        {
          id: proforma._id,
          data: {
            reason: "Set meal days",
            section_updates: [{ section: "FOOD", multiplier: days }],
          },
        },
        onDone
      );
    }
  };

  const updateClaimLine = async (itemId, section, data) => {
    setBusy(true);
    try {
      await updateItemMutation.mutateAsync({
        id: proforma._id,
        itemId,
        data,
        silent: true,
      });
      toast.success("Update requested — awaiting admin acceptance");
    } finally {
      setBusy(false);
    }
  };

  const saveTicket = () => {
    const mode = travelTab === "RAIL" ? "RAIL" : "FLIGHT";
    const amount = Number(ticketForm.amount);
    if (!ticketForm.description.trim()) {
      toast.error("Enter a ticket description");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter the ticket amount");
      return;
    }
    const needsProof = proforma.proof_policy?.travel?.[mode.toLowerCase()]?.proof_required === true;
    if (needsProof && !(ticketForm.files || []).length) {
      toast.error("Attach the ticket / receipt");
      return;
    }
    setBusy(true);
    addItemMutation.mutate(
      {
        id: proforma._id,
        data: {
          section: "TRAVEL",
          travel_mode: mode,
          description: ticketForm.description.trim(),
          amount,
          attachments: ticketForm.files || [],
        },
      },
      {
        onSettled: () => setBusy(false),
        onSuccess: () => {
          setTicketForm({ description: "", amount: "", files: [] });
          setShowTicketForm(false);
          toast.success("Update requested — awaiting admin acceptance");
        },
      }
    );
  };

  const saveClaimItem = (section) => {
    const amount = Number(itemForm.amount);
    if (!itemForm.description.trim()) {
      toast.error("Enter a description");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    const policy = proforma.proof_policy || {};
    const needsProof =
      (section === "STAY" && policy.stay?.requires_receipt) ||
      (section === "MISCELLANEOUS" && policy.miscellaneous?.proof_required) ||
      (section === "FOOD" && Number(proforma?.food_total) > 0 && policy.food?.requires_receipt);
    if (needsProof && !(itemForm.files || []).length) {
      toast.error("Attach a receipt / proof");
      return;
    }
    setBusy(true);
    addItemMutation.mutate(
      {
        id: proforma._id,
        data: {
          section,
          description: itemForm.description.trim(),
          amount,
          attachments: itemForm.files || [],
        },
      },
      {
        onSettled: () => setBusy(false),
        onSuccess: () => {
          setItemForm({ description: "", amount: "", files: [] });
          setAddingSection(null);
          toast.success("Update requested — awaiting admin acceptance");
        },
      }
    );
  };

  const removeItem = (itemId) => {
    setBusy(true);
    removeItemMutation.mutate(
      { id: proforma._id, itemId },
      { onSettled: () => setBusy(false) }
    );
  };

  const confirmSection = (sec) => {
    if (dual[sec]?.teacher_approved) return;
    if (hasPendingFor(sec)) {
      toast.error("Admin must accept your update request before you can confirm this section");
      return;
    }
    updateApprovalMutation.mutate({
      id: proforma._id,
      section: sec,
      action: "APPROVE",
      notes: `Teacher confirmed ${sec}`,
    });
  };

  const confirmAllAndPrepareSign = async () => {
    for (const sec of activeSections) {
      if (hasPendingFor(sec)) {
        throw new Error(`Admin must accept your update for ${sec} before you can confirm`);
      }
      if (!dual[sec]?.teacher_approved) {
        await updateApprovalMutation.mutateAsync({
          id: proforma._id,
          section: sec,
          action: "APPROVE",
          notes: `Teacher confirmed ${sec}`,
        });
      }
    }
  };

  const openSignDialog = () => {
    if (hasAnyPending) {
      toast.error("Admin must accept your update requests before you can sign");
      return;
    }
    if (!allConfirmed) {
      toast.error("Confirm all sections with amounts first");
      return;
    }
    if (missingReceipts.length > 0) {
      toast.error(`Attach receipts for: ${missingReceipts.join(", ")}`);
      return;
    }
    setShowSignDialog(true);
  };

  const sign = async (payload) => {
    try {
      setBusy(true);
      await confirmAllAndPrepareSign();
      const response = await signMutation.mutateAsync({
        id: proforma._id,
        data: payload,
      });
      return response?.data || response;
    } catch (err) {
      toast.error(err?.message || "Could not sign");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const downloadSignedPdf = async () => {
    try {
      setDownloadingPdf(true);
      // Allow mount of printable document before capture
      await new Promise((r) => requestAnimationFrame(() => r()));
      const ok = await downloadProformaInvoicePdf(proforma);
      if (!ok) toast.error("Could not prepare PDF");
    } catch (err) {
      toast.error(err?.message || "Could not download PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const renderTicketList = (tickets) => (
    <div className="space-y-2">
      {tickets.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No tickets added yet.</p>
      )}
      {tickets.map((t) => (
        <ProformaEditableClaimRow
          key={t._id}
          line={t}
          editable={!signed}
          busy={busy}
          modeBadge={t.travel_mode}
          onSave={(data) => updateClaimLine(t._id, "TRAVEL", data)}
          onRemove={!signed ? (itemId) => removeItem(itemId) : undefined}
        />
      ))}
    </div>
  );

  const startAddItem = (section) => {
    setAddingSection(section);
    setItemForm({ description: "", amount: "", files: [] });
  };

  const renderClaimList = (section, items, emptyLabel = "add items if needed") => (
    <div className="space-y-2">
      {items.length === 0 && addingSection !== section && (
        <p className="text-sm text-muted-foreground py-1">{eur(0)} — {emptyLabel}.</p>
      )}
      {items.map((t) => (
        <ProformaEditableClaimRow
          key={t._id}
          line={t}
          editable={!signed}
          busy={busy}
          onSave={(data) => updateClaimLine(t._id, section, data)}
          onRemove={!signed ? (itemId) => removeItem(itemId) : undefined}
        />
      ))}
      {!signed && addingSection === section && (
        <div className="rounded-lg border border-dashed border-border p-3 space-y-3 bg-background">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                className="mt-1"
                value={itemForm.description}
                onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={section === "STAY" ? "e.g. Hotel night" : "e.g. Parking"}
              />
            </div>
            <div>
              <Label className="text-xs">Amount (€)</Label>
              <Input
                className="mt-1"
                type="number"
                min="0"
                step="0.01"
                value={itemForm.amount}
                onChange={(e) => setItemForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
          </div>
          <MultiFileSectionUploader
            sectionKey={section}
            existingAttachments={itemForm.files}
            disabled={busy}
            successToastMessage={false}
            onUploadSuccess={(uploaded) =>
              setItemForm((p) => ({ ...p, files: [...(p.files || []), ...uploaded] }))
            }
            onRemoveAttachment={(doc) =>
              setItemForm((p) => ({
                ...p,
                files: (p.files || []).filter((f) => f.file_url !== doc.file_url),
              }))
            }
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => saveClaimItem(section)}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : requestUpdateLabel()}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAddingSection(null);
                setItemForm({ description: "", amount: "", files: [] });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const AddItemButton = ({ section, label = "Add item" }) =>
    !signed && addingSection !== section ? (
      <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={() => startAddItem(section)}>
        <Plus className="w-3.5 h-3.5 mr-1" /> {label}
      </Button>
    ) : null;

  const renderSectionNotes = (section) => (
    <ProformaSectionNotes
      comments={commentsFor(section)}
      value={notes[section] || ""}
      onChange={(v) => setNotes((prev) => ({ ...prev, [section]: v }))}
      onSend={() => {
        const comment = notes[section]?.trim();
        if (!comment) return;
        addCommentMutation.mutate(
          { id: proforma._id, section, comment },
          { onSuccess: () => setNotes((prev) => ({ ...prev, [section]: "" })) }
        );
      }}
      pending={addCommentMutation.isPending}
      myRole="TEACHER"
      disabled={signed}
      placeholder="Reply to admin or add a note…"
    />
  );

  /** Confirm + status chips for sections with amounts */
  const SectionConfirmControls = ({ section }) => {
    const active = sectionIsActive(section);
    if (!active) {
      return (
        <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-border text-muted-foreground bg-muted/50">
          No amount — no confirm needed
        </span>
      );
    }
    const teacherOk = dual[section]?.teacher_approved;
    const pending = hasPendingFor(section);
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
        {pending && (
          <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-orange-400 text-orange-900 bg-orange-50">
            Awaiting admin acceptance
          </span>
        )}
        <span
          className={`px-2 py-0.5 text-[11px] rounded-full font-semibold border flex items-center gap-1 ${
            teacherOk
              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
              : "bg-gray-100 text-gray-700 border-gray-300"
          }`}
        >
          {teacherOk ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />} Confirmed
        </span>
        {!signed && (
          <Button
            size="sm"
            variant={teacherOk ? "default" : "outline"}
            className={
              teacherOk
                ? "bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold"
                : "h-7 text-xs"
            }
            disabled={teacherOk || pending || updateApprovalMutation.isPending}
            title={pending ? "Admin must accept your update first" : undefined}
            onClick={() => confirmSection(section)}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {teacherOk ? "Confirmed" : "Confirm"}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 mt-4 pb-12 w-full max-w-full">
      {/* Header — same shell as list / admin detail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-foreground font-mono">{proforma.proforma_number}</h1>
            <span className={`px-2.5 py-0.5 text-xs rounded-full font-semibold border ${badge.className}`}>
              {badge.label}
            </span>
            <span className="font-mono text-sm font-bold text-foreground">{eur(proforma.grand_total)}</span>
          </div>
        </div>

        {!signed && (
          <div className="flex flex-col sm:items-end gap-2 min-w-[220px]">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={busy || !canSign}
              onClick={openSignDialog}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PenTool className="w-4 h-4 mr-2" />
              )}
              {t("proforma.previewAndSign")}
            </Button>
            {!allConfirmed && (
              <p className="text-[11px] text-muted-foreground text-right max-w-xs">
                Confirm each section with an amount, then preview and sign.
              </p>
            )}
            {allConfirmed && missingReceipts.length > 0 && (
              <p className="text-[11px] text-muted-foreground text-right max-w-xs">
                Attach required receipts before signing: {missingReceipts.join(", ")}.
              </p>
            )}
          </div>
        )}
        {signed && (
          <Button
            size="sm"
            variant="outline"
            className="font-semibold"
            disabled={downloadingPdf}
            onClick={downloadSignedPdf}
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {t("proforma.downloadPdf")}
          </Button>
        )}
      </div>

      {signed && !showSignDialog && (
        <div
          aria-hidden
          className="fixed left-[-10000px] top-0 w-[794px] pointer-events-none"
        >
          <ProformaInvoiceDocument proforma={proforma} />
        </div>
      )}

      <ProformaSignDialog
        open={showSignDialog}
        onOpenChange={setShowSignDialog}
        proforma={proforma}
        busy={busy}
        onConfirm={sign}
      />

      <ProformaContextSummary proforma={proforma} showTeacherName={false} />

      <ProformaLatestChangeBanner proforma={proforma} viewerRole="TEACHER" />

      {adminQuery && (
        <div className="rounded-xl border-2 border-orange-400 bg-orange-50 p-4 space-y-2">
          <p className="text-sm font-bold text-orange-950">Admin question</p>
          <p className="text-xs text-orange-900/80">
            <span className="font-semibold">{adminQuery.name}</span>
            {adminQuery.at && <> · {new Date(adminQuery.at).toLocaleString()}</>}
            {adminQuery.sections?.length > 0 && (
              <>
                {" · "}
                <span className="font-mono font-semibold">{adminQuery.sections.join(", ")}</span>
              </>
            )}
          </p>
          <p className="text-sm text-orange-950 font-medium leading-relaxed whitespace-pre-wrap">
            {adminQuery.reason}
          </p>
          <p className="text-[11px] text-orange-800/80">
            Update the sections below if needed, then Confirm again and Sign.
          </p>
        </div>
      )}

      {/* Teaching */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold">Teaching</h2>
            <span className="font-mono text-xs font-semibold">{eur(proforma.teaching_total)}</span>
            {teachingPending && (
              <span className="px-2 py-0.5 text-[11px] rounded-full font-semibold border border-amber-400 text-amber-900 bg-amber-50">
                Updated
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {!signed && !editingTeaching && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openTeachingEdit}>
                {teachingPending ? "Edit" : "Edit teaching"}
              </Button>
            )}
            <SectionConfirmControls section="TEACHING" />
          </div>
        </div>
        <div className="p-4 space-y-3">
          <RejectedUpdateBanner section="TEACHING" />
          {!editingTeaching && !teachingPending && teachingItem && (
            <p className="text-sm text-muted-foreground">
              {(() => {
                const blocks = Number(teachingItem.blocks || teachingItem.multiplier || 0);
                const lineTotal = Number(teachingItem.line_total || 0);
                let rate = Number(teachingItem.unit_rate || 0);
                if (blocks > 0 && lineTotal > 0) {
                  const implied = Math.round((lineTotal / blocks) * 100) / 100;
                  const fromRate = Math.round(blocks * rate * 100) / 100;
                  if (Math.abs(fromRate - lineTotal) > 0.02) rate = implied;
                }
                return (
                  <>
                    {blocks} blocks × {eur(rate)} ={" "}
                    <span className="font-mono font-semibold text-foreground">{eur(lineTotal)}</span>
                    {teachingItem.teacher_role_name ? ` · ${teachingItem.teacher_role_name}` : ""}
                  </>
                );
              })()}
            </p>
          )}
          {teachingPending && !editingTeaching && (
            <div className="rounded-lg border border-amber-300 bg-amber-50/80 px-3 py-2.5 text-sm space-y-1">
              <p className="font-medium text-amber-950">
                {teachingPending.before?.blocks ?? "—"} blocks → {teachingPending.after?.blocks ?? "—"} blocks
                <span className="text-muted-foreground font-normal ml-2 font-mono text-xs">
                  ({eur(teachingPending.before?.line_total)} → {eur(teachingPending.after?.line_total)})
                </span>
              </p>
              {teachingPending.note && (
                <p className="text-xs text-amber-900/80">Note: {teachingPending.note}</p>
              )}
            </div>
          )}
          {editingTeaching && (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <div>
                <Label className="text-xs">Blocks</Label>
                <Input
                  type="number"
                  min="1"
                  className="mt-1 max-w-[140px]"
                  value={teachingBlocks}
                  onChange={(e) => setTeachingBlocks(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Note (optional)</Label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  placeholder="Why are you requesting this change?"
                  value={teachingNote}
                  onChange={(e) => setTeachingNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy} onClick={saveTeachingChange}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : requestUpdateLabel()}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTeaching(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        {renderSectionNotes("TEACHING")}
      </section>

      {/* Travel */}
      {sectionIsVisible("TRAVEL") && (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">Travel</h2>
              <span className="font-mono text-xs font-semibold">{eur(proforma.travel_total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {!signed &&
                (travelTab === "RAIL" || travelTab === "FLIGHT") &&
                !showTicketForm && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs shrink-0"
                    onClick={() => setShowTicketForm(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add ticket
                  </Button>
                )}
              <SectionConfirmControls section="TRAVEL" />
            </div>
          </div>
          <div className="px-4 pt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              {travelTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setTravelTab(tab.key);
                    setShowTicketForm(false);
                    setTicketForm({ description: "", amount: "", files: [] });
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
            </span>
          </div>
          <div className="p-4 space-y-3">
            <RejectedUpdateBanner section="TRAVEL" />
            {travelTab === "FIXED" && (
              fixedTravelLines.length > 0 ? (
                ticketsActive ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Fixed module not selected</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated {eur(fixedReferenceTotal)} (reference only).{" "}
                      {activeTravelModeLabel(activeTravelMode)} is currently billed.
                    </p>
                    {!signed && (
                      <Button size="sm" disabled={busy} onClick={usePrimaryTravelAllowance}>
                        Switch to fixed module
                      </Button>
                    )}
                  </div>
                ) : (
                  <ProformaTravelFixedCard items={fixedTravelLines} />
                )
              ) : (
                <p className="text-sm text-muted-foreground">{t("proforma.detail.noFixedTravel")}</p>
              )
            )}
            {travelTab === "ROAD" && (
              roadLine ? (
                roadSuperseded ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-semibold text-foreground">Road allowance not selected</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated {eur(roadReferenceTotal)} (reference only).{" "}
                      {activeTravelModeLabel(activeTravelMode)} is currently billed.
                    </p>
                    {!signed && (
                      <Button size="sm" disabled={busy} onClick={usePrimaryTravelAllowance}>
                        Switch to road
                      </Button>
                    )}
                  </div>
                ) : (
                  <ProformaTravelRoadCard
                    item={roadLine}
                    editable={false}
                    hasHotel={(proforma?.items || []).some(
                      (i) =>
                        i.item_type === "STAY" &&
                        (Number(i.line_total) > 0 || Number(i.multiplier) > 0)
                    )}
                  />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("proforma.detail.noRoadTravelHint")}
                </p>
              )
            )}
            {(travelTab === "RAIL" || travelTab === "FLIGHT") && (
              <>
                {renderTicketList(travelTab === "RAIL" ? railTickets : airTickets)}
                {!signed && showTicketForm && (
                  <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          className="mt-1"
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
                          placeholder={
                            travelTab === "RAIL"
                              ? "e.g. Train ticket Amsterdam–Brussels"
                              : "e.g. Flight AMS–BCN"
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Amount (€)</Label>
                        <Input
                          className="mt-1"
                          type="number"
                          min="0"
                          step="0.01"
                          value={ticketForm.amount}
                          onChange={(e) => setTicketForm((p) => ({ ...p, amount: e.target.value }))}
                        />
                      </div>
                    </div>
                    <MultiFileSectionUploader
                      sectionKey={`TRAVEL_${travelTab}`}
                      existingAttachments={ticketForm.files}
                      disabled={busy}
                      successToastMessage={false}
                      onUploadSuccess={(uploaded) =>
                        setTicketForm((p) => ({ ...p, files: [...(p.files || []), ...uploaded] }))
                      }
                      onRemoveAttachment={(doc) =>
                        setTicketForm((p) => ({
                          ...p,
                          files: (p.files || []).filter((f) => f.file_url !== doc.file_url),
                        }))
                      }
                    />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busy} onClick={saveTicket}>
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : requestUpdateLabel()}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowTicketForm(false);
                          setTicketForm({ description: "", amount: "", files: [] });
                        }}
                      >
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {renderSectionNotes("TRAVEL")}
        </section>
      )}

      {/* Meal — days × fixed regional rate */}
      {sectionIsVisible("FOOD") && (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">Meal</h2>
              <span className="font-mono text-xs font-semibold">{eur(proforma.food_total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {!signed && !editingFood && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setFoodDays(String(foodLine?.multiplier ?? 0));
                    setEditingFood(true);
                  }}
                >
                  {foodLine ? "Edit days" : "Set days"}
                </Button>
              )}
              <SectionConfirmControls section="FOOD" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <RejectedUpdateBanner section="FOOD" />
            {editingFood ? (
              <div className="rounded-lg border border-dashed border-border p-3 space-y-3 max-w-md">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Days</Label>
                    <Input
                      className="mt-1 font-mono"
                      type="number"
                      min="0"
                      step="1"
                      value={foodDays}
                      onChange={(e) => setFoodDays(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Daily rate</Label>
                    <Input
                      className="mt-1 font-mono bg-muted"
                      value={eur(foodLine?.unit_rate ?? proforma.food_daily_rate ?? 0)}
                      disabled
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {Number(foodDays) || 0} days × {eur(foodLine?.unit_rate ?? proforma.food_daily_rate ?? 0)} ={" "}
                  {eur(
                    (Number(foodDays) || 0) *
                      Number(foodLine?.unit_rate ?? proforma.food_daily_rate ?? 0)
                  )}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" disabled={busy} onClick={saveFoodDays}>
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : requestUpdateLabel()}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingFood(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : foodLine ? (
              <p className="text-sm font-mono text-muted-foreground">
                {foodLine.calculation_breakdown ||
                  `${foodLine.multiplier || 0} days × ${eur(foodLine.unit_rate)} = ${eur(foodLine.line_total)}`}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No meal days set yet — daily rate {eur(proforma.food_daily_rate ?? 0)}. Use{" "}
                <span className="font-medium text-foreground">Set days</span> to claim meal allowance.
              </p>
            )}

            {/* Meal receipt upload — required when food_total > 0 and policy requires receipt */}
            {!signed && Number(proforma.food_total) > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-border/60">
                <p className="text-xs font-medium text-foreground">
                  Meal receipt
                  {proforma.proof_policy?.food?.requires_receipt &&
                    !(foodLine?.attachments || []).length && (
                      <span className="text-rose-700 font-semibold"> — required to sign</span>
                    )}
                </p>
                <MultiFileSectionUploader
                  sectionKey="FOOD"
                  existingAttachments={foodLine?.attachments || []}
                  disabled={busy || addAttachmentMutation.isPending}
                  successToastMessage={false}
                  onUploadSuccess={(uploaded) => {
                    if (!uploaded?.length) return;
                    addAttachmentMutation.mutate({
                      id: proforma._id,
                      section: "FOOD",
                      files: uploaded,
                    });
                  }}
                />
              </div>
            )}
            {signed && (foodLine?.attachments || []).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {foodLine.attachments.map((a, idx) => (
                  <a
                    key={a._id || a.file_url || idx}
                    href={a.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                  >
                    <Paperclip className="w-3 h-3" />
                    {a.file_name}
                  </a>
                ))}
              </div>
            )}
          </div>
          {renderSectionNotes("FOOD")}
        </section>
      )}

      {/* Stay */}
      {sectionIsVisible("STAY") && (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">Stay</h2>
              <span className="font-mono text-xs font-semibold">{eur(proforma.stay_total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <AddItemButton section="STAY" />
              <SectionConfirmControls section="STAY" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <RejectedUpdateBanner section="STAY" />
            {renderClaimList("STAY", itemsByType.STAY || [])}
          </div>
          {renderSectionNotes("STAY")}
        </section>
      )}

      {/* Misc */}
      {sectionIsVisible("MISCELLANEOUS") && (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">Miscellaneous</h2>
              <span className="font-mono text-xs font-semibold">{eur(proforma.miscellaneous_total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <AddItemButton section="MISCELLANEOUS" />
              <SectionConfirmControls section="MISCELLANEOUS" />
            </div>
          </div>
          <div className="p-4 space-y-3">
            <RejectedUpdateBanner section="MISCELLANEOUS" />
            {renderClaimList("MISCELLANEOUS", itemsByType.MISCELLANEOUS || [])}
          </div>
          {renderSectionNotes("MISCELLANEOUS")}
        </section>
      )}

      <ProformaActivityLog logs={proforma.audit_logs} />
    </div>
  );
}
