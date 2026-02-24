import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useTranslation } from "react-i18next";
import ResultDetailDialog from "./ResultDetailDialog";
import { useGetAssignmentResults } from "@/store/useExamAssignmentStore";
import { Download } from "lucide-react";
import axiosInstance from "@/api/axiosintercepter";

const ResultsTable = ({ assignmentId }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, error, refetch, isFetching } =
    useGetAssignmentResults(
      assignmentId,
      { page, limit: rowsPerPage },
    );

  const attempts = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleExport = async () => {
    try {
      const response = await axiosInstance.get(
        `/exam-assignment/${assignmentId}/results/export`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `exam-results-${assignmentId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewDetail = (attempt) => {
    setSelectedAttempt(attempt);
    setDetailOpen(true);
  };

  const getStudentName = (student) => {
    if (!student) return "-";
    return [student.first_name, student.last_name].filter(Boolean).join(" ") || "-";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          {t("examAssignment.results.exportCsv")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("examAssignment.results.student")}</TableHead>
            <TableHead>{t("examAssignment.results.email")}</TableHead>
            <TableHead>{t("examAssignment.results.score")}</TableHead>
            <TableHead>{t("examAssignment.results.total")}</TableHead>
            <TableHead>{t("examAssignment.results.percentage")}</TableHead>
            <TableHead>{t("examAssignment.results.passed")}</TableHead>
            <TableHead>{t("examAssignment.results.status")}</TableHead>
            <TableHead>{t("examAssignment.results.action")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={8} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center p-8">
                <ErrorMessage
                  message={
                    error?.message || t("examAssignment.results.loadFailed")
                  }
                  onRetry={refetch}
                  variant="inline"
                />
              </TableCell>
            </TableRow>
          ) : attempts?.length > 0 ? (
            attempts?.map((a) => (
              <TableRow key={a._id}>
                <TableCell>{getStudentName(a.student)}</TableCell>
                <TableCell>{a.student?.email || "-"}</TableCell>
                <TableCell>{a.total_marks_obtained ?? "-"}</TableCell>
                <TableCell>{a.total_marks ?? "-"}</TableCell>
                <TableCell>
                  {a.percentage != null ? `${a.percentage}%` : "-"}
                </TableCell>
                <TableCell>
                  {a.is_passed != null
                    ? a.is_passed
                      ? t("common.yes")
                      : t("common.no")
                    : "-"}
                </TableCell>
                <TableCell>{a.status || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleViewDetail(a)}
                  >
                    {t("examAssignment.results.viewDetail")}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                {t("examAssignment.results.noAttempts")}
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

      <ResultDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        assignmentId={assignmentId}
        attemptId={selectedAttempt?._id}
      />
    </div>
  );
};

export default ResultsTable;
