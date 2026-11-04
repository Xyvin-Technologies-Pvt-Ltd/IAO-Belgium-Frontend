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
  Plus,
  Video,
  ExternalLink,
  Eye,
  Trash2,
  MessageSquare,
  FileText,
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
import TrajectoryQnaModal from "@/components/admin/thesis/TrajectoryQnaModal";
import DeleteConfirm from "@/components/DeleteConfirm";
import {
  useGetThesisById,
  useGetTrajectoryStudents,
  useGetTrajectoryEligibleStudents,
  useGetTrajectoryQnaAnnouncements,
  useDeleteTrajectoryQnaAnnouncement,
  useExportTrajectoryStudentsCsv,
  useExportTrajectoryEligibleStudentsCsv,
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

  const [activeTab, setActiveTab] = useState("enrolled");
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

  const isEnrolledTab = activeTab === "enrolled";
  const isEligibleTab = activeTab === "eligible";
  const isQnaTab = activeTab === "qna";

  const [qnaAudience, setQnaAudience] = useState("all");
  const [isQnaModalOpen, setIsQnaModalOpen] = useState(false);
  const [qnaModalMode, setQnaModalMode] = useState("create");
  const [selectedQnaItem, setSelectedQnaItem] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [qnaItemToDelete, setQnaItemToDelete] = useState(null);

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
    ...(isEnrolledTab && appliedFilters.attention !== "all"
      ? { attention: appliedFilters.attention }
      : {}),
  };

  const eligibleParams = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const {
    data: enrolledResponse,
    isLoading: isEnrolledLoading,
    isFetching: isEnrolledFetching,
    error: enrolledError,
    refetch: refetchEnrolled,
  } = useGetTrajectoryStudents(thesisId, trajectoryId, enrolledParams);

  const {
    data: eligibleResponse,
    isLoading: isEligibleLoading,
    isFetching: isEligibleFetching,
    error: eligibleError,
    refetch: refetchEligible,
  } = useGetTrajectoryEligibleStudents(
    thesisId,
    trajectoryId,
    eligibleParams,
    { enabled: !!thesisId && !!trajectoryId && isEligibleTab }
  );

  const qnaParams = {
    audience: qnaAudience,
    page: isQnaTab ? page : 1,
    limit: isQnaTab ? rowsPerPage : 10,
    ...(isQnaTab && debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const {
    data: qnaResponse,
    isLoading: isQnaLoading,
    isFetching: isQnaFetching,
    error: qnaError,
    refetch: refetchQna,
  } = useGetTrajectoryQnaAnnouncements(thesisId, trajectoryId, qnaParams, {
    enabled: !!thesisId && !!trajectoryId && isQnaTab,
  });

  const deleteQnaMutation = useDeleteTrajectoryQnaAnnouncement();
  const exportEnrolledCsvMutation = useExportTrajectoryStudentsCsv();
  const exportEligibleCsvMutation = useExportTrajectoryEligibleStudentsCsv();

  const exportCsvPending =
    exportEnrolledCsvMutation.isPending || exportEligibleCsvMutation.isPending;

  const handleExportCsv = () => {
    if (isEligibleTab) {
      const { page: _page, limit: _limit, ...exportParams } = eligibleParams;
      exportEligibleCsvMutation.mutate({
        thesisId,
        trajectoryId,
        params: exportParams,
      });
      return;
    }
    const { page: _page, limit: _limit, ...exportParams } = enrolledParams;
    exportEnrolledCsvMutation.mutate({
      thesisId,
      trajectoryId,
      params: exportParams,
    });
  };

  const qnaData = qnaResponse?.data;
  const qnaItems = qnaData?.items || [];
  const qnaCounts = qnaData?.counts || {
    all: 0,
    before_purchase: 0,
    after_purchase: 0,
  };
  const qnaTotalCount = qnaResponse?.total_count ?? qnaData?.total_count ?? 0;

  const thesis = thesisResponse?.data;
  const enrolledData = enrolledResponse?.data;
  const eligibleData = eligibleResponse?.data;
  const trajectory = enrolledData?.trajectory || eligibleData?.trajectory;
  const nextDeadline = enrolledData?.next_deadline;
  const enrolledCount =
    enrolledResponse?.total_count ?? enrolledData?.total_count ?? 0;

  const students = isEnrolledTab
    ? enrolledData?.students || []
    : eligibleData?.students || [];
  const totalRows = isEnrolledTab
    ? enrolledCount
    : eligibleResponse?.total_count ?? eligibleData?.total_count ?? 0;
  const isListLoading = isEnrolledTab ? isEnrolledLoading : isEligibleLoading;
  const isListFetching = isEnrolledTab ? isEnrolledFetching : isEligibleFetching;
  const listError = isEnrolledTab ? enrolledError : eligibleError;
  const refetchList = isEnrolledTab ? refetchEnrolled : refetchEligible;

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
    isThesisLoading || (isEnrolledLoading && !enrolledData && !eligibleData);
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
          {canModify && isQnaTab && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedQnaItem(null);
                setQnaModalMode("create");
                setIsQnaModalOpen(true);
              }}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              <Plus className="w-4 h-4" />
              {t("thesisManagement.qna.addQna", "Add Q&A or Announcement")}
            </Button>
          )}
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
                id: "eligible",
                label: t(
                  "thesisManagement.trajectories.eligibleStudents",
                  "Eligible students"
                ),
              },
              {
                id: "qna",
                label: t(
                  "thesisManagement.trajectories.qnaAnnouncements",
                  "Q&A and Announcements"
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

        {isQnaTab ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  {
                    id: "all",
                    label: t("common.all", "All"),
                    count: qnaCounts.all,
                  },
                  {
                    id: "before_purchase",
                    label: t(
                      "thesisManagement.qna.beforePurchase",
                      "Before purchase"
                    ),
                    count: qnaCounts.before_purchase,
                  },
                  {
                    id: "after_purchase",
                    label: t(
                      "thesisManagement.qna.afterPurchase",
                      "After purchase"
                    ),
                    count: qnaCounts.after_purchase,
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setQnaAudience(f.id);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      qnaAudience === f.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        qnaAudience === f.id
                          ? "bg-white/20 text-white"
                          : "bg-background text-foreground"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t(
                    "thesisManagement.qna.searchPlaceholder",
                    "Search by title..."
                  )}
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9 h-9 text-xs sm:text-sm"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("thesisManagement.table.title", "Title")}
                  </TableHead>
                  <TableHead>
                    {t("thesisManagement.table.typeAndDate", "Type & Date")}
                  </TableHead>
                  <TableHead>
                    {t("thesisManagement.table.audience", "Audience")}
                  </TableHead>
                  <TableHead>
                    {t("thesisManagement.table.callLink", "Video Call")}
                  </TableHead>
                  <TableHead>
                    {t("thesisManagement.table.attachments", "Media")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions", "Actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                className={
                  isQnaFetching ? "opacity-50 pointer-events-none" : ""
                }
              >
                {isQnaLoading ? (
                  <TableSkeleton rows={4} columns={6} />
                ) : qnaError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-8">
                      <ErrorMessage
                        message={
                          qnaError?.message ||
                          t("common.failedToLoad", "Failed to load data")
                        }
                        onRetry={refetchQna}
                        variant="inline"
                      />
                    </TableCell>
                  </TableRow>
                ) : qnaItems.length > 0 ? (
                  qnaItems.map((item) => {
                    const totalAttachments =
                      (item.attachments?.length || 0) +
                      (item.videos?.length || 0) +
                      (item.links?.length || 0);

                    return (
                      <TableRow
                        key={item._id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-semibold text-foreground max-w-xs truncate">
                          {item.title}
                        </TableCell>
                        <TableCell>
                          {item.scheduled_at ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                              <Calendar className="w-3 h-3" />
                              {moment(item.scheduled_at).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                              <MessageSquare className="w-3 h-3" />
                              {t(
                                "thesisManagement.qna.announcement",
                                "Announcement"
                              )}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.audience === "before_purchase"
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {item.audience === "before_purchase"
                              ? t(
                                  "thesisManagement.qna.beforePurchase",
                                  "Before purchase"
                                )
                              : t(
                                  "thesisManagement.qna.afterPurchase",
                                  "After purchase"
                                )}
                          </span>
                        </TableCell>
                        <TableCell>
                          {item.video_call_link ? (
                            <a
                              href={item.video_call_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline max-w-[160px] truncate"
                            >
                              <Video className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {item.video_call_link}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {totalAttachments > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                              <FileText className="w-3.5 h-3.5" />
                              {totalAttachments} {t("common.items", "items")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              title={t("common.view", "View")}
                              onClick={() => {
                                setSelectedQnaItem(item);
                                setQnaModalMode("view");
                                setIsQnaModalOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canModify && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title={t("common.edit", "Edit")}
                                  onClick={() => {
                                    setSelectedQnaItem(item);
                                    setQnaModalMode("edit");
                                    setIsQnaModalOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                  title={t("common.delete", "Delete")}
                                  onClick={() => {
                                    setQnaItemToDelete(item);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {search || qnaAudience !== "all"
                        ? t(
                            "common.noResultsFound",
                            "No Q&A or announcements match your filter."
                          )
                        : t(
                            "thesisManagement.qna.noItems",
                            "No Q&A sessions or announcements added yet."
                          )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {qnaTotalCount > 0 && (
              <Pagination
                page={page}
                setPage={setPage}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                totalRows={qnaTotalCount}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
            {isEnrolledTab && (
              <TrajectoryStudentsFilterDrawer
                filterOptions={enrolledData?.filter_options}
                draftFilters={draftFilters}
                setDraftFilters={setDraftFilters}
                appliedFilters={appliedFilters}
                setAppliedFilters={setAppliedFilters}
                setPage={setPage}
              />
            )}
            {!isQnaTab && (
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
            )}
          </div>
        </div>

        {isEligibleTab ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {t("thesisManagement.table.studentUid", "Student UID")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.studentName", "Student Name")}
                </TableHead>
                <TableHead>{t("common.email", "Email")}</TableHead>
                <TableHead>
                  {t("thesisManagement.table.group", "Group")}
                </TableHead>
                <TableHead>
                  {t("thesisManagement.table.purchase", "Purchase")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={
                isListFetching ? "opacity-50 pointer-events-none" : ""
              }
            >
              {isListLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={5} />
              ) : listError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center p-8">
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

                  return (
                    <TableRow key={row.application?._id || student?._id}>
                      <TableCell>{student?.uid || "-"}</TableCell>
                      <TableCell>{studentName}</TableCell>
                      <TableCell>{student?.email || "-"}</TableCell>
                      <TableCell>{row.batch?.name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${
                            row.purchased
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          }`}
                        >
                          {row.purchased
                            ? t(
                                "thesisManagement.trajectories.purchased",
                                "Purchased"
                              )
                            : t(
                                "thesisManagement.trajectories.notPurchased",
                                "Not purchased"
                              )}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-6 text-muted-foreground"
                  >
                    {search
                      ? t(
                          "common.noResultsFound",
                          "No students match your search query."
                        )
                      : t(
                          "thesisManagement.trajectories.noEligibleStudents",
                          "No eligible students found for this trajectory."
                        )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
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
                <TableHead>
                  {t("thesisManagement.table.attention", "Attention")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody
              className={
                isListFetching ? "opacity-50 pointer-events-none" : ""
              }
            >
              {isListLoading ? (
                <TableSkeleton rows={rowsPerPage} columns={8} />
              ) : listError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center p-8">
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
                  const attentionLabel =
                    row.attention === "suggest_fail"
                      ? t(
                          "thesisManagement.attempt.suggestFail",
                          "Overdue — review fail"
                        )
                      : row.attention === "suggest_pass"
                        ? t(
                            "thesisManagement.attempt.suggestPass",
                            "Ready for pass"
                          )
                        : "—";

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
                      <TableCell>{row.reader?.name || "-"}</TableCell>
                      <TableCell>
                        {row.attempt?.attempt_number ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={attemptStatus} />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${
                            row.attention === "suggest_fail"
                              ? "text-destructive"
                              : row.attention === "suggest_pass"
                                ? "text-emerald-600 dark:text-emerald-400"
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
                  <TableCell
                    colSpan={8}
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
        )}

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
            if (isEligibleTab) refetchEligible();
          }}
          thesisId={thesisId}
          initialData={trajectory}
        />
      )}

      {isQnaModalOpen && (
        <TrajectoryQnaModal
          open={isQnaModalOpen}
          onClose={() => {
            setIsQnaModalOpen(false);
            setSelectedQnaItem(null);
          }}
          thesisId={thesisId}
          trajectoryId={trajectoryId}
          mode={qnaModalMode}
          initialData={selectedQnaItem}
          onSuccess={() => {
            refetchQna();
          }}
        />
      )}

      <DeleteConfirm
        open={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setQnaItemToDelete(null);
        }}
        onConfirm={async () => {
          if (!qnaItemToDelete?._id) return;
          try {
            await deleteQnaMutation.mutateAsync({
              thesisId,
              trajectoryId,
              id: qnaItemToDelete._id,
            });
            setIsDeleteConfirmOpen(false);
            setQnaItemToDelete(null);
            refetchQna();
          } catch {
            // Error handled by store/hook toast
          }
        }}
        title={t(
          "thesisManagement.qna.deleteTitle",
          "Delete Q&A / Announcement"
        )}
        message={t(
          "thesisManagement.qna.deleteMessage",
          "Are you sure you want to delete this entry? This action cannot be undone."
        )}
        isLoading={deleteQnaMutation.isPending}
      />
    </div>
  );
}
