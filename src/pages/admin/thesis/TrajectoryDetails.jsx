import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import moment from "moment";
import {
  Compass,
  Calendar,
  Clock,
  Users,
  Search,
  Edit,
} from "lucide-react";

import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useCanModify } from "@/hooks/useCanModify";
import { useDebounce } from "@/hooks/useDebounce";
import { LoadingState, ErrorMessage } from "@/components/common";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/StatusBadge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table/table";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import TrajectoryModal from "@/components/admin/thesis/TrajectoryModal";
import TrajectoryStudentsFilterDrawer from "@/components/admin/thesis/TrajectoryStudentsFilterDrawer";
import {
  useGetThesisById,
  useGetTrajectoryStudents,
} from "@/store/useThesisStore";

export default function TrajectoryDetails() {
  const { t } = useTranslation();
  const canModify = useCanModify("operations");
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const thesisId = params.id;
  const trajectoryId = params.trajectoryId;
  const { updateBreadcrumbs } = useBreadcrumb();

  // Pagination & Search state
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

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Queries
  const {
    data: thesisResponse,
    isLoading: isThesisLoading,
    error: thesisError,
  } = useGetThesisById(thesisId);

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

  // Breadcrumbs (handles navigation, no back button needed)
  useEffect(() => {
    updateBreadcrumbs([
      {
        label: t("thesisManagement.title", "Theses"),
        path: "/admin/thesis",
        navigable: true,
      },
      {
        label: thesis?.name || "Thesis",
        path: `/admin/thesis/${thesisId}`,
        navigable: true,
      },
      {
        label: trajectory?.name || t("thesisManagement.trajectories.trajectory", "Cohort Trajectory"),
        path: `/admin/thesis/${thesisId}/trajectories/${trajectoryId}`,
        navigable: false,
      },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, [thesis?.name, trajectory?.name, thesisId, trajectoryId, updateBreadcrumbs, t]);

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
      {/* Top Action Bar (matches ProgramDetail.jsx layout) */}
      <div className="flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {canModify && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-1.5"
            >
              <Edit className="w-4 h-4" />
              {t("thesisManagement.trajectories.editTrajectory", "Edit Trajectory")}
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Information Cards (matches ProgramDetail.jsx grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={t("thesisManagement.trajectories.trajectoryName", "Cohort Name")}
          value={trajectory.name}
          subtitle={thesis?.name || t("thesisManagement.title", "Thesis")}
          icon={Compass}
        />

        <DashboardCard
          title={t("thesisManagement.trajectories.startsOn", "Start Date")}
          value={moment(trajectory.start_date).format("DD/MM/YYYY")}
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

      {/* Enrolled Students Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t("thesisManagement.trajectories.enrolledStudents", "Enrolled Students")}
            </h2>
          </div>

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

        {/* Student List Table (matches program/index.jsx format) */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("thesisManagement.table.studentUid", "Student UID")}</TableHead>
              <TableHead>{t("thesisManagement.table.studentName", "Student Name")}</TableHead>
              <TableHead>{t("thesisManagement.table.group", "Group")}</TableHead>
              <TableHead>{t("thesisManagement.table.supervisor", "Supervisor")}</TableHead>
              <TableHead>{t("thesisManagement.table.reader", "Reader")}</TableHead>
              <TableHead>{t("thesisManagement.table.attempt", "Attempt")}</TableHead>
              <TableHead>{t("thesisManagement.table.status", "Status")}</TableHead>
              <TableHead>{t("thesisManagement.table.attention", "Attention")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isTrajectoryFetching ? "opacity-50 pointer-events-none" : ""}>
            {isTrajectoryLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={8} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center p-8">
                  <ErrorMessage
                    message={error?.message || t("common.failedToLoad", "Failed to load data")}
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
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
                      : "—";

                return (
                  <TableRow
                    key={row.payment_id}
                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (student?._id) {
                        navigate({
                          to: `/admin/thesis/$id/trajectories/$trajectoryId/students/$userId`,
                          params: {
                            id: thesisId,
                            trajectoryId,
                            userId: student._id,
                          },
                        });
                      }
                    }}
                  >
                    <TableCell className="font-medium text-primary hover:underline">{student?.uid || "—"}</TableCell>
                    <TableCell className="font-medium">{studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{row.batch?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.supervisor?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.reader?.name || "—"}</TableCell>
                    <TableCell>{row.attempt?.attempt_number ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={attemptStatus} />
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs font-medium ${
                          row.attention === "suggest_fail"
                            ? "text-destructive"
                            : row.attention === "suggest_pass"
                              ? "text-emerald-700"
                              : "text-muted-foreground"
                        }`}
                      >
                        {attentionLabel}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  {search ||
                  Object.values(appliedFilters).some(
                    (val) => val !== "all" && val !== undefined && val !== ""
                  )
                    ? t("common.noResultsFound", "No students match your search query.")
                    : t(
                        "thesisManagement.trajectories.noStudentsEnrolled",
                        "No students have enrolled in this trajectory cohort yet."
                      )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Server-side Pagination controls (matching Program module pattern) */}
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      </div>

      {/* Edit Trajectory Modal */}
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
