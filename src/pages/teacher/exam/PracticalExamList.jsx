import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { useGetTeacherPracticalExams } from "@/store/useExamStore";
import { useUpdatePracticalExamTeacherStatus } from "@/store/usePlanningStore";
import { useUpdateResitTeacherStatus } from "@/store/useResitStore";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatTZ } from "@/utils/dateUtils";
import { Check, X } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

const PracticalExamList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading, error, refetch, isFetching } = useGetTeacherPracticalExams({
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const updateStatusMutation = useUpdatePracticalExamTeacherStatus();
  const updateResitStatusMutation = useUpdateResitTeacherStatus();

  const handleStatusUpdate = async (e, exam, status) => {
    e.stopPropagation();
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

  const exams = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
        {t("sidebar.teacher.practicalExams", { defaultValue: "Practical Exams" })}
      </h2>
      <Input
        placeholder={t("exam.search")}
        className="max-w-xs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("exam.table.name")}</TableHead>
            <TableHead>{t("exam.table.type", { defaultValue: "Type" })}</TableHead>
            <TableHead>{t("exam.table.batch", { defaultValue: "Batch" })}</TableHead>
            <TableHead>{t("planningManagement.modal.practicalExamDate", "Date")}</TableHead>
            <TableHead>{t("planningManagement.table.status")}</TableHead>
            <TableHead>{t("planningManagement.teacher.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={6} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center p-8">
                <ErrorMessage
                  message={error?.message || t("exam.messages.loadFailed")}
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : exams.length > 0 ? (
            exams.map((exam) => (
              <TableRow
                key={exam._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  navigate({
                    to: "/teacher/practical-exams/$id",
                    params: { id: exam._id },
                  })
                }
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{exam?.name}</span>
                    {exam?.is_resit && (
                      <Badge variant="outline">{t("exam.resit", "Resit")}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    {t("exam.form.practical", "Practical")}
                  </Badge>
                </TableCell>
                <TableCell>{exam?.batch?.name || "—"}</TableCell>
                <TableCell>
                  {exam.exam_date ? formatTZ(exam.exam_date, "DD-MM-YYYY") : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={exam.status || "pending"} />
                </TableCell>
                <TableCell>
                  {(exam.status === "pending" || !exam.status) && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#49BA6C] bg-[#49BA6C]/10 hover:bg-[#49BA6C]/20 border-none"
                        onClick={(e) => handleStatusUpdate(e, exam, "accepted")}
                        disabled={updateStatusMutation.isPending || updateResitStatusMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t("planningManagement.teacher.accept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[#E7000B] border-none bg-[#E7000B]/10 dark:bg-[#E7000B] hover:bg-[#E7000B]/20"
                        onClick={(e) => handleStatusUpdate(e, exam, "rejected")}
                        disabled={updateStatusMutation.isPending || updateResitStatusMutation.isPending}
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
              <TableCell colSpan={6} className="text-center">
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

export default PracticalExamList;
