import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import {
  Search,
  Users,
  Clock,
  FileText,
  UserCheck,
  UserX,
  Check,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Pagination } from "@/components/ui/table/Pagination";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import {
  useGetAttachmentStudents,
  useGetSkillDayById,
  useMarkSkillDayAttendance,
} from "@/store/useSkillDayStore";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";
import { useDebounce } from "@/hooks/useDebounce";
import moment from "moment";

const SkillDayGroupStudents = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const { id, attachmentId } = params;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: skillDayRes } = useGetSkillDayById(id);
  const skillDay = skillDayRes?.data || null;

  const studentsFilter = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data, isLoading, error, refetch } = useGetAttachmentStudents(
    id,
    attachmentId,
    studentsFilter,
    { enabled: !!id && !!attachmentId }
  );

  const markAttendanceMutation = useMarkSkillDayAttendance();

  const resultData = data?.data || {};
  const attachment = resultData.attachment || {};
  const batchInfo = attachment.batch || {};
  const yearInfo = attachment.year || 1;
  const students = resultData.students || [];
  const summary = resultData.summary || {};
  const totalRows = data?.total_count ?? summary.total ?? 0;

  useEffect(() => {
    updateBreadcrumbs([
      {
        label: t("sidebar.admin.planning", "Planning"),
        path: "/admin/planning",
        navigable: true,
      },
      {
        label: t("sidebar.admin.skillDays", "Standalone Modules"),
        path: "/admin/standalone-modules",
        navigable: true,
      },
      {
        label: skillDay?.name || "Standalone Module",
        path: `/admin/standalone-modules/${id}`,
        navigable: true,
      },
      {
        label: `${batchInfo.name || "Group"} Students`,
        path: `/admin/standalone-modules/${id}/attachment/${attachmentId}`,
        navigable: false,
      },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, [skillDay?.name, batchInfo.name, id, attachmentId, updateBreadcrumbs, t]);

  const handleMarkAttendance = async (applicationId, status) => {
    try {
      await markAttendanceMutation.mutateAsync({
        skillDayId: id,
        application_id: applicationId,
        status,
      });
    } catch (err) {
      // Error handled by store toast
    }
  };

  if (isLoading) {
    return <LoadingState text="Loading Group Students..." fullHeight />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || "Failed to load Group Students"}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const presentCount =
    summary.present ??
    students.filter((s) => s.attendance_status === "present").length;
  const absentCount =
    summary.absent ??
    students.filter((s) => s.attendance_status === "absent").length;
  const notMarkedCount =
    summary.not_marked ??
    students.filter((s) => !s.attendance_status).length;
  const totalStudents = summary.total ?? totalRows;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {batchInfo.name || "Group"} — <span className="text-[#ff8904]">Program Year {yearInfo}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Standalone Module: {skillDay?.name || "Standalone Module"}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="TOTAL STUDENTS"
          value={totalStudents}
          subtitle="Enrolled in Group"
          icon={Users}
        />
        <DashboardCard
          title="PRESENT"
          value={presentCount}
          subtitle="Attended Module"
          icon={UserCheck}
        />
        <DashboardCard
          title="ABSENT"
          value={absentCount}
          subtitle="Missed Module"
          icon={UserX}
        />
        <DashboardCard
          title="NOT MARKED"
          value={notMarkedCount}
          subtitle="Pending Attendance"
          icon={Clock}
        />
      </div>

      {/* Top Action / Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Students
        </h3>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by student, email, invoice..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full bg-white dark:bg-black border dark:border-white/20"
          />
        </div>
      </div>

      {/* Standard Program-style Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>STUDENT NAME</TableHead>
            <TableHead>EMAIL</TableHead>
            <TableHead>REQUIREMENT</TableHead>
            <TableHead>PAYMENT STATUS</TableHead>
            <TableHead>ATTENDANCE</TableHead>
            <TableHead>PAID AMOUNT</TableHead>
            <TableHead className="text-right">INVOICE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="px-6 py-8 text-center text-sm text-muted-foreground"
              >
                No students found for this group attachment.
              </TableCell>
            </TableRow>
          ) : (
            students.map((s) => {
              const canMark = s.can_mark_attendance || s.is_enrolled;
              const isPresent = s.attendance_status === "present";
              const isAbsent = s.attendance_status === "absent";
              const isPending =
                markAttendanceMutation.isPending &&
                markAttendanceMutation.variables?.application_id ===
                  s.application_id;

              return (
                <TableRow key={s.user_id}>
                  <TableCell className="font-semibold text-foreground">
                    {s.student_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.email}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={
                        s.requirement === "required" ? "required" : "optional"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={s.payment_status} />
                  </TableCell>
                  <TableCell>
                    {canMark ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleMarkAttendance(s.application_id, "present")
                            }
                            className={`cursor-pointer h-8 px-3 text-xs font-semibold rounded-md transition-all gap-1.5 ${
                              isPresent
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            type="button"
                            disabled={isPending}
                            onClick={() =>
                              handleMarkAttendance(s.application_id, "absent")
                            }
                            className={`cursor-pointer h-8 px-3 text-xs font-semibold rounded-md transition-all gap-1.5 ${
                              isAbsent
                                ? "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                                : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                            }`}
                          >
                            <X className="h-3.5 w-3.5" />
                            Absent
                          </Button>
                        </div>
                        {s.attendance_status && (
                          <span className="text-[11px] text-muted-foreground block mt-1 font-normal">
                            Marked by{" "}
                            {typeof s.attendance_marked_by === "object" &&
                            s.attendance_marked_by
                              ? `${s.attendance_marked_by.first_name || ""} ${s.attendance_marked_by.last_name || ""}`.trim() ||
                                s.attendance_marked_by.email
                              : s.attendance_marked_by || "Admin"}
                            {s.attendance_marked_at
                              ? ` on ${moment(s.attendance_marked_at).format("DD MMM YYYY")}`
                              : ""}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        <Lock className="h-3.5 w-3.5 text-amber-500" />
                        Unpaid (Locked)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {s.cost_type === "free"
                      ? "Free"
                      : `${s.currency || "EUR"} ${s.paid_amount || s.amount || 0}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.invoice_number ? (
                      <a
                        href={s.invoice_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0162DD] hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {s.invoice_number}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
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
    </div>
  );
};

export default SkillDayGroupStudents;
