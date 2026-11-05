import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const DeactivateThesisConfirm = ({
  open,
  onClose,
  onConfirm,
  thesisName,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("thesisManagement.deactivateModal.title", "Deactivate Thesis")}
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2 text-sm text-muted-foreground">
            <p>
              {t(
                "thesisManagement.deactivateModal.message",
                "Are you sure you want to deactivate \"{{name}}\"?",
                { name: thesisName || "this thesis" }
              )}
            </p>
            <p className="font-medium text-amber-600 dark:text-amber-400">
              {t(
                "thesisManagement.deactivateModal.notice",
                "This thesis will remain visible in the catalog, but new enrolments will be blocked."
              )}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? t("thesisManagement.deactivateModal.deactivating", "Deactivating...")
              : t("thesisManagement.deactivateModal.confirm", "Deactivate")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeactivateThesisConfirm;
