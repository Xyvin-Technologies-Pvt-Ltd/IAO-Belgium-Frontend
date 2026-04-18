import React, { useState } from "react";
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
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useGetBatchYearLog, useRecalculateYearCompletion } from "@/store/useBatchStore";
import { formatTZ, getMoment } from "@/utils/dateUtils";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const BatchYearLog = () => {
  const params = useParams({ strict: false });
  const batchId = params.id;
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error, refetch, isFetching } = useGetBatchYearLog(
    batchId,
    {
      page: page,
      limit: rowsPerPage,
    },
  );

  const recalculateMutation = useRecalculateYearCompletion();

  const logs = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRecalculate = (application_id) => {
    recalculateMutation.mutate(application_id);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("batchManagement.table.student")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.year")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.action")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.source")}</TableHead>
              <TableHead>{t("batchManagement.yearLog.details")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.date")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={7} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center p-8">
                  <ErrorMessage
                    message={
                      error?.message || t("batchManagement.messages.loadFailed")
                    }
                    onRetry={refetch}
                    variant="inline"
                  />
                </TableCell>
              </TableRow>
            ) : logs?.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log._id} className="hover:bg-muted/30">
                  <TableCell className={"capitalize"}>
                       {log.application?.user?.last_name} {log.application?.user?.first_name}
                   
                  </TableCell>
                  <TableCell className="text-center font-semibold ">
                    {log.year}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={log.action} />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="capitalize">{log.trigger_source}</span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={log.details}>
                    {log.details || t("common.dash")}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground whitespace-nowrap">
                    {getMoment(log.createdAt).format("MMM D, YYYY HH:mm")}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.application?.user?.current_year === log.year ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecalculate(log.application._id)}
                        disabled={recalculateMutation.isPending}
                        title={t("batchManagement.yearLog.recalculate")}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("common.dash")}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {t("batchManagement.yearLog.noLogs")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalRows > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalRows={totalRows}
        />
      )}
    </div>
  );
};

export default BatchYearLog;
