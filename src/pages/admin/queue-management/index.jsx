import { useEffect, useMemo, useState } from "react";
import { Layers, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCanModify } from "@/hooks/useCanModify";
import {
  QUEUE_NAMES,
  useQueueSummaries,
  useQueueJobs,
  useBulkRemoveQueueJobs,
  useRetryQueueJob,
  useCleanQueueJobs,
} from "@/store/useQueueStore";

const QUEUE_TABS = [
  { key: "email", name: QUEUE_NAMES.email, labelKey: "queues.tabs.email" },
  { key: "exact", name: QUEUE_NAMES.exact, labelKey: "queues.tabs.exact" },
  {
    key: "contract",
    name: QUEUE_NAMES.contract,
    labelKey: "queues.tabs.contract",
  },
];

const STATUS_TABS = ["waiting", "active", "delayed", "failed"];

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function CountCard({ label, value, highlight = false }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlight
          ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
          : "border-border bg-card"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-dashboard-text dark:text-white">
        {value ?? 0}
      </p>
    </div>
  );
}

const QueueManagementPage = () => {
  const { t } = useTranslation();
  const canModify = useCanModify("/admin/queue-management");

  const [queueTab, setQueueTab] = useState(QUEUE_TABS[0].name);
  const [statusTab, setStatusTab] = useState("waiting");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailJob, setDetailJob] = useState(null);

  const {
    data: summariesResponse,
    isLoading: summariesLoading,
    error: summariesError,
    refetch: refetchSummaries,
  } = useQueueSummaries();

  const {
    data: jobsResponse,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useQueueJobs(queueTab, {
    status: statusTab,
    page,
    limit: rowsPerPage,
  });

  const { mutate: bulkRemove, isPending: isBulkRemoving } =
    useBulkRemoveQueueJobs(queueTab);
  const { mutate: retryJob, isPending: isRetrying } =
    useRetryQueueJob(queueTab);
  const { mutate: cleanFailed, isPending: isCleaning } =
    useCleanQueueJobs(queueTab);

  const summaries = summariesResponse?.data ?? [];
  const jobs = jobsResponse?.data ?? [];
  const totalCount = jobsResponse?.total_count ?? 0;

  const currentSummary = useMemo(
    () => summaries.find((s) => s.name === queueTab),
    [summaries, queueTab],
  );

  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [queueTab, statusTab]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, rowsPerPage]);

  const allSelected =
    jobs.length > 0 && jobs.every((job) => selectedIds.includes(String(job.id)));

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(jobs.map((job) => String(job.id)));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (jobId, checked) => {
    const id = String(jobId);
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleRefresh = () => {
    refetchSummaries();
    refetchJobs();
  };

  const handleRemoveSelected = () => {
    if (!selectedIds.length) return;
    if (!window.confirm(t("queues.confirmRemoveSelected"))) return;
    bulkRemove(selectedIds, {
      onSuccess: () => setSelectedIds([]),
    });
  };

  const handleClearFailed = () => {
    if (!window.confirm(t("queues.confirmClearFailed"))) return;
    cleanFailed({ status: "failed" });
  };

  const handleRetrySelected = () => {
    const failedSelected = jobs.filter(
      (job) =>
        selectedIds.includes(String(job.id)) && job.status === "failed",
    );
    if (!failedSelected.length) {
      window.alert(t("queues.retryOnlyFailed"));
      return;
    }
    failedSelected.forEach((job) => retryJob(String(job.id)));
    setSelectedIds([]);
  };

  const tableColSpan =
    (canModify ? 1 : 0) + 5 + (statusTab === "failed" ? 1 : 0);

  if (summariesLoading && !summaries.length) {
    return (
      <div className="space-y-6 mt-4 w-full">
        <TableSkeleton rows={4} columns={4} />
      </div>
    );
  }

  if (summariesError) {
    return (
      <div className="mt-4 w-full">
        <ErrorMessage
          message={summariesError?.message || t("queues.loadFailed")}
          onRetry={handleRefresh}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-dashboard-text dark:text-white flex items-center gap-2">
            <Layers className="size-5" />
            {t("queues.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("queues.subtitle")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="size-4 mr-2" />
          {t("queues.refresh")}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <CountCard
          label={t("queues.counts.waiting")}
          value={currentSummary?.counts?.waiting}
        />
        <CountCard
          label={t("queues.counts.active")}
          value={currentSummary?.counts?.active}
        />
        <CountCard
          label={t("queues.counts.delayed")}
          value={currentSummary?.counts?.delayed}
        />
        <CountCard
          label={t("queues.counts.failed")}
          value={currentSummary?.counts?.failed}
          highlight={(currentSummary?.counts?.failed ?? 0) > 0}
        />
        <CountCard
          label={t("queues.counts.completed")}
          value={currentSummary?.counts?.completed}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {QUEUE_TABS.map((tab) => (
          <button
            key={tab.name}
            type="button"
            onClick={() => setQueueTab(tab.name)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              queueTab === tab.name
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusTab(status)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              statusTab === status
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {t(`queues.status.${status}`)}
          </button>
        ))}
      </div>

      {canModify && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={!selectedIds.length || isBulkRemoving}
            onClick={handleRemoveSelected}
          >
            <Trash2 className="size-4 mr-2" />
            {t("queues.removeSelected")}
          </Button>
          {statusTab === "failed" && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedIds.length || isRetrying}
                onClick={handleRetrySelected}
              >
                <RotateCcw className="size-4 mr-2" />
                {t("queues.retrySelected")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isCleaning}
                onClick={handleClearFailed}
              >
                {t("queues.clearAllFailed")}
              </Button>
            </>
          )}
        </div>
      )}

      {jobsError ? (
        <ErrorMessage
          message={jobsError?.message || t("queues.jobsLoadFailed")}
          onRetry={refetchJobs}
          variant="card"
        />
      ) : jobsLoading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {canModify && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label={t("queues.selectAll")}
                      />
                    </TableHead>
                  )}
                  <TableHead>{t("queues.table.jobId")}</TableHead>
                  <TableHead>{t("queues.table.type")}</TableHead>
                  <TableHead>{t("queues.table.summary")}</TableHead>
                  <TableHead>{t("queues.table.created")}</TableHead>
                  <TableHead>{t("queues.table.attempts")}</TableHead>
                  {statusTab === "failed" && (
                    <TableHead>{t("queues.table.error")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColSpan}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("queues.noJobs")}
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setDetailJob(job)}
                    >
                      {canModify && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(String(job.id))}
                            onCheckedChange={(checked) =>
                              toggleSelect(job.id, Boolean(checked))
                            }
                            aria-label={t("queues.selectJob")}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-mono text-xs">
                        {job.id}
                      </TableCell>
                      <TableCell>{job.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {job.data_preview || "—"}
                      </TableCell>
                      <TableCell>{formatDateTime(job.timestamp)}</TableCell>
                      <TableCell>{job.attemptsMade ?? 0}</TableCell>
                      {statusTab === "failed" && (
                        <TableCell className="max-w-xs truncate text-destructive">
                          {job.failedReason || "—"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalCount > 0 && (
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(1);
              }}
            />
          )}
        </>
      )}

      <Dialog
        open={Boolean(detailJob)}
        onOpenChange={(open) => !open && setDetailJob(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("queues.detail.title")}</DialogTitle>
            <DialogDescription>
              {detailJob?.id} — {detailJob?.name}
            </DialogDescription>
          </DialogHeader>

          {detailJob && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">
                    {t("queues.detail.status")}
                  </span>
                  <p>{detailJob.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("queues.detail.attempts")}
                  </span>
                  <p>{detailJob.attemptsMade ?? 0}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("queues.table.created")}
                  </span>
                  <p>{formatDateTime(detailJob.timestamp)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {t("queues.detail.processed")}
                  </span>
                  <p>{formatDateTime(detailJob.processedOn)}</p>
                </div>
              </div>

              {detailJob.failedReason && (
                <div>
                  <span className="text-muted-foreground">
                    {t("queues.table.error")}
                  </span>
                  <p className="text-destructive whitespace-pre-wrap break-words">
                    {detailJob.failedReason}
                  </p>
                </div>
              )}

              <div>
                <span className="text-muted-foreground">
                  {t("queues.detail.payload")}
                </span>
                <pre className="mt-1 rounded-md bg-muted p-3 text-xs overflow-x-auto">
                  {JSON.stringify(detailJob.data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailJob(null)}>
              {t("queues.detail.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QueueManagementPage;
