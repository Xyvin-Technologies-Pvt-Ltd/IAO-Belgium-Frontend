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
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { useUpdateThesisRole } from "@/store/useThesisStore";

const EditThesisRoleModal = ({ open, onClose, role }) => {
  const { t } = useTranslation();
  const [roleName, setRoleName] = useState(() => role?.name || "");
  const [isActive, setIsActive] = useState(() => role?.status !== false);
  const updateRole = useUpdateThesisRole();

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = roleName.trim();
    if (!clean || !role?._id) return;

    updateRole.mutate(
      {
        id: role._id,
        name: clean,
        status: isActive,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("thesisManagement.teachers.editRoleTitle", "Edit Teacher Role")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "thesisManagement.teachers.editRoleDescription",
              "Update the role name and status. Role keys cannot be changed."
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Key (Read-only) */}
          <div className="space-y-1.5">
            <Label htmlFor="role-key" className="text-muted-foreground text-xs">
              {t("thesisManagement.teachers.roleKeyLabel", "Role Key (Immutable)")}
            </Label>
            <Input
              id="role-key"
              value={role.key || ""}
              disabled
              className="bg-muted text-muted-foreground font-mono text-sm cursor-not-allowed"
            />
          </div>

          {/* Role Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-role-name">
              {t("thesisManagement.teachers.roleNameLabel", "Role Name")}{" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-role-name"
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

          {/* Status switch */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="role-active-switch" className="text-sm font-medium">
                {t("thesisManagement.teachers.roleStatusLabel", "Active Status")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isActive
                  ? t("thesisManagement.teachers.roleActiveHelp", "Role is active and selectable in teacher tables.")
                  : t("thesisManagement.teachers.roleInactiveHelp", "Role is inactive and hidden from new teacher assignments.")}
              </p>
            </div>
            <Switch
              id="role-active-switch"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateRole.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!roleName.trim() || updateRole.isPending}
            >
              {updateRole.isPending
                ? t("common.saving", "Saving...")
                : t("common.save", "Save Changes")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditThesisRoleModal;
