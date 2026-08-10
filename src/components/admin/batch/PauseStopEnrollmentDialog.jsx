import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePauseEnrollment, useStopEnrollment } from "@/store/useBatchStore";

const PauseStopEnrollmentDialog = ({
  open,
  onClose,
  application,
  mode = "pause",
  batchId,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const pauseMutation = usePauseEnrollment();
  const stopMutation = useStopEnrollment();
  const mutation = mode === "stop" ? stopMutation : pauseMutation;
  const isStop = mode === "stop";

  useEffect(() => {
    if (open) setReason("");
  }, [open, application?._id, mode]);

  const handleSubmit = async () => {
    const trimmed = reason.trim();
    if (!trimmed || !application?._id) return;
    try {
      await mutation.mutateAsync({
        applicationId: application._id,
        reason: trimmed,
        batchId,
      });
      onClose();
    } catch {
      // toast handled in mutation
    }
  };

  const studentName = [application?.last_name, application?.first_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isStop
              ? t("enrollmentHold.stopTitle", "Stop enrollment")
              : t("enrollmentHold.pauseTitle", "Pause enrollment")}
          </DialogTitle>
          <DialogDescription>
            {isStop
              ? t(
                  "enrollmentHold.stopDescription",
                  "The student will be removed from the group and their account will be deactivated. You can resume them later into another batch.",
                )
              : t(
                  "enrollmentHold.pauseDescription",
                  "The student will be removed from the group and their account will be deactivated until you resume them into another batch.",
                )}
          </DialogDescription>
        </DialogHeader>

        {studentName && (
          <p className="text-sm text-muted-foreground">
            {t("enrollmentHold.student", "Student")}:{" "}
            <span className="font-medium text-foreground capitalize">{studentName}</span>
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="hold-reason">
            {t("enrollmentHold.reason", "Reason")}
          </label>
          <textarea
            id="hold-reason"
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("enrollmentHold.reasonPlaceholder", "Enter reason...")}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant={isStop ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={!reason.trim() || mutation.isPending}
          >
            {mutation.isPending
              ? t("common.saving", "Saving...")
              : isStop
                ? t("enrollmentHold.confirmStop", "Stop")
                : t("enrollmentHold.confirmPause", "Pause")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PauseStopEnrollmentDialog;
