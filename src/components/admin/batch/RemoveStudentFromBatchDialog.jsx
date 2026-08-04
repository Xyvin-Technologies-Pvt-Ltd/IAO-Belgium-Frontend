import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingSpinner, ErrorMessage } from "@/components/common";
import { useRemovalImpact, useRemoveStudentFromBatch } from "@/store/useBatchStore";
import DiscrepancyAcknowledgementDialog from "./DiscrepancyAcknowledgementDialog";

//* Recorded even when the removal has no impact worth flagging (a fresh
//* enrolment with no attendance/progress/invoices yet) — the removal is
//* still an audit event (see remove_student_from_batch's admin_logs entry),
//* it just doesn't need to interrupt the admin with a confirmation dialog.
const DEFAULT_REASON = "Removed from group — no attendance, progress or invoice history to flag.";

//* Companion to AddStudentsFromCoachViewDialog: detaches a student from a
//* group without destroying their record (soft removal — see
//* batch_service.remove_student_from_batch). Fetches what would be affected
//* first, and only pops the shared acknowledgement questionnaire when there
//* is something the admin actually needs to see before proceeding.
const RemoveStudentFromBatchDialog = ({ open, onClose, batchId, application }) => {
  const { t } = useTranslation();
  const [ackOpen, setAckOpen] = useState(false);

  const applicationId = application?._id;
  const {
    data: impactResponse,
    isLoading,
    error,
    refetch,
  } = useRemovalImpact(batchId, applicationId, { enabled: open && !!applicationId });
  const impact = impactResponse?.data;

  const removeMutation = useRemoveStudentFromBatch();

  const handleClose = () => {
    setAckOpen(false);
    onClose();
  };

  const submit = async (reason, acknowledgedByGroup = {}) => {
    if (!batchId || !applicationId) return;
    try {
      await removeMutation.mutateAsync({
        batchId,
        applicationId,
        reason,
        acknowledgements: acknowledgedByGroup[applicationId] || [],
      });
      setAckOpen(false);
      handleClose();
    } catch {
      // useRemoveStudentFromBatch already toasts the error
    }
  };

  const handleConfirmClick = () => {
    if (!impact) return;
    if ((impact.items || []).length === 0) {
      submit(DEFAULT_REASON, {});
    } else {
      setAckOpen(true);
    }
  };

  const studentLabel = impact?.application?.student
    ? `${impact.application.student.first_name || ""} ${impact.application.student.last_name || ""}`.trim() ||
      impact.application.student.email
    : "";

  const ackGroups = impact
    ? [
        {
          key: applicationId,
          label: studentLabel || t("common.na", "n/a"),
          subtitle: impact.application?.student?.email,
          blockingItems: [],
          items: (impact.items || []).map((item) => ({ code: item.code, message: item.message })),
        },
      ]
    : [];

  return (
    <>
      <Dialog open={open && !ackOpen} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("removeStudent.title", "Remove student from group")}</DialogTitle>
            <DialogDescription>
              {t(
                "removeStudent.description",
                "The student's account and history are kept — this only detaches them from this group.",
              )}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <LoadingSpinner size="sm" />
          ) : error ? (
            <ErrorMessage message={error?.message} onRetry={refetch} variant="inline" />
          ) : (
            <div className="space-y-2">
              {studentLabel && (
                <p className="text-sm">
                  {t("removeStudent.studentLabel", "Student")}: <strong>{studentLabel}</strong>
                </p>
              )}
              {(impact?.items || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t(
                    "removeStudent.noImpact",
                    "No attendance, module progress or invoices are tied to this enrolment.",
                  )}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {impact.items.map((item) => (
                    <li
                      key={item.code}
                      className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-md text-amber-700 dark:text-amber-500 text-xs"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        {item.message} {item.count != null && <span className="font-medium">({item.count})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClick}
              disabled={isLoading || !!error || removeMutation.isPending}
            >
              {removeMutation.isPending ? t("common.loading", "Loading...") : t("removeStudent.confirm", "Remove student")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DiscrepancyAcknowledgementDialog
        open={ackOpen}
        onClose={() => setAckOpen(false)}
        title={t("removeStudent.ackTitle", "Confirm removal")}
        description={t(
          "removeStudent.ackDescription",
          "Acknowledge what's tied to this enrolment, then confirm the removal.",
        )}
        groups={ackGroups}
        onConfirm={(reason, acknowledgedByGroup) => submit(reason, acknowledgedByGroup)}
        isSubmitting={removeMutation.isPending}
        confirmLabel={t("removeStudent.confirm", "Remove student")}
      />
    </>
  );
};

export default RemoveStudentFromBatchDialog;
