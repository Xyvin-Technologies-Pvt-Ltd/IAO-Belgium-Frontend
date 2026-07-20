import { useEffect, useState } from "react";
import { ExternalLink, Plug, RefreshCw, Unplug } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  useGetExactStatus,
  useGetExactUnsynced,
  useGetExactSent,
  useReconcileExact,
  useDisconnectExact,
} from "@/store/useExactStore";
import { useTranslation } from "react-i18next";

const apiBase = import.meta.env.VITE_APP_API_URL || "http://localhost:3005/api/v1/";

function formatExpiryDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPaymentDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const IntegrationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [syncTab, setSyncTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const {
    data: statusResponse,
    isLoading,
    error,
    refetch,
  } = useGetExactStatus();

  const {
    data: unsyncedResponse,
    isLoading: isUnsyncedLoading,
    error: unsyncedError,
    refetch: refetchUnsynced,
  } = useGetExactUnsynced(
    { page, limit: rowsPerPage },
    { enabled: syncTab === "pending" },
  );

  const {
    data: unsyncedCountResponse,
  } = useGetExactUnsynced(
    { count_only: true },
    { enabled: syncTab !== "pending" },
  );

  const {
    data: sentResponse,
    isLoading: isSentLoading,
    error: sentError,
    refetch: refetchSent,
  } = useGetExactSent(
    { page, limit: rowsPerPage },
    { enabled: syncTab === "sent" },
  );

  const {
    data: sentCountResponse,
  } = useGetExactSent(
    { count_only: true },
    { enabled: syncTab !== "sent" },
  );

  const { mutate: reconcile, isPending: isReconciling } = useReconcileExact();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectExact();

  const status = statusResponse?.data;
  const isConnected = Boolean(status?.connected);
  const unsyncedRows = unsyncedResponse?.data ?? [];
  const unsyncedCount =
    syncTab === "pending"
      ? (unsyncedResponse?.total_count ?? 0)
      : (unsyncedCountResponse?.total_count ?? unsyncedResponse?.total_count ?? 0);
  const sentRows = sentResponse?.data ?? [];
  const sentCount =
    syncTab === "sent"
      ? (sentResponse?.total_count ?? 0)
      : (sentCountResponse?.total_count ?? sentResponse?.total_count ?? 0);

  useEffect(() => {
    setPage(1);
  }, [syncTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exactResult = params.get("exact");
    if (!exactResult) return;

    if (exactResult === "connected") {
      toast.success(t("integrations.exact.oauthConnected"));
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
      queryClient.invalidateQueries({ queryKey: ["exact-unsynced"] });
      queryClient.invalidateQueries({ queryKey: ["exact-sent"] });
      refetch();
      refetchUnsynced();
      refetchSent();
    } else if (exactResult === "error") {
      toast.error(t("integrations.exact.oauthFailed"));
    }

    params.delete("exact");
    const remaining = params.toString();
    const nextUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [queryClient, refetch, refetchUnsynced, refetchSent, t]);

  const handleAuthorise = () => {
    window.location.href = `${apiBase}/exact/auth`;
  };

  const handleSync = () => {
    reconcile();
  };

  const handleDisconnect = () => {
    if (!window.confirm(t("integrations.exact.disconnectConfirm"))) return;
    disconnect();
  };

  const formatType = (type) => {
    if (!type) return "—";
    const key = `integrations.exact.types.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const formatSource = (source) => {
    if (!source) return "—";
    const key = `integrations.exact.sources.${source}`;
    const translated = t(key);
    return translated === key ? source : translated;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4 w-full">
        <TableSkeleton rows={3} columns={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 w-full">
        <ErrorMessage
          message={error?.message || t("integrations.exact.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 w-full">
      <div>
        <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
          {t("integrations.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("integrations.subtitle")}
        </p>
      </div>

      <div className="rounded-xl border dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600/10 text-blue-600 shrink-0">
              <Plug className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("integrations.exact.title")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("integrations.exact.description")}
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isConnected
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {isConnected
              ? t("integrations.exact.connected")
              : t("integrations.exact.disconnected")}
          </span>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 space-y-2 text-sm">
              {status.division != null && (
                <p className="text-gray-900 dark:text-white">
                  <span className="text-muted-foreground">
                    {t("integrations.exact.division")}:
                  </span>{" "}
                  {status.division}
                </p>
              )}
              {status.expires_at && (
                <p className="text-gray-900 dark:text-white">
                  <span className="text-muted-foreground">
                    {t("integrations.exact.tokenExpires")}:
                  </span>{" "}
                  {formatExpiryDate(status.expires_at)}
                  {!status.token_valid && (
                    <span className="text-amber-600 dark:text-amber-400 ml-2">
                      ({t("integrations.exact.autoRefreshNote")})
                    </span>
                  )}
                </p>
              )}
              <p className="text-muted-foreground">
                {t("integrations.exact.autoSyncNote")}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              <Unplug className="w-4 h-4 mr-2" />
              {isDisconnecting
                ? t("integrations.exact.disconnecting")
                : t("integrations.exact.disconnect")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("integrations.exact.authoriseHint")}
            </p>
            <Button onClick={handleAuthorise}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("integrations.exact.authorise")}
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-5 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("integrations.exact.syncTitle")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("integrations.exact.syncDescription")}
          </p>
        </div>

        <div className="flex gap-2 border-b dark:border-white/10 pb-0">
          <button
            type="button"
            onClick={() => setSyncTab("pending")}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              syncTab === "pending"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t("integrations.exact.tabPending")}
            {unsyncedCount > 0 ? ` (${unsyncedCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setSyncTab("sent")}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              syncTab === "sent"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {t("integrations.exact.tabSent")}
            {sentCount > 0 ? ` (${sentCount})` : ""}
          </button>
        </div>

        {syncTab === "pending" ? (
          <>
            {isUnsyncedLoading ? (
              <TableSkeleton rows={3} columns={6} />
            ) : unsyncedError ? (
              <ErrorMessage
                message={
                  unsyncedError?.message ||
                  t("integrations.exact.unsyncedLoadFailed")
                }
                onRetry={refetchUnsynced}
                variant="inline"
              />
            ) : unsyncedCount === 0 ? (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {t("integrations.exact.allSynced")}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  {t("integrations.exact.unsyncedBanner", {
                    count: unsyncedCount,
                  })}
                </div>

                <div className="border dark:border-white/10 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("integrations.exact.table.date")}</TableHead>
                        <TableHead>{t("integrations.exact.table.email")}</TableHead>
                        <TableHead>{t("integrations.exact.table.purpose")}</TableHead>
                        <TableHead>{t("integrations.exact.table.program")}</TableHead>
                        <TableHead>{t("integrations.exact.table.glAccount")}</TableHead>
                        <TableHead className="text-right">
                          {t("integrations.exact.table.amount")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unsyncedRows.map((row) => (
                        <TableRow key={row.payment_id}>
                          <TableCell>{formatPaymentDate(row.created_at)}</TableCell>
                          <TableCell className="max-w-[140px] truncate">
                            {row.email || "—"}
                          </TableCell>
                          <TableCell>{row.purpose || "—"}</TableCell>
                          <TableCell>{row.program_name || "—"}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {row.gl_account || "—"}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {row.amount} {row.currency}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  page={page}
                  setPage={setPage}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  totalRows={unsyncedCount}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button
                onClick={handleSync}
                disabled={!isConnected || isReconciling || unsyncedCount === 0}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${isReconciling ? "animate-spin" : ""}`}
                />
                {isReconciling
                  ? t("integrations.exact.syncing")
                  : t("integrations.exact.syncNow")}
              </Button>
              {!isConnected && (
                <p className="text-sm text-muted-foreground">
                  {t("integrations.exact.authoriseFirst")}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {isSentLoading ? (
              <TableSkeleton rows={3} columns={12} />
            ) : sentError ? (
              <ErrorMessage
                message={
                  sentError?.message || t("integrations.exact.sentLoadFailed")
                }
                onRetry={refetchSent}
                variant="inline"
              />
            ) : sentCount === 0 ? (
              <div className="rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 text-sm text-muted-foreground">
                {t("integrations.exact.noSentEntries")}
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
                  {t("integrations.exact.sentBanner", { count: sentCount })}
                </div>

                <div className="w-full border dark:border-white/10 rounded-lg overflow-x-auto">
                  <Table className="w-full min-w-[1400px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("integrations.exact.table.date")}</TableHead>
                        <TableHead>{t("integrations.exact.table.email")}</TableHead>
                        <TableHead>{t("integrations.exact.table.source")}</TableHead>
                        <TableHead>{t("integrations.exact.table.type")}</TableHead>
                        <TableHead>{t("integrations.exact.table.document")}</TableHead>
                        <TableHead>{t("integrations.exact.table.description")}</TableHead>
                        <TableHead>{t("integrations.exact.table.program")}</TableHead>
                        <TableHead>{t("integrations.exact.table.glAccount")}</TableHead>
                        <TableHead className="text-right">
                          {t("integrations.exact.table.amount")}
                        </TableHead>
                        <TableHead>{t("integrations.exact.table.currency")}</TableHead>
                        <TableHead>{t("integrations.exact.table.exactEntry")}</TableHead>
                        <TableHead>{t("integrations.exact.table.exactEntryId")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentRows.map((row) => {
                        const amountNum = Number(row.amount);
                        const isNegative = amountNum < 0;
                        return (
                          <TableRow key={row.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDateTime(row.pushed_at)}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={row.email || undefined}>
                              {row.email || "—"}
                            </TableCell>
                            <TableCell>{formatSource(row.source)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {formatType(row.type)}
                            </TableCell>
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              {row.uid || "—"}
                            </TableCell>
                            <TableCell
                              className="max-w-[280px] truncate"
                              title={row.description || undefined}
                            >
                              {row.description || "—"}
                            </TableCell>
                            <TableCell>{row.program_name || "—"}</TableCell>
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              {row.gl_account || "—"}
                            </TableCell>
                            <TableCell
                              className={`text-right whitespace-nowrap font-medium ${
                                isNegative
                                  ? "text-red-600 dark:text-red-400"
                                  : ""
                              }`}
                            >
                              {row.amount}
                            </TableCell>
                            <TableCell>{row.currency || "—"}</TableCell>
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              {row.exact_entry_number ?? "—"}
                            </TableCell>
                            <TableCell
                              className="font-mono text-xs max-w-[180px] truncate"
                              title={row.exact_entry_id || undefined}
                            >
                              {row.exact_entry_id || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  page={page}
                  setPage={setPage}
                  rowsPerPage={rowsPerPage}
                  setRowsPerPage={setRowsPerPage}
                  totalRows={sentCount}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
