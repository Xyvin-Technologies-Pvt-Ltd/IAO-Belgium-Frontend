import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import ExamStatusBadge from "@/components/admin/exam/ExamStatusBadge";
import { useGetTeacherExams } from "@/store/useExamStore";
import { useUpdateOnlineExamTeacherStatus } from "@/store/usePlanningStore";
import { useNavigate } from "@tanstack/react-router";
import StatusBadge from "@/components/StatusBadge";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExamList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetTeacherExams({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const updateStatusMutation = useUpdateOnlineExamTeacherStatus();

  const handleStatusUpdate = async (e, plannedExamId, status) => {
    e.stopPropagation();
    try {
      await updateStatusMutation.mutateAsync({
        id: plannedExamId,
        data: { status },
      });
      refetch();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const exams = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRowClick = (exam) => {
    navigate({
      to: "/teacher/exams/$exam_id/$planning_id",
      params: { exam_id: exam.exam_id, planning_id: exam.planning_id },
    });
  };

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("exam.myExams", { defaultValue: "My Exams" })}
      </h2>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Input
          placeholder={t("exam.search")}
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("exam.table.name")}</TableHead>
            <TableHead>{t("exam.table.module")}</TableHead>
            <TableHead>{t("exam.table.batch", { defaultValue: "Batch" })}</TableHead>
            <TableHead>{t("exam.table.questions")}</TableHead>
            <TableHead>{t("exam.table.duration")}</TableHead>
            <TableHead>{t("exam.table.passingMarks")}</TableHead>
            <TableHead>{t("exam.table.status")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.teacher.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={9} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("exam.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : exams?.length > 0 ? (
            exams?.map((exam) => (
              <TableRow
                key={`${exam._id?.exam_component_id}-${exam._id?.planning_id}`}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(exam)}
              >
                <TableCell>{exam?.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{exam?.module_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {exam?.module_uid}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{exam?.batch_name ?? "—"}</TableCell>
                <TableCell>{exam?.total_questions ?? 0}</TableCell>
                <TableCell>{exam?.duration ?? 0} min</TableCell>
                <TableCell>
                  {exam?.passing_type === "percentage"
                    ? `${exam?.passing_percentage ?? exam?.passing_marks ?? 0}%`
                    : exam?.passing_marks ?? exam?.passing_percentage ?? 0}
                </TableCell>
                <TableCell>
                  <StatusBadge status={exam?.exam_session_status ?? "not_started"} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={exam?.teacher_status || "pending"} />
                </TableCell>
                <TableCell>
                  {(exam?.teacher_status === "pending" || !exam?.teacher_status) && exam?.planned_exam_id && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#49BA6C] bg-[#49BA6C]/10 hover:bg-[#49BA6C]/20 border-none"
                        onClick={(e) => handleStatusUpdate(e, exam.planned_exam_id, "accepted")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("planningManagement.teacher.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#E7000B] border-none bg-[#E7000B]/10 dark:bg-[#E7000B] hover:bg-[#E7000B]/20"
                        onClick={(e) => handleStatusUpdate(e, exam.planned_exam_id, "rejected")}
                        disabled={updateStatusMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t("planningManagement.teacher.reject")}
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                {t("exam.table.noExams")}
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
    </div>
  );
};

export default ExamList;
