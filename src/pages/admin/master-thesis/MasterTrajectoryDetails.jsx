import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  Calendar,
  Clock,
  Users,
  Search,
  Edit,
  ChevronRight,
  User,
} from "lucide-react";

import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { useDebounce } from "@/hooks/useDebounce";
import { LoadingState, ErrorMessage } from "@/components/common";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import { Pagination } from "@/components/ui/table/Pagination";
import TrajectoryModal from "@/components/admin/thesis/TrajectoryModal";
import TrajectoryStudentsFilterDrawer from "@/components/admin/thesis/TrajectoryStudentsFilterDrawer";
import {
  useGetThesisById,
  useGetTrajectoryStudents,
} from "@/store/useThesisStore";
import { useThesisAdminKind } from "@/hooks/useThesisAdminKind";

export default function MasterTrajectoryDetails() {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const thesisId = params.id;
  const trajectoryId = params.trajectoryId;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { type: thesisType, basePath, label: kindLabel } = useThesisAdminKind();
  const canModify = useCanModify(basePath);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    batch: "all",
    supervisor: "all",
    reader: "all",
    status: "all",
    attention: "all",
  });
  const [draftFilters, setDraftFilters] = useState({
    batch: "all",
    supervisor: "all",
    reader: "all",
    status: "all",
    attention: "all",
  });
  const debouncedSearch = useDebounce(search, 400);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const {
    data: thesisResponse,
    isLoading: isThesisLoading,
    error: thesisError,
  } = useGetThesisById(thesisId, { type: thesisType });

  const queryParams = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(appliedFilters.batch !== "all" ? { batch: appliedFilters.batch } : {}),
    ...(appliedFilters.supervisor !== "all"
      ? { supervisor: appliedFilters.supervisor }
      : {}),
    ...(appliedFilters.reader !== "all" ? { reader: appliedFilters.reader } : {}),
    ...(appliedFilters.status !== "all" ? { status: appliedFilters.status } : {}),
    ...(appliedFilters.attention !== "all"
      ? { attention: appliedFilters.attention }
      : {}),
  };

  const {
    data: trajectoryResponse,
    isLoading: isTrajectoryLoading,
    isFetching: isTrajectoryFetching,
    error: trajectoryError,
    refetch,
  } = useGetTrajectoryStudents(thesisId, trajectoryId, queryParams);

  const thesis = thesisResponse?.data;
  const trajectoryData = trajectoryResponse?.data;
  const trajectory = trajectoryData?.trajectory;
  const students = trajectoryData?.students || [];
  const nextDeadline = trajectoryData?.next_deadline;
  const totalRows =
    trajectoryResponse?.total_count ?? trajectoryData?.total_count ?? 0;

  useEffect(() => {
    updateBreadcrumbs([
      { label: kindLabel, path: basePath, navigable: true },
      {
        label: thesis?.name || kindLabel,
        path: `${basePath}/${thesisId}`,
        navigable: true,
      },
      {
        label:
          trajectory?.name ||
          t("thesisManagement.trajectories.trajectory", "Cohort Trajectory"),
        path: `${basePath}/${thesisId}/trajectories/${trajectoryId}`,
        navigable: false,
      },
    ]);
    return () => updateBreadcrumbs([]);
  }, [
    thesis?.name,
    trajectory?.name,
    thesisId,
    trajectoryId,
    updateBreadcrumbs,
    t,
    basePath,
    kindLabel,
  ]);

  const isLoading = isThesisLoading || (isTrajectoryLoading && !trajectoryData);
  const error = thesisError || trajectoryError;

  if (isLoading) {
    return (
      <LoadingState
        text={t("common.loading", "Loading trajectory details...")}
        fullHeight
      />
    );
  }

  if (error || !trajectory) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={
            error?.message ||
            t("thesisManagement.trajectories.notFound", "Trajectory not found")
          }
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {kindLabel}
          </p>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {trajectory.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {thesis?.name}
          </p>
        </div>
        {canModify && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <Edit className="w-4 h-4" />
            {t("thesisManagement.trajectories.editTrajectory", "Edit Trajectory")}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title={t("thesisManagement.trajectories.startsOn", "Start Date")}
          value={
            trajectory.start_date
              ? moment(trajectory.start_date).format("DD/MM/YYYY")
              : "—"
          }
          icon={Calendar}
        />
        <DashboardCard
          title={t("thesisManagement.trajectories.finalDeadline", "Final Deadline")}
          value={
            trajectory.end_date
              ? moment(trajectory.end_date).format("DD/MM/YYYY")
              : "—"
          }
          icon={Clock}
        />
        <DashboardCard
          title={t("thesisManagement.trajectories.enrolledStudents", "Enrolled Students")}
          value={totalRows}
          subtitle={
            nextDeadline
              ? `${t("thesisManagement.nextDeadline", "Next")}: ${moment(nextDeadline.date).format("DD/MM/YYYY")}`
              : t("thesisManagement.noUpcomingDeadlines", "No upcoming deadlines")
          }
          icon={Users}
        />
      </div>

      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {t("thesisManagement.trajectories.enrolledStudents", "Enrolled Students")}
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search", "Search by student name or UID...")}
                value={search}
                onChange={handleSearchChange}
                className="pl-9 h-9 text-xs sm:text-sm"
              />
            </div>
            <TrajectoryStudentsFilterDrawer
              filterOptions={trajectoryData?.filter_options}
              draftFilters={draftFilters}
              setDraftFilters={setDraftFilters}
              appliedFilters={appliedFilters}
              setAppliedFilters={setAppliedFilters}
              setPage={setPage}
            />
          </div>
        </div>

        <div
          className={`space-y-3 ${isTrajectoryFetching ? "opacity-50 pointer-events-none" : ""}`}
        >
          {isTrajectoryLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-border bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : students?.length > 0 ? (
            students.map((row) => {
              const student = row.student;
              const studentName = student
                ? `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                  student.email
                : "Unknown Student";
              const attemptStatus = row.attempt?.status || "active";
              const attentionLabel =
                row.attention === "suggest_fail"
                  ? t("thesisManagement.attempt.suggestFail", "Overdue — review fail")
                  : row.attention === "suggest_pass"
                    ? t("thesisManagement.attempt.suggestPass", "Ready for pass")
                    : null;

              return (
                <button
                  type="button"
                  key={row.payment_id}
                  className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/20 transition-colors p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
                  onClick={() => {
                    if (student?._id) {
                      navigate({
                        to: `${basePath}/$id/trajectories/$trajectoryId/students/$userId`,
                        params: {
                          id: thesisId,
                          trajectoryId,
                          userId: student._id,
                        },
                      });
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {studentName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student?.uid || "—"}
                        {row.batch?.name ? ` · ${row.batch.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs flex-1">
                    <div>
                      <p className="text-muted-foreground">
                        {t("thesisManagement.table.supervisor", "Supervisor")}
                      </p>
                      <p className="font-medium text-foreground truncate">
                        {row.supervisor?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t("thesisManagement.table.reader", "Reader")}
                      </p>
                      <p className="font-medium text-foreground truncate">
                        {row.reader?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t("thesisManagement.table.attempt", "Attempt")}
                      </p>
                      <p className="font-medium text-foreground">
                        {row.attempt?.attempt_number ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={attemptStatus} />
                      {attentionLabel && (
                        <span
                          className={`text-[11px] font-medium ${
                            row.attention === "suggest_fail"
                              ? "text-destructive"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {attentionLabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              {search ||
              Object.values(appliedFilters).some(
                (val) => val !== "all" && val !== undefined && val !== ""
              )
                ? t("common.noResultsFound", "No students match your search query.")
                : t(
                    "thesisManagement.trajectories.noStudentsEnrolled",
                    "No students have enrolled in this trajectory cohort yet."
                  )}
            </div>
          )}
        </div>

        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      </div>

      {isEditModalOpen && (
        <TrajectoryModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            refetch();
          }}
          thesisId={thesisId}
          initialData={trajectory}
        />
      )}
    </div>
  );
}
