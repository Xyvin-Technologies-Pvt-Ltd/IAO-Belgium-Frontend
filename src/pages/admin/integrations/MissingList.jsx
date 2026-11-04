import { useState } from "react";
import { PlusCircle } from "lucide-react";
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
import { useGetExactMissing, useAddExactToOutbox } from "@/store/useExactStore";

const QUEUED_STYLES = {
  held: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  sending: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

/**
 * To send → Missing: records that should be in Exact but aren't (normal payments
 * and third-party invoices). "Add to To send" only queues the record — it is
 * previewed and sent from the Waiting list like everything else. Third-party and
 * KMO payments never show here: their invoice is what goes to Exact.
 * Remount (key) on filter change to start at page 1.
 */
const MissingList = ({ isConnected, canModify, filters = {}, filtersActive = false }) => {
  const { t } = useTranslation();
  const k = (key, opts) => t(`integrations.exact.missing.${key}`, opts);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data, isLoading, error, refetch } = useGetExactMissing({ page, limit: rowsPerPage, ...filters });
  const { mutate: addToOutbox, isPending: isAdding, variables: addingRecord } = useAddExactToOutbox();

  const rows = data?.data ?? [];
  const total = data?.total_count ?? 0;
  const counts = data?.counts ?? {};
  const since = data?.missing_from ? formatDate(data.missing_from) : null;

  if (isLoading) return <TableSkeleton rows={3} columns={7} />;
  if (error) {
    return <ErrorMessage message={error?.message || k("loadFailed")} onRetry={refetch} variant="inline" />;
  }
  if (total === 0) {
    return (
      <div
        className={
          filtersActive
            ? "rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 text-sm text-muted-foreground"
            : "rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        }
      >
        {filtersActive ? t("integrations.exact.filters.noMatch") : k("empty", { since: since || "—" })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        {k("banner", {
          count: total,
          payments: counts.payment || 0,
          invoices: counts.third_party_invoice || 0,
          since: since || "—",
        })}
      </div>

      <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
        <Table className="w-full min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t("integrations.exact.toSend.type")}</TableHead>
              <TableHead>{t("integrations.exact.toSend.record")}</TableHead>
              <TableHead>{t("integrations.exact.toSend.name")}</TableHead>
              <TableHead className="text-right">{t("integrations.exact.table.amount")}</TableHead>
              <TableHead>{k("paidOn")}</TableHead>
              <TableHead>{t("integrations.exact.toSend.status")}</TableHead>
              {canModify ? (
                <TableHead className="text-right">{t("integrations.exact.table.action")}</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const busy = isAdding && addingRecord?.id === row.id;
              return (
                <TableRow key={`${row.kind}-${row.id}`}>
                  <TableCell className="whitespace-nowrap">{k(`kind.${row.kind}`)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-mono text-sm">{row.record_uid || "—"}</div>
                    {row.kind === "third_party_invoice" && row.payment_uid ? (
                      <div className="font-mono text-xs text-muted-foreground">{row.payment_uid}</div>
                    ) : null}
                    <div
                      className="font-mono text-xs text-muted-foreground max-w-[220px] truncate"
                      title={row.transaction_id || undefined}
                    >
                      {row.transaction_id || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <div className="truncate" title={row.name || undefined}>{row.name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate" title={row.email || undefined}>
                      {row.student_name && row.student_name !== row.name ? `${row.student_name} · ` : ""}
                      {row.email || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap font-medium">
                    {row.amount} {row.currency}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                  <TableCell>
                    {row.queued_state ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          QUEUED_STYLES[row.queued_state] || QUEUED_STYLES.held
                        }`}
                      >
                        {k(`queued.${row.queued_state}`)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{k("notQueued")}</span>
                    )}
                  </TableCell>
                  {canModify ? (
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToOutbox({ kind: row.kind, id: row.id })}
                        disabled={!isConnected || Boolean(row.queued_state) || isAdding}
                        title={k("addHint")}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                        {busy ? k("adding") : k("add")}
                      </Button>
                    </TableCell>
                  ) : null}
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
        totalRows={total}
      />
    </div>
  );
};

export default MissingList;
