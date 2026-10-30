import React, { useEffect, useState, useMemo, Fragment } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Pencil,
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
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useGetThesisById,
  useGetThesisRoles,
  useGetThesisTeachers,
  useUpdateThesisTeacherRole,
  useRemoveThesisTeacher,
} from "@/store/useThesisStore";
import ManageThesisRolesModal from "@/components/admin/thesis/ManageThesisRolesModal";
import AssignThesisTeacherModal from "@/components/admin/thesis/AssignThesisTeacherModal";
import EditExternalTeacherModal from "@/components/admin/thesis/EditExternalTeacherModal";
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
  const [teacherType, setTeacherType] = useState("all");
  const [openManageRoles, setOpenManageRoles] = useState(false);
  const [openAssignTeacher, setOpenAssignTeacher] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);
  const [teacherToRemove, setTeacherToRemove] = useState(null);

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, teacherType]);

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
    ...(teacherType !== "all" ? { teacher_type: teacherType } : {}),
  });

  // Mutations
  const updateRole = useUpdateThesisTeacherRole();
  const removeTeacher = useRemoveThesisTeacher();

  const thesis = thesisResponse?.data;
  const roles = useMemo(() => {
    const rawRoles = rolesResponse?.data || [];
    const seen = new Set();
    return rawRoles.filter((r) => {
      if (r.status === false) return false;
      const key = r.key || r.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [rolesResponse?.data]);
  const assignments = useMemo(() => teachersResponse?.data || [], [teachersResponse?.data]);
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
                variant="secondary"
                size="sm"
                onClick={() => setOpenManageRoles(true)}
                className="gap-1.5 shadow-2xs"
              >
                <Shield className="h-4 w-4 text-muted-foreground" />
                {t("thesisManagement.teachers.manageRoles", "Manage Roles")}
              </Button>
              <Button
                size="sm"
                onClick={() => setOpenAssignTeacher(true)}
                className="gap-1.5 shadow-2xs"
              >
                <UserPlus className="h-4 w-4" />
                {t("thesisManagement.teachers.assignTeacher", "Assign Teacher")}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar & Type Filter */}
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

        {/* Type Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg text-xs font-medium self-start sm:self-center">
          {[
            { key: "all", label: t("common.all", "All") },
            {
              key: "internal",
              label: t("thesisManagement.teachers.internal", "Internal"),
            },
            {
              key: "external",
              label: t("thesisManagement.teachers.external", "External"),
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTeacherType(tab.key)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${teacherType === tab.key
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.label}
            </button>
          ))}
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
                className="gap-1.5 shadow-2xs"
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

                  {/* One switch column + one count column per role */}
                  {roles.map((role) => (
                    <Fragment key={role._id}>
                      <TableHead className="text-center min-w-[110px] font-semibold">
                        {role.name}
                      </TableHead>
                      <TableHead className="text-center min-w-[100px] font-semibold">
                        {role.key === "supervisor"
                          ? t("thesisManagement.teachers.table.supervising", "Supervising")
                          : role.key === "reader"
                            ? t("thesisManagement.teachers.table.reading", "Reading")
                            : `${role.name}`}
                      </TableHead>
                    </Fragment>
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
                  const isExternal = assignment.teacher_type === "external";
                  const teacher = assignment.teacher;
                  const extProfile = assignment.external_profile;
                  const fullName = isExternal
                    ? `${extProfile?.first_name || ""} ${extProfile?.last_name || ""}`.trim() ||
                    extProfile?.email ||
                    t("thesisManagement.teachers.external", "External Teacher")
                    : `${teacher?.first_name || ""} ${teacher?.last_name || ""}`.trim() ||
                    teacher?.email ||
                    "-";

                  return (
                    <TableRow key={assignment._id} className="hover:bg-muted/40">
                      {/* Teacher info */}
                      <TableCell className="font-medium text-sm text-foreground">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>{fullName}</span>
                          {isExternal ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-normal"
                            >
                              {t("thesisManagement.teachers.external", "External")}
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground"
                            >
                              {t("thesisManagement.teachers.internal", "Internal")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-muted-foreground">
                        {isExternal ? extProfile?.email || "-" : teacher?.email || "-"}
                      </TableCell>

                      {/* One switch column + one count column per role */}
                      {roles.map((role) => {
                        const roleAssignment = (assignment.roles || []).find(
                          (r) =>
                            String(r.role?._id || r.role) === String(role._id)
                        );
                        const isEnabled = Boolean(roleAssignment?.enabled);
                        const studentCount =
                          roleAssignment?.assigned_students_count ??
                          (role.key === "supervisor"
                            ? assignment.assigned_students_count?.supervisor
                            : role.key === "reader"
                              ? assignment.assigned_students_count?.reader
                              : 0) ??
                          0;

                        return (
                          <Fragment key={role._id}>
                            {/* Role Switch */}
                            <TableCell className="text-center">
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

                            {/* Assigned Student Count */}
                            <TableCell className="text-center font-medium text-sm text-foreground tabular-nums">
                              {studentCount}
                            </TableCell>
                          </Fragment>
                        );
                      })}

                      {/* Actions */}
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isExternal && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTeacherToEdit(assignment)}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                title={t(
                                  "thesisManagement.teachers.editExternalTooltip",
                                  "Edit external teacher details"
                                )}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
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
                          </div>
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

      {/* Manage Roles Modal */}
      <ManageThesisRolesModal
        open={openManageRoles}
        onClose={() => setOpenManageRoles(false)}
      />

      {/* Assign Teacher Modal */}
      <AssignThesisTeacherModal
        open={openAssignTeacher}
        onClose={() => setOpenAssignTeacher(false)}
        thesisId={id}
        assignedTeacherIds={activeTeacherIds}
      />

      {/* Edit External Teacher Modal */}
      {teacherToEdit && (
        <EditExternalTeacherModal
          open={!!teacherToEdit}
          onClose={() => setTeacherToEdit(null)}
          thesisId={id}
          assignment={teacherToEdit}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <RemoveThesisTeacherConfirm
        open={!!teacherToRemove}
        onClose={() => setTeacherToRemove(null)}
        onConfirm={handleConfirmRemove}
        teacherName={
          teacherToRemove
            ? teacherToRemove.teacher_type === "external"
              ? `${teacherToRemove.external_profile?.first_name || ""} ${teacherToRemove.external_profile?.last_name || ""}`.trim() ||
              teacherToRemove.external_profile?.email ||
              "External Teacher"
              : `${teacherToRemove.teacher?.first_name || ""} ${teacherToRemove.teacher?.last_name || ""}`.trim() ||
              teacherToRemove.teacher?.email
            : ""
        }
        isLoading={removeTeacher.isPending}
      />
    </div>
  );
};

export default ThesisTeachers;
