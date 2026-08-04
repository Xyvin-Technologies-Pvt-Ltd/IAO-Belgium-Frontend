import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

//* Shared blocking questionnaire for both the "Add students from CoachView"
//* and "Remove student from group" flows. Manual entry — either direction —
//* is exactly where bad data gets in (a programme mismatch, a person
//* enrolled elsewhere, attendance history about to be detached), so nothing
//* commits until every applicable finding has been explicitly ticked and a
//* reason is on record. The server re-derives and re-checks all of this
//* independently (see coachview_import_service.add_students /
//* batch_service.remove_student_from_batch) — this dialog is the UI half of
//* that gate, not the gate itself.
//*
//* `groups`: [{ key, label, subtitle?, blockingItems: [{code,message}], items: [{code,message}] }]
//* `onConfirm(reason, acknowledgedByGroup)` — acknowledgedByGroup: { [key]: string[] }
const DiscrepancyAcknowledgementDialog = ({
  open,
  onClose,
  title,
  description,
  groups = [],
  onConfirm,
  isSubmitting = false,
  confirmLabel,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState({});

  useEffect(() => {
    if (open) {
      setReason("");
      setAcknowledged({});
    }
  }, [open]);

  const hasBlocking = useMemo(
    () => groups.some((g) => (g.blockingItems || []).length > 0),
    [groups],
  );

  const allAcknowledged = useMemo(
    () =>
      groups.every((g) => {
        const codes = acknowledged[g.key] || new Set();
        return (g.items || []).every((item) => codes.has(item.code));
      }),
    [groups, acknowledged],
  );

  const canConfirm = !hasBlocking && allAcknowledged && reason.trim().length > 0 && !isSubmitting;

  const toggleItem = (groupKey, code, checked) => {
    setAcknowledged((prev) => {
      const next = new Set(prev[groupKey] || []);
      if (checked) next.add(code);
      else next.delete(code);
      return { ...prev, [groupKey]: next };
    });
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    const acknowledgedByGroup = Object.fromEntries(
      groups.map((g) => [g.key, [...(acknowledged[g.key] || [])]]),
    );
    onConfirm(reason.trim(), acknowledgedByGroup);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("discrepancy.nothingToAcknowledge", "Nothing to acknowledge — you're good to go.")}
            </p>
          )}

          {groups.map((group) => (
            <div key={group.key} className="rounded-md border p-3 space-y-2">
              <div>
                <p className="text-sm font-medium">{group.label}</p>
                {group.subtitle && (
                  <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                )}
              </div>

              {(group.blockingItems || []).map((item) => (
                <div
                  key={item.code}
                  className="flex items-start gap-2 p-2 bg-red-500/10 rounded-md text-red-600 text-xs"
                >
                  <Ban className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>
                    {item.message}{" "}
                    <span className="font-medium">
                      {t("discrepancy.mustDeselect", "— this student must be deselected.")}
                    </span>
                  </span>
                </div>
              ))}

              {(group.items || []).map((item) => (
                <label
                  key={item.code}
                  className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-md text-amber-700 dark:text-amber-500 text-xs cursor-pointer"
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={(acknowledged[group.key] || new Set()).has(item.code)}
                    onCheckedChange={(checked) => toggleItem(group.key, item.code, !!checked)}
                  />
                  <span className="flex items-start gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {item.message}
                  </span>
                </label>
              ))}
            </div>
          ))}

          <div className="space-y-1.5">
            <Label htmlFor="discrepancy-reason">
              {t("discrepancy.reasonLabel", "Reason for this manual change")}
            </Label>
            <Textarea
              id="discrepancy-reason"
              placeholder={t(
                "discrepancy.reasonPlaceholder",
                "Explain why this manual change is being made — recorded in the audit log.",
              )}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {hasBlocking && (
            <p className="text-xs text-red-600">
              {t(
                "discrepancy.blockingPresent",
                "One or more students have a blocking issue and cannot be confirmed. Go back and deselect them first.",
              )}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {isSubmitting
              ? t("common.loading", "Loading...")
              : confirmLabel || t("common.confirm", "Confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DiscrepancyAcknowledgementDialog;
