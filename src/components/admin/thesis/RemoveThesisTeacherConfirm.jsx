import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const RemoveThesisTeacherConfirm = ({
  open,
  onClose,
  onConfirm,
  teacherName,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("thesisManagement.teachers.removeConfirmTitle", "Remove Teacher from Thesis")}
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2 text-sm text-muted-foreground">
            <p>
              {t(
                "thesisManagement.teachers.removeConfirmMessage",
                "Are you sure you want to remove \"{{name}}\" from this thesis?",
                { name: teacherName || "this teacher" }
              )}
            </p>
            <p className="font-medium text-amber-600 dark:text-amber-400">
              {t(
                "thesisManagement.teachers.removeConfirmNotice",
                "The teacher will no longer be assigned to this thesis."
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
              ? t("thesisManagement.teachers.removing", "Removing...")
              : t("thesisManagement.teachers.removeButton", "Remove Teacher")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveThesisTeacherConfirm;
