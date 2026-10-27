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
import { useRemoveStudentModule } from "@/store/useModuleOverrideStore";

const RemoveModuleDialog = ({
  open,
  onOpenChange,
  applicationId,
  module,
  onDone,
}) => {
  const { t } = useTranslation();
  const removeMutation = useRemoveStudentModule();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!applicationId || !module?._id) return;
    try {
      await removeMutation.mutateAsync({
        application_id: applicationId,
        component_id: module._id,
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
              "studentManagement.moduleOverride.removeTitle",
              "Remove module",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "studentManagement.moduleOverride.removeConfirm",
              "Remove this unpaid module from the student? Program modules are hidden and waived from year completion; extra modules are deleted.",
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm">
            <span className="font-medium">{module?.name}</span>
            {module?.uid ? (
              <span className="text-muted-foreground"> ({module.uid})</span>
            ) : null}
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={removeMutation.isPending}
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={removeMutation.isPending}
            onClick={handleConfirm}
          >
            {removeMutation.isPending
              ? t("common.processing", "Processing...")
              : t("common.remove", "Remove")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveModuleDialog;
