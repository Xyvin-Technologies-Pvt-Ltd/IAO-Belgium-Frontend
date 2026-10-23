import { useEffect, useState, useMemo } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  Shield,
  Layers,
} from "lucide-react";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { LoadingState, ErrorMessage } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useGetThesisById,
  useGetThesisRoles,
  useGetThesisTeachers,
  useUpdateThesisTeacherRole,
  useRemoveThesisTeacher,
} from "@/store/useThesisStore";
import AddThesisRoleModal from "@/components/admin/thesis/AddThesisRoleModal";
import AssignThesisTeacherModal from "@/components/admin/thesis/AssignThesisTeacherModal";
import RemoveThesisTeacherConfirm from "@/components/admin/thesis/RemoveThesisTeacherConfirm";

const ThesisTeachers = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const canModify = useCanModify("operations");
  const { updateBreadcrumbs } = useBreadcrumb();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [openAddRole, setOpenAddRole] = useState(false);
  const [openAssignTeacher, setOpenAssignTeacher] = useState(false);
  const [teacherToRemove, setTeacherToRemove] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Queries
  const {
    data: thesisResponse,
    isLoading: isThesisLoading,
    error: thesisError,
    refetch: refetchThesis,
  } = useGetThesisById(id);

  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useGetThesisRoles();

  const {
    data: teachersResponse,
    isLoading: isTeachersLoading,
    isFetching: isTeachersFetching,
    error: teachersError,
    refetch: refetchTeachers,
  } = useGetThesisTeachers(id, {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  // Mutations
  const updateRole = useUpdateThesisTeacherRole();
  const removeTeacher = useRemoveThesisTeacher();

  const thesis = thesisResponse?.data;
  const roles = useMemo(() => {
    const rawRoles = rolesResponse?.data || [];
    const seen = new Set();
    return rawRoles.filter((r) => {
      const key = r.key || r.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rolesResponse?.data]);
  const assignments = teachersResponse?.data || [];
  const totalRows = teachersResponse?.total_count || 0;

  // Breadcrumbs
  useEffect(() => {
    if (thesis) {
      updateBreadcrumbs([
        {
          label: t("sidebar.admin.thesis", "Thesis"),
          path: "/admin/thesis",
          navigable: true,
        },
        {
          label: thesis.name || t("thesisManagement.detail.title", "Thesis Details"),
          path: `/admin/thesis/${id}`,
          navigable: true,
        },
        {
          label: t("thesisManagement.teachers.title", "Teachers"),
          path: `/admin/thesis/${id}/teachers`,
          navigable: false,
        },
      ]);
    }
    return () => {
      updateBreadcrumbs([]);
    };
  }, [thesis, id, updateBreadcrumbs, t]);

  const activeTeacherIds = useMemo(() => {
    return assignments
      .map((a) => a.teacher?._id)
      .filter(Boolean);
  }, [assignments]);

  const handleToggleRole = (assignmentId, roleId, currentVal) => {
    if (!canModify) return;
    updateRole.mutate({
      thesisId: id,
      assignmentId,
      role: roleId,
      enabled: !currentVal,
    });
  };

  const handleConfirmRemove = async () => {
    if (!teacherToRemove) return;
    try {
      await removeTeacher.mutateAsync({
        thesisId: id,
        assignmentId: teacherToRemove._id,
      });
    } finally {
      setTeacherToRemove(null);
    }
  };

  if (isThesisLoading) {
    return (
      <LoadingState
        text={t("thesisManagement.teachers.loading", "Loading thesis teachers...")}
        fullHeight
      />
    );
  }

  if (thesisError) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            thesisError?.message ||
            t("thesisManagement.detail.loadFailed", "Failed to load thesis")
          }
          onRetry={refetchThesis}
          variant="card"
        />
      </div>
    );
  }

  if (!thesis) return null;

  return (
    <div className="space-y-6 mt-4">
      {/* Top Banner & Header */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ff8904]/10 text-[#ff8904] border border-[#ff8904]/20">
              {thesis.uid}
            </span>
            <h1 className="text-xl font-bold text-foreground truncate">
              {thesis.name}
            </h1>
          </div>

          {canModify && (
            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenAddRole(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {t("thesisManagement.teachers.addRole", "Add Role")}
              </Button>
              <Button
                size="sm"
                onClick={() => setOpenAssignTeacher(true)}
                className="gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                {t("thesisManagement.teachers.assignTeacher", "Assign Teacher")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t(
              "thesisManagement.teachers.searchPlaceholder",
              "Search assigned teachers..."
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Teachers Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {isTeachersLoading || isRolesLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {t("common.loading", "Loading teachers...")}
          </div>
        ) : teachersError || rolesError ? (
          <div className="p-6">
            <ErrorMessage
              message={
                teachersError?.message ||
                rolesError?.message ||
                t(
                  "thesisManagement.teachers.loadFailed",
                  "Failed to load teachers or roles"
                )
              }
              onRetry={() => {
                refetchTeachers();
                refetchRoles();
              }}
              variant="card"
            />
          </div>
        ) : totalRows === 0 && !debouncedSearch ? (
          <div className="py-16 px-4 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {t("thesisManagement.teachers.emptyTitle", "No teachers assigned yet")}
            </h3>
            {canModify && (
              <Button
                size="sm"
                onClick={() => setOpenAssignTeacher(true)}
                className="gap-1.5"
              >
                <UserPlus className="h-4 w-4" />
                {t("thesisManagement.teachers.assignTeacher", "Assign Teacher")}
              </Button>
            )}
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("common.noResultsFound", "No teachers match your search filter.")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">
                    {t("thesisManagement.teachers.table.teacher", "Teacher")}
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    {t("thesisManagement.teachers.table.email", "Email")}
                  </TableHead>

                  {/* One column per role */}
                  {roles.map((role) => (
                    <TableHead
                      key={role._id}
                      className="text-center min-w-[130px] font-semibold"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{role.name}</span>
                      </div>
                    </TableHead>
                  ))}

                  {canModify && (
                    <TableHead className="text-right w-[100px]">
                      {t("thesisManagement.teachers.table.actions", "Actions")}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody
                className={
                  isTeachersFetching
                    ? "opacity-50 pointer-events-none transition-opacity duration-150"
                    : ""
                }
              >
                {assignments.map((assignment) => {
                  const teacher = assignment.teacher;
                  const fullName =
                    `${teacher?.first_name || ""} ${teacher?.last_name || ""}`.trim() ||
                    teacher?.email ||
                    "-";

                  return (
                    <TableRow key={assignment._id} className="hover:bg-muted/40">
                      {/* Teacher info */}
                      <TableCell className="font-medium text-sm text-foreground">
                        {fullName}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-muted-foreground">
                        {teacher?.email || "-"}
                      </TableCell>

                      {/* Role switches */}
                      {roles.map((role) => {
                        const roleAssignment = (assignment.roles || []).find(
                          (r) =>
                            String(r.role?._id || r.role) === String(role._id)
                        );
                        const isEnabled = Boolean(roleAssignment?.enabled);

                        return (
                          <TableCell key={role._id} className="text-center">
                            <div className="flex justify-center items-center">
                              <Switch
                                checked={isEnabled}
                                onCheckedChange={() =>
                                  handleToggleRole(
                                    assignment._id,
                                    role._id,
                                    isEnabled
                                  )
                                }
                                disabled={!canModify || updateRole.isPending}
                                aria-label={`${role.name} for ${fullName}`}
                              />
                            </div>
                          </TableCell>
                        );
                      })}

                      {/* Remove Action */}
                      {canModify && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTeacherToRemove(assignment)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title={t(
                              "thesisManagement.teachers.removeTooltip",
                              "Remove teacher from thesis"
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalRows > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      )}

      {/* Add Role Modal */}
      <AddThesisRoleModal
        open={openAddRole}
        onClose={() => setOpenAddRole(false)}
      />

      {/* Assign Teacher Modal */}
      <AssignThesisTeacherModal
        open={openAssignTeacher}
        onClose={() => setOpenAssignTeacher(false)}
        thesisId={id}
        assignedTeacherIds={activeTeacherIds}
      />

      {/* Remove Confirmation Dialog */}
      <RemoveThesisTeacherConfirm
        open={!!teacherToRemove}
        onClose={() => setTeacherToRemove(null)}
        onConfirm={handleConfirmRemove}
        teacherName={
          teacherToRemove
            ? `${teacherToRemove.teacher?.first_name || ""} ${teacherToRemove.teacher?.last_name || ""}`.trim() ||
              teacherToRemove.teacher?.email
            : ""
        }
        isLoading={removeTeacher.isPending}
      />
    </div>
  );
};

export default ThesisTeachers;
