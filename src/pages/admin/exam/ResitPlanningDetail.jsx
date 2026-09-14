import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, User, Sparkles, Search, FileText, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { useGetResitPlanningAssignments } from "@/store/useResitStore";
import { formatTZ } from "@/utils/dateUtils";

const ResitPlanningDetailPage = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params?.id;
  const navigate = useNavigate();
  const { updateBreadcrumbs } = useBreadcrumb();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const { data, isLoading, error, refetch, isFetching } = useGetResitPlanningAssignments(
    id,
    {
      page,
      limit: rowsPerPage,
      search: debouncedSearch,
    }
  );

  const planning = data?.planning || {};
  const assignments = data?.data || [];
  const totalCount = data?.total_count || 0;

  useEffect(() => {
    if (planning?.exam) {
      updateBreadcrumbs([
        {
          label: t("resitPlanning.title", "Resit planning"),
          path: "/admin/examination/resit-planning",
          navigable: true,
        },
        {
          label: planning.exam.name || "Resit Planning",
          path: `/admin/examination/resit-planning/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [planning?.exam?.name, id, t]);

  if (isLoading) {
    return <LoadingState text={t("common.loading", "Loading resit planning details...")} fullHeight />;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("resitPlanning.loadFailed", "Failed to load resit planning details")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const teacherName = (person) =>
    `${person?.last_name || ""} ${person?.first_name || ""}`.trim() || person?.name || "Unknown";

  const renderTeacherText = () => {
    if (planning.teacher) {
      return teacherName(planning.teacher);
    }
    if (planning.teachers?.length > 0) {
      return planning.teachers.map((entry) => teacherName(entry.teacher || {})).join(", ");
    }
    return "—";
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Header Section matching ExamDetail */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white">
                {planning.exam?.name || "Resit Planning Details"}
              </h2>
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex gap-2 flex-wrap items-center">
              {planning.exam?.parent_exam?.name && (
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                  {t("exam.resitOf", "Resit of")} {planning.exam.parent_exam.name}
                </span>
              )}
              {planning.exam?.uid && (
                <span className="inline-block px-3 py-1 bg-muted rounded-full font-medium">
                  {planning.exam.uid}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid matching ExamDetail */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title={t("resitPlanning.table.date", "Date")}
          value={planning.exam_date ? formatTZ(planning.exam_date, "DD-MM-YYYY") : "—"}
          icon={Calendar}
        />
        <DashboardCard
          title={t("resitPlanning.table.location", "Location")}
          value={planning.location || "—"}
          subtitle={planning.location_address || undefined}
          icon={MapPin}
        />
        <DashboardCard
          title={t("resitPlanning.table.teacher", "Teacher")}
          value={renderTeacherText()}
          icon={User}
        />
        <DashboardCard
          title={t("resitPlanning.table.fee", "Resit Fee")}
          value={
            planning.is_free || !planning.amount ? (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold px-2.5 py-0.5">
                {t("resitPlanning.free", "Free Resit")}
              </Badge>
            ) : (
              <span className="text-emerald-600 font-bold">€{Number(planning.amount).toFixed(2)}</span>
            )
          }
          icon={Sparkles}
        />
      </div>

      {/* Assigned Students Section matching ExamDetail Card Container */}
      <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
              {t("resitPlanning.assignedStudentsTitle", "Assigned Students")} ({totalCount})
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("resitPlanning.assignedStudentsSub", "List of students assigned to this resit planning and their payment status.")}
            </p>
          </div>

          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("resitPlanning.searchStudents", "Search students...")}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden bg-white dark:bg-card text-card-foreground shadow-sm">
          <Table>
            <TableHeader className="bg-[#f4f4f5] dark:bg-muted text-muted-foreground text-xs font-semibold">
              <TableRow>
                <TableHead>{t("resitPlanning.studentName", "Student Name")}</TableHead>
                <TableHead>{t("resitPlanning.studentEmail", "Email")}</TableHead>
                <TableHead>{t("resitPlanning.appUid", "Application UID")}</TableHead>
                <TableHead>{t("resitPlanning.paymentStatus", "Payment Status")}</TableHead>
                <TableHead>{t("resitPlanning.documents", "Documents")}</TableHead>
                <TableHead>{t("resitPlanning.assignedAt", "Assigned Date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
              {assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const isFree = planning.is_free || assignment.payment_status === "free";
                  const isPaid = assignment.payment_status === "paid";
                  return (
                    <TableRow key={assignment._id}>
                      <TableCell className="font-medium">
                        {assignment.student
                          ? `${assignment.student.first_name || ""} ${assignment.student.last_name || ""}`.trim()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assignment.student?.email || "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {assignment.application_uid || "N/A"}
                      </TableCell>
                      <TableCell>
                        {isFree ? (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                            Free
                          </Badge>
                        ) : isPaid ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1 w-fit">
                            <CheckCircle2 size={12} />
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 flex items-center gap-1 w-fit">
                            <Clock size={12} />
                            Pending (€{Number(planning.amount || 0).toFixed(2)})
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isPaid ? (
                          <div className="flex items-center gap-2 text-xs">
                            {assignment.invoice && (
                              <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                <FileText size={13} />
                                Invoice
                              </span>
                            )}
                            {assignment.receipt && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <FileText size={13} />
                                Receipt
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {assignment.assigned_at ? formatTZ(assignment.assigned_at, "DD-MM-YYYY HH:mm") : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                    {t("resitPlanning.noAssignments", "No students assigned to this resit planning yet.")}
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
            totalRows={totalCount}
          />
        </div>
      </div>
    </div>
  );
};

export default ResitPlanningDetailPage;
