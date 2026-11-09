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
  Download,
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
import TrajectoryFormDataTab from "@/components/admin/thesis/TrajectoryFormDataTab";
import {
  useGetThesisById,
  useGetTrajectoryStudents,
  useExportTrajectoryStudentsCsv,
} from "@/store/useThesisStore";
import { useThesisAdminKind } from "@/hooks/useThesisAdminKind";

export default function TrajectoryDetails() {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const thesisId = params.id;
  const trajectoryId = params.trajectoryId;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { type: thesisType, basePath, label: kindLabel } = useThesisAdminKind();
  const canModify = useCanModify(basePath);

  const [activeTab, setActiveTab] = useState("enrolled");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    batch: "all",
    supervisor: "all",
    reader: "all",
    status: "all",
  });
  const [draftFilters, setDraftFilters] = useState({
    batch: "all",
    supervisor: "all",
    reader: "all",
    status: "all",
  });
  const debouncedSearch = useDebounce(search, 400);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isEnrolledTab = activeTab === "enrolled";
  const isFormDataTab = activeTab === "form-data";

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
  };

  const {
    data: thesisResponse,
    isLoading: isThesisLoading,
    error: thesisError,
  } = useGetThesisById(thesisId, { type: thesisType });

  const enrolledParams = {
    page: isEnrolledTab ? page : 1,
    limit: isEnrolledTab ? rowsPerPage : 10,
    ...(isEnrolledTab && debouncedSearch ? { search: debouncedSearch } : {}),
    ...(isEnrolledTab && appliedFilters.batch !== "all"
      ? { batch: appliedFilters.batch }
      : {}),
    ...(isEnrolledTab && appliedFilters.supervisor !== "all"
      ? { supervisor: appliedFilters.supervisor }
      : {}),
    ...(isEnrolledTab && appliedFilters.reader !== "all"
      ? { reader: appliedFilters.reader }
      : {}),
    ...(isEnrolledTab && appliedFilters.status !== "all"
      ? { status: appliedFilters.status }
      : {}),
  };

  const {
    data: enrolledResponse,
    isLoading: isEnrolledLoading,
    isFetching: isEnrolledFetching,
    error: enrolledError,
    refetch: refetchEnrolled,
  } = useGetTrajectoryStudents(thesisId, trajectoryId, enrolledParams);

  const exportEnrolledCsvMutation = useExportTrajectoryStudentsCsv();
  const exportCsvPending = exportEnrolledCsvMutation.isPending;

  const handleExportCsv = () => {
    const { page: _page, limit: _limit, ...exportParams } = enrolledParams;
    exportEnrolledCsvMutation.mutate({
      thesisId,
      trajectoryId,
      params: exportParams,
    });
  };

  const thesis = thesisResponse?.data;
  const enrolledData = enrolledResponse?.data;
  const trajectory = enrolledData?.trajectory;
  const nextDeadline = enrolledData?.next_deadline;
  const enrolledCount =
    enrolledResponse?.total_count ?? enrolledData?.total_count ?? 0;
  const formSteps = enrolledData?.form_steps || [];
  const hasFormSteps = formSteps.length > 0;

  useEffect(() => {
    if (!hasFormSteps && activeTab === "form-data") {
      setActiveTab("enrolled");
    }
  }, [hasFormSteps, activeTab]);

  const students = enrolledData?.students || [];
  const totalRows = enrolledCount;
  const isListLoading = isEnrolledLoading;
  const isListFetching = isEnrolledFetching;
  const listError = enrolledError;
  const refetchList = refetchEnrolled;

  useEffect(() => {
    updateBreadcrumbs([
      {
        label: kindLabel,
        path: basePath,
        navigable: true,
      },
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

    return () => {
      updateBreadcrumbs([]);
    };
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

  const isLoading =
    isThesisLoading || (isEnrolledLoading && !enrolledData);
  const error = thesisError || enrolledError;

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
          onRetry={refetchEnrolled}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              {t(
                "thesisManagement.trajectories.editTrajectory",
                "Edit Trajectory"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title={t(
            "thesisManagement.trajectories.trajectoryName",
            "Cohort Name"
          )}
          value={trajectory.name}
          subtitle={thesis?.name || t("thesisManagement.title", "Thesis")}
          icon={Compass}
        />

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
          title={t(
            "thesisManagement.trajectories.finalDeadline",
            "Final Deadline"
          )}
          value={
            trajectory.end_date
              ? moment(trajectory.end_date).format("DD/MM/YYYY")
              : "—"
          }
          icon={Clock}
        />

        <DashboardCard
          title={t(
            "thesisManagement.trajectories.enrolledStudents",
            "Enrolled Students"
          )}
          value={enrolledCount}
          subtitle={
            nextDeadline
              ? `${t("thesisManagement.nextDeadline", "Next")}: ${moment(
                  nextDeadline.date
                ).format("DD/MM/YYYY")}`
              : t(
                  "thesisManagement.noUpcomingDeadlines",
                  "No upcoming deadlines"
                )
          }
          icon={Users}
        />
      </div>

      <div className="space-y-4 pt-2">
        {hasFormSteps ? (
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                {
                  id: "enrolled",
                  label: t(
                    "thesisManagement.trajectories.enrolledStudents",
                    "Enrolled students"
                  ),
                },
                {
                  id: "form-data",
                  label: t(
                    "thesisManagement.formData.tab",
                    "Form data"
                  ),
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              {t(
                "thesisManagement.trajectories.enrolledStudents",
                "Enrolled students"
              )}
            </h2>
          </div>
        )}

        {isFormDataTab && hasFormSteps ? (
          <TrajectoryFormDataTab
            thesisId={thesisId}
            trajectoryId={trajectoryId}
            basePath={basePath}
            formSteps={formSteps}
          />
        ) : (
          <>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t(
                "common.search",
                "Search by student name or UID..."
              )}
              value={search}
              onChange={handleSearchChange}
              className="pl-9 h-9 text-xs sm:text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <TrajectoryStudentsFilterDrawer
                filterOptions={enrolledData?.filter_options}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
                setPage={setPage}
              />
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exportCsvPending}
              className="gap-2 h-9"
            >
              <Download className="w-4 h-4" />
              {exportCsvPending
                ? t("common.exporting", "Exporting...")
                : t("common.exportCsv", "Export CSV")}
            </Button>
          </div>
        </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("thesisManagement.table.studentUid", "Student UID")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.studentName", "Student Name")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.group", "Group")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.supervisor", "Supervisor")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.reader", "Reader")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.attempt", "Attempt")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.status", "Status")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={
                isListFetching ? "opacity-50 pointer-events-none" : ""
              }
            >
              {isListLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={7} />
              ) : listError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-8">
                    <ErrorMessage
                      message={
                        listError?.message ||
                        t("common.failedToLoad", "Failed to load data")
                      }
                      onRetry={refetchList}
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
                    : t(
                        "thesisManagement.trajectories.unknownStudent",
                        "Unknown Student"
                      );
                  const attemptStatus = row.attempt?.status || "active";

                  return (
                    <TableRow
                      key={row.payment_id}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
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
                      <TableCell>{student?.uid || "-"}</TableCell>
                      <TableCell>{studentName}</TableCell>
                      <TableCell>{row.batch?.name || "-"}</TableCell>
                      <TableCell>{row.supervisor?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div>{row.reader?.name || "-"}</div>
                          {row.additional_reader?.name ? (
                            <div className="text-xs text-muted-foreground">
                              {t(
                                "thesisManagement.table.additionalReader",
                                "Additional"
                              )}
                              : {row.additional_reader.name}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.attempt?.attempt_number ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={attemptStatus} />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {search ||
                    Object.values(appliedFilters).some(
                      (val) =>
                        val !== "all" && val !== undefined && val !== ""
                    )
                      ? t(
                          "common.noResultsFound",
                          "No students match your search query."
                        )
                      : t(
                          "thesisManagement.trajectories.noStudentsEnrolled",
                          "No students have enrolled in this trajectory cohort yet."
                        )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
          </>
        )}
      </div>

      {isEditModalOpen && (
        <TrajectoryModal
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            refetchEnrolled();
          }}
          thesisId={thesisId}
          initialData={trajectory}
        />
      )}

    </div>
  );
}
