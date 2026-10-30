import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Plus, Pencil, Trash2, Shield, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  useGetThesisRoles,
  useCreateThesisRole,
  useUpdateThesisRole,
  useDeleteThesisRole,
} from "@/store/useThesisStore";
import EditThesisRoleModal from "./EditThesisRoleModal";

const ManageThesisRolesModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [newRoleName, setNewRoleName] = useState("");
  const [roleToEdit, setRoleToEdit] = useState(null);

  // Fetch all roles including inactive
  const {
    data: rolesResponse,
    isLoading,
    isFetching,
  } = useGetThesisRoles({ all: "true" }, { enabled: open });

  const createRole = useCreateThesisRole();
  const updateRole = useUpdateThesisRole();
  const deleteRole = useDeleteThesisRole();

  const roles = useMemo(() => {
    const list = rolesResponse?.data || [];
    const seen = new Set();
    return list.filter((r) => {
      if (!r.key || seen.has(r.key)) return false;
      seen.add(r.key);
      return true;
    });
  }, [rolesResponse?.data]);

  const handleCreate = (e) => {
    e.preventDefault();
    const clean = newRoleName.trim();
    if (!clean) return;

    createRole.mutate(
      { name: clean },
      {
        onSuccess: () => {
          setNewRoleName("");
        },
      }
    );
  };

  const handleToggleStatus = (role) => {
    updateRole.mutate({
      id: role._id,
      status: !role.status,
    });
  };

  const handleDeactivate = (role) => {
    deleteRole.mutate(role._id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <DialogTitle>
                {t("thesisManagement.teachers.manageRolesTitle", "Manage Teacher Roles")}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* Quick Add Role Form */}
          <form
            onSubmit={handleCreate}
            className="flex items-end gap-3 p-3.5 bg-muted/30 border rounded-lg mt-2 shrink-0"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="new-role-name" className="text-xs font-medium">
                {t("thesisManagement.teachers.addNewRoleLabel", "Add New Role")}
              </Label>
              <Input
                id="new-role-name"
                placeholder={t(
                  "thesisManagement.teachers.roleNamePlaceholder",
                  "e.g. Co-Supervisor, External Evaluator"
                )}
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                maxLength={50}
                className="h-9"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!newRoleName.trim() || createRole.isPending}
              className="gap-1.5 h-9"
            >
              {createRole.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("thesisManagement.teachers.addRoleButton", "Add Role")}
            </Button>
          </form>

          {/* Roles Table */}
          <div className="flex-1 overflow-y-auto border rounded-lg mt-3 min-h-[220px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-12 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("common.loading", "Loading roles...")}
              </div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {t("thesisManagement.teachers.noRolesFound", "No roles defined yet.")}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("thesisManagement.teachers.table.roleName", "Role Name")}</TableHead>
                    <TableHead>{t("thesisManagement.teachers.table.roleKey", "Key")}</TableHead>
                    <TableHead className="text-center">{t("thesisManagement.teachers.table.roleStatus", "Status")}</TableHead>
                    <TableHead className="text-right">{t("thesisManagement.teachers.table.actions", "Actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className={isFetching ? "opacity-70" : ""}>
                  {roles.map((role) => {
                    const isActive = role.status !== false;
                    return (
                      <TableRow key={role._id} className="hover:bg-muted/40">
                        <TableCell className="font-medium text-sm">
                          {role.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono text-xs font-normal">
                            {role.key}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-2">
                            <Switch
                              checked={isActive}
                              onCheckedChange={() => handleToggleStatus(role)}
                              disabled={updateRole.isPending}
                              aria-label={`Toggle ${role.name} status`}
                            />
                            <span
                              className={`text-xs font-medium ${
                                isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                              }`}
                            >
                              {isActive
                                ? t("common.active", "Active")
                                : t("common.inactive", "Inactive")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setRoleToEdit(role)}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              title={t("common.edit", "Edit")}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {isActive && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeactivate(role)}
                                disabled={deleteRole.isPending}
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                title={t("thesisManagement.teachers.deactivateRole", "Deactivate Role")}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <Button variant="outline" onClick={onClose}>
              {t("common.close", "Close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      {roleToEdit && (
        <EditThesisRoleModal
          key={roleToEdit._id}
          open={!!roleToEdit}
          onClose={() => setRoleToEdit(null)}
          role={roleToEdit}
        />
      )}
    </>
  );
};

export default ManageThesisRolesModal;
