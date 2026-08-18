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
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/table/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { formatTZ } from "@/utils/dateUtils";
import PracticalFeedbackDialog from "@/components/teacher/exam/PracticalFeedbackDialog";

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

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold text-dashboard-text dark:text-white">
          {exam.name}
        </h2>
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          {t("exam.form.practical", "Practical")}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
        {exam.batch && (
          <span>
            <span className="font-medium text-dashboard-text dark:text-white">
              {t("exam.table.batch", { defaultValue: "Batch" })}:
            </span>{" "}
            {exam.batch.name}
          </span>
        )}
        {exam.exam_date && (
          <span>
            <span className="font-medium text-dashboard-text dark:text-white">
              {t("planningManagement.modal.practicalExamDate", "Date")}:
            </span>{" "}
            {formatTZ(exam.exam_date, "DD-MM-YYYY")}
          </span>
        )}
        {exam.teachers?.length > 0 && (
          <span>
            <span className="font-medium text-dashboard-text dark:text-white">
              {t("exam.form.teachers", "Teachers")}:
            </span>{" "}
            {exam.teachers
              .map((teacher) => `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim())
              .join(", ")}
          </span>
        )}
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody className={studentsFetching ? "opacity-50 pointer-events-none" : ""}>
            {studentsLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={3} />
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
                return (
                  <TableRow
                    key={item._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedStudent(item.student)}
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
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
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
