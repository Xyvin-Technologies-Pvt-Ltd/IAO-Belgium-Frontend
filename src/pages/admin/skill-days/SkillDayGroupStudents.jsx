import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
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
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import { useGetAttachmentStudents, useGetSkillDayById } from "@/store/useSkillDayStore";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import StatusBadge from "@/components/StatusBadge";
import { useTranslation } from "react-i18next";

const SkillDayGroupStudents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const { id, attachmentId } = params;
  const { updateBreadcrumbs } = useBreadcrumb();

  const [searchTerm, setSearchTerm] = useState("");

  const { data: skillDayRes } = useGetSkillDayById(id);
  const skillDay = skillDayRes?.data || null;

  const { data, isLoading, error, refetch } = useGetAttachmentStudents(
    id,
    attachmentId,
    { enabled: !!id && !!attachmentId }
  );

  const resultData = data?.data || {};
  const attachment = resultData.attachment || {};
  const batchInfo = attachment.batch || {};
  const yearInfo = attachment.year || 1;
  const students = resultData.students || [];

  useEffect(() => {
    updateBreadcrumbs([
      {
        label: t("sidebar.admin.planning", "Planning"),
        path: "/admin/planning",
        navigable: true,
      },
      {
        label: t("sidebar.admin.skillDays", "Skill Days"),
        path: "/admin/skill-days",
        navigable: true,
      },
      {
        label: skillDay?.name || "Skill Day",
        path: `/admin/skill-days/${id}`,
        navigable: true,
      },
      {
        label: `${batchInfo.name || "Group"} Students`,
        path: `/admin/skill-days/${id}/attachment/${attachmentId}`,
        navigable: false,
      },
    ]);

    return () => {
      updateBreadcrumbs([]);
    };
  }, [skillDay?.name, batchInfo.name, id, attachmentId, updateBreadcrumbs, t]);

  const filteredStudents = students.filter(
    (s) =>
      s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const paidCount = students.filter((s) => s.payment_status === "paid").length;
  const unpaidCount = students.filter((s) => s.payment_status !== "paid" && s.payment_status !== "free").length;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {batchInfo.name || "Group"} — <span className="text-[#ff8904]">Program Year {yearInfo}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Skill Day: {skillDay?.name || "Skill Day"}
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="TOTAL STUDENTS"
          value={students.length}
          subtitle="Enrolled in Group"
          icon={Users}
        />
        <DashboardCard
          title="COST TYPE"
          value={attachment.cost_type === "paid" ? `Paid (${attachment.currency || "EUR"} ${attachment.amount || 0})` : "Free"}
          subtitle="Requirement: "
          subtitleValue={attachment.requirement === "required" ? "Required" : "Optional"}
          icon={CreditCard}
        />
        <DashboardCard
          title="PAID / COMPLETED"
          value={paidCount}
          subtitle="Students Paid"
          icon={CheckCircle2}
        />
        <DashboardCard
          title="UNPAID / PENDING"
          value={unpaidCount}
          subtitle="Students Pending Payment"
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
            <TableHead>PAYMENT METHOD</TableHead>
            <TableHead>PAID AMOUNT</TableHead>
            <TableHead className="text-right">INVOICE</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStudents.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="px-6 py-8 text-center text-sm text-muted-foreground"
              >
                No students found for this group attachment.
              </TableCell>
            </TableRow>
          ) : (
            filteredStudents.map((s) => (
              <TableRow key={s.user_id}>
                <TableCell className="font-semibold text-foreground">
                  {s.student_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.email}
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.requirement === "required" ? "required" : "optional"} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.payment_status} />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {s.payment_method || "N/A"}
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SkillDayGroupStudents;
