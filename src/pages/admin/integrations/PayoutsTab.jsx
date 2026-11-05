import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  useGetExactPayouts,
  useGetExactPayoutsSyncStatus,
  useSyncExactPayouts,
} from "@/store/useExactStore";
import PayoutDetailDialog from "./PayoutDetailDialog";
import { COUNT_ORDER, LINE_STYLES, formatDate, formatDateTime, money } from "./payoutUi";
import PayoutStateBadge from "./PayoutStateBadge";

function SyncInfo({ sync, p }) {
  if (!sync) return null;
  if (sync.state === "running") return <span>{p("syncRunning")}</span>;
  if (sync.state === "failed") return <span className="text-red-700 dark:text-red-300">{p("syncFailed", { error: sync.error || "" })}</span>;
  if (sync.finished_at) {
    return (
      <span>
        {p("syncDone", { when: formatDateTime(sync.finished_at), synced: sync.synced ?? 0 })}
        {sync.failed ? ` · ${p("syncSomeFailed", { count: sync.failed })}` : ""}
      </span>
    );
  }
  return <span>{p("syncNever")}</span>;
}

/**
 * Payouts: one row per Mollie payout (same reference as xCore) with how many of
 * its transactions are in Exact. Click a row for the transactions and the
 * per-payout actions.
 */
const PayoutsTab = ({ isConnected, canModify, page, setPage, rowsPerPage, setRowsPerPage, filters = {}, filtersActive }) => {
  const { t } = useTranslation();
  const p = (key, opts) => t(`integrations.exact.payouts.${key}`, opts);
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState(null);

  const { data, isLoading, error, refetch } = useGetExactPayouts({ page, limit: rowsPerPage, ...filters });
  const { data: syncResponse } = useGetExactPayoutsSyncStatus();
  const { mutate: startSync, isPending: isStarting } = useSyncExactPayouts();

  const sync = syncResponse?.data ?? data?.sync;
  const configured = sync?.configured !== false;
  const running = sync?.state === "running";
  const rows = data?.data ?? [];
  const total = data?.total_count ?? 0;

  //* When a refresh finishes, reload the list.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: ["exact-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["exact-payout"] });
    }
    wasRunning.current = running;
  }, [running, queryClient]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="text-sm text-muted-foreground">
          {configured ? <SyncInfo sync={sync} p={p} /> : null}
        </div>
        {canModify ? (
          <Button variant="outline" onClick={() => startSync()} disabled={!configured || running || isStarting}>
            <RefreshCw className={`w-4 h-4 mr-2 ${running ? "animate-spin" : ""}`} />
            {running ? p("refreshing") : p("refresh")}
          </Button>
        ) : null}
      </div>

      {configured ? null : (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          {p("notConfigured")}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={3} columns={7} />
      ) : error ? (
        <ErrorMessage message={error?.message || p("loadFailed")} onRetry={refetch} variant="inline" />
      ) : total === 0 ? (
        <div className="rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 text-sm text-muted-foreground">
          {filtersActive ? t("integrations.exact.filters.noMatch") : p("empty")}
        </div>
      ) : (
        <>
          <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
            <Table className="w-full min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{p("col.reference")}</TableHead>
                  <TableHead>{p("col.paidOut")}</TableHead>
                  <TableHead className="text-right">{p("col.net")}</TableHead>
                  <TableHead className="text-right">{p("col.fees")}</TableHead>
                  <TableHead>{p("col.transactions")}</TableHead>
                  <TableHead>{p("col.inExact")}</TableHead>
                  <TableHead>{p("col.state")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.settlement_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setOpenId(row.settlement_id)}
                  >
                    <TableCell className="whitespace-nowrap">
                      <div className="font-mono text-sm">{row.reference || row.settlement_id}</div>
                      <div className="text-xs text-muted-foreground">{p(`mollieStatus.${row.status}`)}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(row.settled_at || row.created_at)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap font-medium">{money(row.amount, row.currency)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {money(row.costs_gross, row.currency)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p("txCount", { payments: row.payment_count, refunds: row.refund_count })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[380px]">
                        {COUNT_ORDER.filter((s) => row.counts?.[s] > 0).map((s) => (
                          <span
                            key={s}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LINE_STYLES[s]}`}
                          >
                            {row.counts[s]} {p(`line.${s}`)}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PayoutStateBadge state={row.state} p={p} />
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
            totalRows={total}
          />
        </>
      )}

      <PayoutDetailDialog
        settlementId={openId}
        onClose={() => setOpenId(null)}
        isConnected={isConnected}
        canModify={canModify}
      />
    </div>
  );
};

export default PayoutsTab;
