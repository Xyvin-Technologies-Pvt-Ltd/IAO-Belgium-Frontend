import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Badge } from "@/components/ui/badge";
import {
  useGetPracticalExamDetail,
  useGetPracticalExamStudents,
} from "@/store/useExamStore";
import { LoadingState, ErrorMessage } from "@/components/common";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import StatusBadge from "@/components/StatusBadge";
import DashboardCard from "@/components/admin/dashboard/DashboardCard";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { formatTZ } from "@/utils/dateUtils";
import PracticalFeedbackDialog from "@/components/teacher/exam/PracticalFeedbackDialog";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUpdatePracticalExamTeacherStatus } from "@/store/usePlanningStore";
import { useUpdateResitTeacherStatus } from "@/store/useResitStore";
import {
  GraduationCap,
  Timer,
  MapPin,
  Calendar,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

const PracticalExamDetail = () => {
  const { t } = useTranslation();
  const params = useParams({ strict: false });
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const updateStatusMutation = useUpdatePracticalExamTeacherStatus();
  const updateResitStatusMutation = useUpdateResitTeacherStatus();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const {
    data: examData,
    isLoading,
    error,
    refetch,
  } = useGetPracticalExamDetail(id);

  const {
    data: studentsData,
    isLoading: studentsLoading,
    isFetching: studentsFetching,
  } = useGetPracticalExamStudents(id, {
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  });

  useEffect(() => {
    if (examData?.data) {
      updateBreadcrumbs([
        {
          label: t("sidebar.teacher.practicalExams", { defaultValue: "Practical Exams" }),
          path: "/teacher/practical-exams",
          navigable: true,
        },
        {
          label: examData.data.name,
          path: `/teacher/practical-exams/${id}`,
          navigable: false,
        },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [examData?.data?.name, t, id]);

  if (isLoading) {
    return <LoadingState text={t("exam.loading")} fullHeight />;
  }

  if (error || !examData?.data) {
    return (
      <div className="p-6">
        <ErrorMessage
          message={error?.message || t("exam.messages.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  const exam = examData.data;
  const isAccepted = exam.teacher_status === "accepted" || exam.is_accepted;

  const handleStatusUpdate = async (status) => {
    try {
      if (exam.is_resit) {
        await updateResitStatusMutation.mutateAsync({
          id: exam._id,
          data: { status },
        });
      } else {
        await updateStatusMutation.mutateAsync({
          id: exam._id,
          data: { status },
        });
      }
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      {/* Teacher Assignment Acceptance Banner */}
      {!isAccepted && (
        <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 rounded-xl flex flex-wrap items-center justify-between gap-4 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-semibold">Teacher Assignment</p>
              <p className="text-xs opacity-90">
                Please accept or reject your assignment for this exam.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-[#49BA6C] hover:bg-[#3ea15d] text-white border-none"
              onClick={() => handleStatusUpdate("accepted")}
              disabled={updateStatusMutation.isPending || updateResitStatusMutation.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              {t("planningManagement.teacher.accept", "Accept Assignment")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[#E7000B] border-red-200 hover:bg-red-50"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={updateStatusMutation.isPending || updateResitStatusMutation.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              {t("planningManagement.teacher.reject", "Reject")}
            </Button>
          </div>
        </div>
      )}

      {/* Header UI matching ExamDetail.jsx */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white">
                {exam.name}
              </h2>
              {exam.is_resit && (
                <Badge variant="outline">{t("exam.resit", "Resit")}</Badge>
              )}
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {t("exam.form.practical", "Practical")}
              </Badge>
              {exam.status && (
                <StatusBadge status={exam.status} />
              )}
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {exam.uid && (
                <div>
                  <span className="inline-block px-3 py-1 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                    {exam.uid}
                  </span>
                </div>
              )}
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                {exam.batch?.name && (
                  <span>
                    <span className="font-semibold">
                      {t("exam.table.batch", { defaultValue: "Batch" })}:
                    </span>{" "}
                    {exam.batch.name}
                  </span>
                )}
                {exam.location && (
                  <span>
                    <span className="font-semibold">
                      {t("exam.table.location", { defaultValue: "Location" })}:
                    </span>{" "}
                    {exam.location}
                  </span>
                )}
                {exam.exam_date && (
                  <span>
                    <span className="font-semibold">
                      {t("planningManagement.modal.practicalExamDate", "Exam Date")}:
                    </span>{" "}
                    {formatTZ(exam.exam_date, "DD-MM-YYYY")}
                  </span>
                )}
                {exam.teachers?.length > 0 && (
                  <span>
                    <span className="font-semibold">
                      {t("exam.form.teachers", "Teachers")}:
                    </span>{" "}
                    {exam.teachers
                      .map((t) => `${t.first_name || ""} ${t.last_name || ""}`.trim())
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards Grid matching ExamDetail.jsx */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title={t("exam.table.location", { defaultValue: "Location" })}
          value={exam.location || "TBA"}
          icon={MapPin}
        />
        <DashboardCard
          title={t("exam.detail.duration", { defaultValue: "Duration" })}
          value={exam.duration ? `${exam.duration} mins` : "TBA"}
          icon={Timer}
        />
        <DashboardCard
          title={
            exam.passing_type === "percentage"
              ? t("exam.detail.passingPercentage", { defaultValue: "Passing Percentage" })
              : t("exam.detail.passingMarks", { defaultValue: "Pass Mark" })
          }
          value={
            exam.passing_type === "percentage" && exam.passing_percentage != null
              ? `${exam.passing_percentage}%`
              : exam.passing_marks != null
              ? `${exam.passing_marks}`
              : "Pass / Fail"
          }
          icon={GraduationCap}
        />
        <DashboardCard
          title={t("planningManagement.modal.practicalExamDate", { defaultValue: "Exam Date" })}
          value={exam.exam_date ? formatTZ(exam.exam_date, "DD-MM-YYYY") : "TBA"}
          icon={Calendar}
        />
      </div>

      {/* Description section matching ExamDetail.jsx UI */}
      {exam.description && exam.description !== "<p></p>" && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">Description:</p>
          <div
            className="text-sm text-card-foreground/80 whitespace-pre-wrap [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: exam.description }}
          />
        </div>
      )}

      {/* Instructions section matching ExamDetail.jsx UI */}
      {exam.instructions && exam.instructions !== "<p></p>" && exam.instructions !== exam.description && (
        <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-bold mb-2">Instructions:</p>
          <div
            className="text-sm text-card-foreground/80 whitespace-pre-wrap [&_a]:text-primary [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: exam.instructions }}
          />
        </div>
      )}

      {/* Feedback Instructions section - Only rendered when teacher has accepted */}
      {isAccepted && exam.feedback_instructions &&
        exam.feedback_instructions !== "<p></p>" && (
          <div className="p-5 border rounded-lg bg-card text-card-foreground shadow-sm">
            <p className="text-sm font-bold mb-2">Feedback Instructions:</p>
            <div
              className="text-sm text-card-foreground/80 [&_a]:text-[#ff8904] [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: exam.feedback_instructions }}
              onClick={(e) => {
                const anchor = e.target.closest("a");
                if (anchor?.href) {
                  e.preventDefault();
                  window.open(anchor.href, "_blank", "noopener,noreferrer");
                }
              }}
            />
          </div>
        )}

      {/* Student Results Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-dashboard-text dark:text-white">
            {t("exam.detail.studentResults", { defaultValue: "Students" })}
          </h3>
          <Input
            placeholder={t("exam.searchStudents", { defaultValue: "Search students..." })}
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">{t("exam.detail.student", "Student")}</TableHead>
              <TableHead className="text-center">
                {t("exam.feedback.myStatus", "My feedback")}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.feedback.others", "Other teachers")}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.results.finalGrade", "Final grade")}
              </TableHead>
              <TableHead className="text-center">
                {t("exam.detail.result", { defaultValue: "Result" })}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={studentsFetching ? "opacity-50 pointer-events-none" : ""}>
            {studentsLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={5} />
            ) : studentsData?.data?.length > 0 ? (
              studentsData.data.map((item) => {
                const myTeacherId = item.my_feedback?.teacher
                  ? String(item.my_feedback.teacher)
                  : null;
                const submittedOthers = (item.feedbacks || []).filter(
                  (f) =>
                    f.status === "submitted" &&
                    String(f.teacher) !== myTeacherId,
                ).length;
                const hasResult =
                  item.result ||
                  (item.score !== null && item.score !== undefined);
                return (
                  <TableRow
                    key={item._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      if (!isAccepted) {
                        toast.error(t("exam.messages.acceptAssignmentFirst", "Please accept your teacher assignment first before providing feedback."));
                        return;
                      }
                      setSelectedStudent(item.student);
                    }}
                  >
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">
                          {item.student?.last_name} {item.student?.first_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.student?.uid}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.my_feedback?.status ? (
                        <StatusBadge status={item.my_feedback.status} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("exam.feedback.notStarted", "Not started")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {submittedOthers} {t("exam.feedback.submittedCount", "submitted")}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {item.score !== null && item.score !== undefined ? (
                        item.score
                      ) : (
                        <span className="text-xs text-muted-foreground font-normal">
                          {t("exam.results.pendingAdmin", "Pending")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasResult && item.result ? (
                        <StatusBadge status={item.result} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("exam.results.pendingAdmin", "Pending")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {t("common.noResultsFound", { defaultValue: "No students found." })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {studentsData?.total_count > 0 && (
          <Pagination
            page={page}
            setPage={setPage}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            totalRows={studentsData?.total_count || 0}
          />
        )}
      </div>

      <PracticalFeedbackDialog
        open={!!selectedStudent}
        plannedId={id}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
};

export default PracticalExamDetail;
