import { useGetBatchExamResults } from "@/store/useBatchStore";
import { useParams } from "@tanstack/react-router";
import { LoadingState, ErrorMessage } from "@/components/common";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import StatusBadge from "@/components/StatusBadge";
import { getMoment } from "@/utils/dateUtils";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Pagination } from "@/components/ui/table/Pagination";

const BatchResult = () => {
  const { t } = useTranslation();
  const { id: batchId } = useParams({ strict: false });

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: results,
    isLoading,
    isError,
    error,
  } = useGetBatchExamResults(batchId, { page, limit: rowsPerPage });

  if (isLoading) return <LoadingState />;
  if (isError)
    return (
      <ErrorMessage message={error?.message || "Failed to load results"} />
    );

  if (!results?.data || results.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        {t("batchManagement.table.noResults")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="px-6">
              {t("batchManagement.table.student")}
            </TableHead>
            <TableHead>{t("batchManagement.table.exam")}</TableHead>
            <TableHead className="text-center">
              {t("batchManagement.table.score")}
            </TableHead>
            <TableHead className="text-center">
              {t("batchManagement.table.percentage")}
            </TableHead>
            <TableHead className="text-center">
              {t("batchManagement.table.result")}
            </TableHead>
            <TableHead className="text-center px-6">
              {t("batchManagement.table.submittedAt")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.data?.length > 0 ? (
            results.data.map((result) => (
              <TableRow
                key={result._id}
                className="transition-colors hover:bg-muted/50"
              >
                <TableCell className="px-6 py-4">
                  {result.student?.first_name} {result.student?.last_name}
                </TableCell>
                <TableCell>{result.exam?.name || "Unnamed Exam"}</TableCell>
                <TableCell className="text-center font-medium">
                  {result.score}
                </TableCell>
                <TableCell className="text-center">
                  {result.percentage?.toFixed(2)}%
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={result.result} />
                </TableCell>
                <TableCell className="text-center text-muted-foreground px-6 py-4">
                  {getMoment(result.submitted_at).format("MMM D, HH:mm")}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                {t("batchManagement.table.noResults")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {results.total_count > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={results.total_count}
        />
      )}
    </div>
  );
};

export default BatchResult;
