import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMarkStudentModulePaid } from "@/store/useModuleOverrideStore";

const MarkModulePaidDialog = ({
  open,
  onOpenChange,
  applicationId,
  module,
  onDone,
}) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const markPaidMutation = useMarkStudentModulePaid();

  const handleClose = () => {
    setReason("");
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!applicationId || !module?._id) return;
    try {
      await markPaidMutation.mutateAsync({
        application_id: applicationId,
        component_id: module._id,
        reason: reason || undefined,
      });
      onDone?.();
      handleClose();
    } catch {
      // toast in mutation
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t(
              "studentManagement.moduleOverride.markPaidTitle",
              "Mark as paid",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "studentManagement.moduleOverride.markPaidDesc",
              "Unlocks the module for the student without creating a payment, invoice, or receipt. Use for offline / bank settlements recorded outside Mollie.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm">
            <span className="font-medium">{module?.name}</span>
            {module?.uid ? (
              <span className="text-muted-foreground"> ({module.uid})</span>
            ) : null}
          </p>
          <div>
            <Label>
              {t(
                "studentManagement.moduleOverride.reason",
                "Reason (optional)",
              )}
            </Label>
            <Textarea
              className="mt-1"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            disabled={markPaidMutation.isPending}
            onClick={handleConfirm}
          >
            {markPaidMutation.isPending
              ? t("common.processing", "Processing...")
              : t("studentManagement.moduleOverride.markPaid", "Mark as paid")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarkModulePaidDialog;
