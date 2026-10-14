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
import { useGetBatchYearLog, useMarkStudentAsFailed } from "@/store/useBatchStore";
import { formatInstant } from "@/utils/dateUtils";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Calculator, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import YearCompletionDialog from "@/components/admin/batch/YearCompletionDialog";

const BatchYearLog = () => {
  const params = useParams({ strict: false });
  const batchId = params.id;
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedId, setExpandedId] = useState(null);
  const [yearDialogApp, setYearDialogApp] = useState(null);

  const { data, isLoading, error, refetch, isFetching } = useGetBatchYearLog(
    batchId,
    {
      page: page,
      limit: rowsPerPage,
    },
  );

  const markFailedMutation = useMarkStudentAsFailed();

  const [failedLog, setFailedLog] = useState(null);
  const [reason, setReason] = useState("");

  const logs = data?.data || [];
  const totalRows = data?.total_count || 0;

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

  const doneByName = (log) => {
    const u = log.triggered_by;
    if (!u) return t("common.dash", "—");
    return [u.last_name, u.first_name].filter(Boolean).join(" ") || u.email || "—";
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
              <TableHead>{t("yearCompletion.doneBy", "Done by")}</TableHead>
              <TableHead>{t("batchManagement.yearLog.details")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.date")}</TableHead>
              <TableHead className="text-center">{t("batchManagement.yearLog.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className={isFetching ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={9} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center p-8">
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
                <React.Fragment key={log._id}>
                  <TableRow className="hover:bg-muted/30">
                    <TableCell className={"capitalize"}>
                      {log.application?.user?.last_name}{" "}
                      {log.application?.user?.first_name}
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
                    <TableCell className="capitalize text-sm">
                      {doneByName(log)}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-1">
                        {log.criteria_snapshot && (
                          <button
                            type="button"
                            className="p-0.5"
                            onClick={() =>
                              setExpandedId(expandedId === log._id ? null : log._id)
                            }
                            title={t(
                              "yearCompletion.viewCriteria",
                              "View criteria at that time",
                            )}
                          >
                            {expandedId === log._id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        <span className="truncate" title={log.details}>
                          {log.details || t("common.dash")}
                        </span>
                      </div>
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
                            onClick={() =>
                              setYearDialogApp({
                                id: log.application._id,
                                name: [
                                  log.application?.user?.last_name,
                                  log.application?.user?.first_name,
                                ]
                                  .filter(Boolean)
                                  .join(" "),
                              })
                            }
                            title={t(
                              "yearCompletion.calculate",
                              "Calculate year completion",
                            )}
                          >
                            <Calculator className="h-4 w-4" />
                          </Button>
                          {log.action === "validation_failed" &&
                            log.application?.year_status === "active" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setFailedLog(log);
                                  setReason("");
                                }}
                                disabled={markFailedMutation.isPending}
                                title={t(
                                  "batchManagement.yearLog.markFailed",
                                  "Mark as Failed",
                                )}
                              >
                                <span className="text-xs px-1 font-semibold">
                                  {t(
                                    "batchManagement.yearLog.markFailed",
                                    "Mark Failed",
                                  )}
                                </span>
                              </Button>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {t("common.dash")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === log._id && log.criteria_snapshot && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/20 text-xs">
                        <div className="grid gap-2 md:grid-cols-2 p-2">
                          <div>
                            {t("yearCompletion.modules", "Modules")}:{" "}
                            {log.criteria_snapshot.modules?.completed}/
                            {log.criteria_snapshot.modules?.total} —{" "}
                            {log.criteria_snapshot.requirements?.modules_completed
                              ? t("common.met", "Met")
                              : t("common.notMet", "Not met")}
                          </div>
                          <div>
                            {t("yearCompletion.exams", "Exams")}:{" "}
                            {log.criteria_snapshot.requirements?.exams_met
                              ? t("common.met", "Met")
                              : t("common.notMet", "Not met")}
                          </div>
                          <div>
                            {t("yearCompletion.attendance", "Attendance")}:{" "}
                            {log.criteria_snapshot.requirements?.attendance
                              ?.overall_met
                              ? t("common.met", "Met")
                              : t("common.notMet", "Not met")}
                          </div>
                          <div>
                            {t("yearCompletion.submissions", "Submissions")}:{" "}
                            {log.criteria_snapshot.requirements?.submissions_met
                              ? t("common.met", "Met")
                              : t("common.notMet", "Not met")}
                          </div>
                          {(log.criteria_snapshot.carry_forward_modules || [])
                            .length > 0 && (
                            <div className="md:col-span-2">
                              {t(
                                "yearCompletion.carryForward",
                                "Carry-forward",
                              )}
                              :{" "}
                              {log.criteria_snapshot.carry_forward_modules
                                .map((m) => m.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-10 text-muted-foreground"
                >
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

      <Dialog
        open={!!failedLog}
        onOpenChange={(open) => !open && setFailedLog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                "batchManagement.modal.markFailed.title",
                "Mark Student as Failed",
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "batchManagement.yearLog.markFailedConfirm",
                "Are you sure? This will mark the student as failed for this academic year, allowing them to be re-enrolled into a different batch.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("batchManagement.yearLog.markFailedReason", "Reason (optional)")}
            </label>
            <textarea
              className="w-full border rounded-md p-2 text-sm"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t(
                "batchManagement.yearLog.markFailedReasonPlaceholder",
                "Enter reason for failing...",
              )}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFailedLog(null)}
              disabled={markFailedMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleMarkFailed}
              disabled={markFailedMutation.isPending}
            >
              {markFailedMutation.isPending
                ? t("common.processing", "Processing...")
                : t("batchManagement.yearLog.markFailed", "Mark as Failed")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <YearCompletionDialog
        open={!!yearDialogApp}
        onOpenChange={(open) => !open && setYearDialogApp(null)}
        applicationId={yearDialogApp?.id}
        studentName={yearDialogApp?.name}
        onDone={refetch}
      />
    </div>
  );
};

export default BatchYearLog;
