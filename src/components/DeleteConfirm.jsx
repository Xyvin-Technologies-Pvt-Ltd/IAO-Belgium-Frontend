import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const DeleteConfirm = ({ open, onClose, onConfirm, count, data, isLoading = false }) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("common.deleteConfirm.title")}</DialogTitle>
          <DialogDescription>
            {t("common.deleteConfirm.message", {
              count,
              data,
              cannotUndo: t("common.deleteConfirm.cannotUndo"),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.deleteConfirm.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t("common.deleteConfirm.deleting") : t("common.deleteConfirm.delete")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirm;
