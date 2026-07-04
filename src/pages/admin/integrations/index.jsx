import { useEffect } from "react";
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
import ErrorMessage from "@/components/common/ErrorMessage";
import {
  useGetExactStatus,
  useGetExactUnsynced,
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

const IntegrationsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
  } = useGetExactUnsynced();

  const { mutate: reconcile, isPending: isReconciling } = useReconcileExact();
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectExact();

  const status = statusResponse?.data;
  const isConnected = Boolean(status?.connected);
  const unsynced = unsyncedResponse?.data;
  const unsyncedCount = unsynced?.count ?? 0;
  const unsyncedRows = unsynced?.rows ?? [];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exactResult = params.get("exact");
    if (!exactResult) return;

    if (exactResult === "connected") {
      toast.success(t("integrations.exact.oauthConnected"));
      queryClient.invalidateQueries({ queryKey: ["exact-status"] });
      queryClient.invalidateQueries({ queryKey: ["exact-unsynced"] });
      refetch();
      refetchUnsynced();
    } else if (exactResult === "error") {
      toast.error(t("integrations.exact.oauthFailed"));
    }

    params.delete("exact");
    const remaining = params.toString();
    const nextUrl = `${window.location.pathname}${remaining ? `?${remaining}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, [queryClient, refetch, refetchUnsynced, t]);

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

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4 max-w-3xl">
        <TableSkeleton rows={3} columns={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 max-w-3xl">
        <ErrorMessage
          message={error?.message || t("integrations.exact.loadFailed")}
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 max-w-3xl">
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

        {isUnsyncedLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : unsyncedError ? (
          <ErrorMessage
            message={unsyncedError?.message || t("integrations.exact.unsyncedLoadFailed")}
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
                total: unsynced.total,
                currency: unsynced.currency || "EUR",
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
                      <TableCell className="text-right whitespace-nowrap">
                        {row.amount} {row.currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
      </div>
    </div>
  );
};

export default IntegrationsPage;
