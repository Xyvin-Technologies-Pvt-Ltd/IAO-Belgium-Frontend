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
import { useGetBatchYearLog, useRecalculateYearCompletion, useMarkStudentAsFailed } from "@/store/useBatchStore";
import { formatInstant } from "@/utils/dateUtils";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const markFailedMutation = useMarkStudentAsFailed();

  const [failedLog, setFailedLog] = useState(null);
  const [reason, setReason] = useState("");

  const logs = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleRecalculate = (application_id) => {
    recalculateMutation.mutate(application_id);
  };

  const handleMarkFailed = async () => {
    if (!failedLog) return;
    try {
      await markFailedMutation.mutateAsync({
        applicationId: failedLog.application._id,
        reason: reason,
      });
      setFailedLog(null);
      setReason("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>{t("batchManagement.table.student")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.year")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.yearStatus", "Year Status")}</TableHead>
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
              <TableSkeleton rows={rowsPerPage} columns={8} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center p-8">
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
                    <StatusBadge status={log.application?.year_status || "active"} />
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
                    {formatInstant(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.application?.user?.current_year === log.year ? (
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecalculate(log.application._id)}
                          disabled={recalculateMutation.isPending}
                          title={t("batchManagement.yearLog.recalculate")}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {log.action === "validation_failed" && log.application?.year_status === "active" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setFailedLog(log);
                              setReason("");
                            }}
                            disabled={markFailedMutation.isPending}
                            title={t("batchManagement.yearLog.markFailed", "Mark as Failed")}
                          >
                            <span className="text-xs px-1 font-semibold">{t("batchManagement.yearLog.markFailed", "Mark Failed")}</span>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t("common.dash")}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
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

      <Dialog open={!!failedLog} onOpenChange={(open) => !open && setFailedLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-semibold text-destructive">
              {t("batchManagement.modal.markFailed.title", "Mark Student as Failed")}
            </DialogTitle>
            <DialogDescription>
              {t("batchManagement.yearLog.markFailedConfirm", "Are you sure? This will mark the student as failed for this academic year, allowing them to be re-enrolled into a different batch.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-muted p-3 rounded-md text-sm space-y-1">
              <div>
                <span className="font-medium text-muted-foreground">{t("batchManagement.modal.moveStudent.studentName", "Student")}: </span>
                <span className="font-semibold capitalize">
                  {failedLog?.application?.user?.last_name} {failedLog?.application?.user?.first_name}
                </span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">{t("batchManagement.yearLog.year", "Year")}: </span>
                <span className="font-semibold">{failedLog?.year}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("batchManagement.yearLog.markFailedReason", "Reason (optional)")}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("batchManagement.yearLog.markFailedReasonPlaceholder", "Enter reason for failing...")}
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFailedLog(null)} disabled={markFailedMutation.isPending}>
              {t("batchManagement.modal.reEnrollStudent.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkFailed}
              disabled={markFailedMutation.isPending}
            >
              {markFailedMutation.isPending ? t("common.processing", "Processing...") : t("batchManagement.yearLog.markFailed", "Mark as Failed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchYearLog;
