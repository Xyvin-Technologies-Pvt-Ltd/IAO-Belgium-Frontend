import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";

const ApplicationStatusConfirm = ({
  open,
  status,
  studentName,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (open) {
      setRejectionReason("");
    }
  }, [open, status]);

  const handleOpenChange = (isOpen) => {
    if (!isOpen && !isLoading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (status === "rejected") {
      onConfirm(rejectionReason.trim());
    } else {
      onConfirm();
    }
  };

  const isReject = status === "rejected";
  const canConfirm = isReject ? rejectionReason.trim().length > 0 : true;

  const titleKey =
    status === "approved"
      ? "applicationReview.modal.confirm.approveTitle"
      : status === "waitlisted"
        ? "applicationReview.modal.confirm.waitlistTitle"
        : "applicationReview.modal.confirm.rejectTitle";

  const messageKey =
    status === "approved"
      ? "applicationReview.modal.confirm.approveMessage"
      : status === "waitlisted"
        ? "applicationReview.modal.confirm.waitlistMessage"
        : "applicationReview.modal.confirm.rejectMessage";

  const confirmKey =
    status === "approved"
      ? "applicationReview.modal.confirm.confirmApprove"
      : status === "waitlisted"
        ? "applicationReview.modal.confirm.confirmWaitlist"
        : "applicationReview.modal.confirm.confirmReject";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="z-[60] sm:max-w-md" showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle>{t(titleKey)}</DialogTitle>
          <DialogDescription>
            {t(messageKey, { name: studentName })}
          </DialogDescription>
        </DialogHeader>

        {isReject && (
          <div className="space-y-2">
            <label
              htmlFor="rejection-reason"
              className="text-sm font-medium text-gray-700 dark:text-white/70"
            >
              {t("applicationReview.modal.confirm.rejectReasonLabel")}
            </label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t("applicationReview.modal.confirm.rejectReasonPlaceholder")}
              className="min-h-[80px] bg-white dark:bg-white/5"
              disabled={isLoading}
            />
          </div>
        )}

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("applicationReview.modal.confirm.cancel")}
          </Button>
          <Button
            variant={isReject ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm}
            className={
              status === "approved"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : undefined
            }
          >
            {isLoading
              ? t("applicationReview.modal.processing")
              : t(confirmKey)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicationStatusConfirm;
