import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { useCreateThesisRole } from "@/store/useThesisStore";

const AddThesisRoleModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [roleName, setRoleName] = useState("");
  const createRole = useCreateThesisRole();

  const handleClose = () => {
    setRoleName("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = roleName.trim();
    if (!clean) return;

    createRole.mutate(
      { name: clean },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("thesisManagement.teachers.addRoleTitle", "Add Thesis Teacher Role")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="role-name">
              {t("thesisManagement.teachers.roleNameLabel", "Role Name")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="role-name"
              placeholder={t(
                "thesisManagement.teachers.roleNamePlaceholder",
                "Enter role name"
              )}
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              autoFocus
              maxLength={50}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createRole.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!roleName.trim() || createRole.isPending}
            >
              {createRole.isPending
                ? t("common.saving", "Saving...")
                : t("thesisManagement.teachers.addRoleButton", "Add Role")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddThesisRoleModal;
