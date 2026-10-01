import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useGetProformaById,
  useSignProforma,
  useUpdateSectionApproval,
  useSubmitTeacherUpdate,
  useAddProformaLineItem,
  useRemoveProformaLineItem,
  useAddSectionComment,
} from "@/store/useProformaStore";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Paperclip,
  PenTool,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import MultiFileSectionUploader from "@/components/common/MultiFileSectionUploader";
import ProformaSectionNotes from "@/components/proforma/ProformaSectionNotes";
import ProformaActivityLog, { ProformaLatestChangeBanner } from "@/components/proforma/ProformaActivityLog";

const SECTION_KEYS = ["TEACHING", "TRAVEL", "FOOD", "STAY", "MISCELLANEOUS"];

const CATEGORY_TOGGLE_KEY = {
  TRAVEL: "travel_enabled",
  FOOD: "food_enabled",
  STAY: "stay_enabled",
  MISCELLANEOUS: "miscellaneous_enabled",
};

const TRAVEL_TABS = [
  { key: "WEEKEND", label: "Teaching weekend fee" },
  { key: "RAIL", label: "Rail" },
  { key: "FLIGHT", label: "Air" },
];

const eur = (n) => `€${Number(n || 0).toFixed(2)}`;

const statusBadge = (p) => {
  if (p?.status === "MOVED_TO_FINANCE" || p?.status === "PAID") {
    return { label: "In Finance", className: "bg-purple-100 text-purple-800 border-purple-300" };
  }
  if (p?.digital_signature?.is_signed || p?.status === "TEACHER_SIGNED_APPROVED") {
    return { label: "Signed — awaiting admin", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  }
  if (p?.workflow_next_actor === "TEACHER" && p?.last_revision?.requested_by_role === "BACKOFFICE") {
    return { label: "Admin sent back — review", className: "bg-orange-100 text-orange-800 border-orange-300" };
  }
  return { label: "Needs confirm & sign", className: "bg-amber-100 text-amber-800 border-amber-300" };
};

function courseMeta(proforma) {
  const planning = proforma?.planning_id;
  const program =
    planning?.component?.program?.name ||
    planning?.batch?.intake?.program?.name ||
    planning?.description ||
    "Course";
  const venue = planning?.venue || planning?.venue_address || proforma?.region_snapshot_name || "—";
  const role =
    proforma?.teacher_id?.teacher_role?.name ||
    proforma?.items?.find((i) => i.item_type === "TEACHING")?.teacher_role_name ||
    "Teacher";
  return { program, venue, role };
}

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
  const updateApprovalMutation = useUpdateSectionApproval();
  const submitUpdateMutation = useSubmitTeacherUpdate();
  const addItemMutation = useAddProformaLineItem();
  const removeItemMutation = useRemoveProformaLineItem();
  const addCommentMutation = useAddSectionComment();

  const [signedByName, setSignedByName] = useState("");
  const [travelTab, setTravelTab] = useState("WEEKEND");
  const [editingTeaching, setEditingTeaching] = useState(false);
  const [teachingBlocks, setTeachingBlocks] = useState("");
  const [teachingNote, setTeachingNote] = useState("");
  const [ticketForm, setTicketForm] = useState({ description: "", amount: "", files: [] });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [itemForm, setItemForm] = useState({ description: "", amount: "", files: [] });
  const [addingSection, setAddingSection] = useState(null); // FOOD | STAY | MISCELLANEOUS
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState({});

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
  const pendingChanges = (proforma?.pending_teacher_changes || []).filter((c) => c.status === "PENDING");
  const teachingPending = pendingChanges.find((c) => c.section === "TEACHING");
  const teachingItem = (itemsByType.TEACHING || [])[0];
  // Meal claims only (ignore generated €0 placeholder line)
  const mealItems = (itemsByType.FOOD || []).filter((i) => Number(i.line_total) > 0);

  const roadLine = (itemsByType.TRAVEL || []).find((i) => (i.travel_mode || "ROAD") === "ROAD");
  const railTickets = (itemsByType.TRAVEL || []).filter((i) => i.travel_mode === "RAIL");
  const airTickets = (itemsByType.TRAVEL || []).filter((i) => i.travel_mode === "FLIGHT");

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
  const allAccepted = activeSections.every((k) => dual[k]?.admin_approved);

  const missingReceipts = useMemo(() => {
    if (!proforma) return [];
    const policy = proforma.proof_policy || {};
    const needed = [];

    const travelLines = (itemsByType.TRAVEL || []).filter((i) => Number(i.line_total) > 0);
    const travelNeeds = travelLines.some((item) => {
      const mode = String(item.travel_mode || "ROAD").toLowerCase();
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
    allAccepted &&
    missingReceipts.length === 0;

  const badge = statusBadge(proforma);
  const meta = courseMeta(proforma);

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
          toast.success("Teaching updated — confirm this section when ready");
        },
      }
    );
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
      (section === "FOOD" && policy.food?.requires_receipt);
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
    updateApprovalMutation.mutate({
      id: proforma._id,
      section: sec,
      action: "APPROVE",
      notes: `Teacher confirmed ${sec}`,
    });
  };

  const confirmAllAndPrepareSign = async () => {
    for (const sec of activeSections) {
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

  const sign = async () => {
    if (!signedByName.trim()) {
      toast.error("Type your full legal name");
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
    if (!allAccepted) {
      toast.error("Wait for admin to accept all sections before signing");
      return;
    }
    try {
      setBusy(true);
      await confirmAllAndPrepareSign();
      await signMutation.mutateAsync({
        id: proforma._id,
        data: { signed_by_name: signedByName.trim() },
      });
    } catch (err) {
      toast.error(err?.message || "Could not sign");
    } finally {
      setBusy(false);
    }
  };

  const renderTicketList = (tickets) => (
    <div className="space-y-2">
      {tickets.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No tickets added yet.</p>
      )}
      {tickets.map((t) => (
        <div
          key={t._id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{t.description}</p>
            <p className="text-xs text-muted-foreground font-mono">{eur(t.line_total)}</p>
            {(t.attachments || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {t.attachments.map((a, idx) => (
                  <a
                    key={idx}
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
          {!signed && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive h-8"
              disabled={busy}
              onClick={() => removeItem(t._id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
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
        <div
          key={t._id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{t.description}</p>
            <p className="text-xs text-muted-foreground font-mono">{eur(t.line_total)}</p>
            {(t.attachments || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {t.attachments.map((a, idx) => (
                  <a
                    key={idx}
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
          {!signed && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive h-8"
              disabled={busy}
              onClick={() => removeItem(t._id)}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
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
                placeholder={
                  section === "FOOD"
                    ? "e.g. Lunch day 1"
                    : section === "STAY"
                      ? "e.g. Hotel night"
                      : "e.g. Parking"
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
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
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
    const adminOk = dual[section]?.admin_approved;
    return (
      <div className="flex flex-wrap items-center gap-2 justify-end">
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
        {!signed && (
          <Button
            size="sm"
            variant={teacherOk ? "default" : "outline"}
            className={
              teacherOk
                ? "bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold"
                : "h-7 text-xs"
            }
            disabled={teacherOk || updateApprovalMutation.isPending}
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
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {meta.program}
            {" · "}
            <span className="font-semibold text-foreground">{meta.venue}</span>
            {" · "}
            {meta.role}
            {" · "}
            <span className="font-mono font-semibold text-foreground">{eur(proforma.grand_total)}</span>
          </p>
        </div>

        {!signed && (
          <div className="flex flex-col sm:items-end gap-2 min-w-[220px]">
            <Input
              placeholder="Type your full legal name"
              value={signedByName}
              onChange={(e) => setSignedByName(e.target.value)}
              className="h-9"
            />
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              disabled={busy || !canSign}
              onClick={sign}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <PenTool className="w-4 h-4 mr-2" />
              )}
              Sign &amp; approve
            </Button>
            {!allConfirmed && (
              <p className="text-[11px] text-muted-foreground text-right max-w-xs">
                Confirm each section with an amount, then wait for admin accept before signing.
              </p>
            )}
            {allConfirmed && !allAccepted && (
              <p className="text-[11px] text-muted-foreground text-right max-w-xs">
                Admin must accept each section before you can sign.
              </p>
            )}
          </div>
        )}
        {signed && (
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5" /> Signed by {proforma.digital_signature?.signed_by_name}
          </div>
        )}
      </div>

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
            Update the sections below if needed, then Confirm again so admin can Accept.
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
          {!editingTeaching && !teachingPending && teachingItem && (
            <p className="text-sm text-muted-foreground">
              {Number(teachingItem.blocks || teachingItem.multiplier || 0)} blocks × {eur(teachingItem.unit_rate)} ={" "}
              <span className="font-mono font-semibold text-foreground">{eur(teachingItem.line_total)}</span>
              {teachingItem.teacher_role_name ? ` · ${teachingItem.teacher_role_name}` : ""}
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
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
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
          <div className="px-4 pt-3">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
              {TRAVEL_TABS.map((tab) => (
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
          </div>
          <div className="p-4 space-y-3">
            {travelTab === "WEEKEND" && (
              <div className="text-sm text-muted-foreground space-y-1">
                {roadLine ? (
                  <>
                    <p>
                      System weekend fee (road):{" "}
                      <span className="font-mono font-semibold text-foreground">{eur(roadLine.line_total)}</span>
                    </p>
                    {roadLine.calculation_breakdown && (
                      <p className="text-xs">{roadLine.calculation_breakdown}</p>
                    )}
                    {(roadLine.origin_address || roadLine.destination_address) && (
                      <p className="text-xs">
                        {[roadLine.origin_address, roadLine.destination_address].filter(Boolean).join(" → ")}
                      </p>
                    )}
                  </>
                ) : (
                  <p>No weekend-fee / road line on this invoice. Use Rail or Air to add tickets.</p>
                )}
              </div>
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
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
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

      {/* Meal — same add-item pattern as Stay / Misc */}
      {sectionIsVisible("FOOD") && (
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold">Meal</h2>
              <span className="font-mono text-xs font-semibold">{eur(proforma.food_total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <AddItemButton section="FOOD" />
              <SectionConfirmControls section="FOOD" />
            </div>
          </div>
          <div className="p-4">{renderClaimList("FOOD", mealItems, "add meal items if needed")}</div>
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
          <div className="p-4">{renderClaimList("STAY", itemsByType.STAY || [])}</div>
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
          <div className="p-4">{renderClaimList("MISCELLANEOUS", itemsByType.MISCELLANEOUS || [])}</div>
          {renderSectionNotes("MISCELLANEOUS")}
        </section>
      )}

      <ProformaActivityLog logs={proforma.audit_logs} />
    </div>
  );
}
