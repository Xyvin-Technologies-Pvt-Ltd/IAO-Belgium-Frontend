import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Database, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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
import { exportExactAudit } from "@/api/exactApi";
import { downloadCsv } from "@/utils/exportCsv";
import {
  useGetExactAuditIssues,
  useGetExactAuditPullStatus,
  useGetExactAuditSummary,
  usePullExactAudit,
} from "@/store/useExactStore";
import AuditPlan from "./AuditPlan";
import { NEEDS_EXACT_COPY, SEVERITY_STYLES, formatDate, formatDateTime, money } from "./auditUi";

function PullInfo({ pull, copiedAt, a }) {
  if (pull?.state === "running") {
    return <span>{a("pullRunning", { pages: pull.pages ?? 0, entries: pull.entries ?? 0 })}</span>;
  }
  if (pull?.state === "failed") {
    return <span className="text-red-700 dark:text-red-300">{a("pullFailed", { error: pull.error || "" })}</span>;
  }
  if (copiedAt) {
    return <span>{a("pullDone", { when: formatDateTime(copiedAt) })}</span>;
  }
  return <span>{a("pullNever")}</span>;
}

/**
 * Audit (step 1 of the clean-up plan): every IAO money record compared with the
 * Exact sales journal and the Mollie payouts. Read-only — nothing is changed.
 */
const AuditTab = ({ canModify, isConnected, page, setPage, rowsPerPage, setRowsPerPage, filters = {}, filtersActive }) => {
  const { t } = useTranslation();
  const a = (key, opts) => t(`integrations.exact.audit.${key}`, opts);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { data: summaryRes, isLoading: summaryLoading, error: summaryError, refetch } = useGetExactAuditSummary(filters);
  const { data: issuesRes, isLoading: issuesLoading } = useGetExactAuditIssues({
    ...filters,
    ...(category ? { category } : {}),
    page,
    limit: rowsPerPage,
  });
  const { data: pullRes } = useGetExactAuditPullStatus();
  const { mutate: startPull, isPending: isStarting } = usePullExactAudit();

  const summary = summaryRes?.data;
  const pull = pullRes?.data ?? summary?.pull;
  const running = pull?.state === "running";
  const coverage = summary?.coverage ?? {};
  const totals = summary?.totals ?? {};
  const amounts = summary?.amounts ?? {};
  const categories = summary?.categories ?? [];
  const rows = issuesRes?.data ?? [];
  const total = issuesRes?.total_count ?? 0;
  const noExactCopy = summary && !coverage.exact_entries;
  const totalIssues = Object.values(totals).reduce((sum, n) => sum + n, 0);

  //* When a pull finishes, rebuild the audit.
  const wasRunning = useRef(false);
  useEffect(() => {
    if (wasRunning.current && !running) {
      queryClient.invalidateQueries({ queryKey: ["exact-audit-summary"] });
      queryClient.invalidateQueries({ queryKey: ["exact-audit-issues"] });
    }
    wasRunning.current = running;
  }, [running, queryClient]);

  const pickCategory = (value) => {
    setCategory((current) => (current === value ? null : value));
    setPage(1);
  };

  //* Plain CSV button (works on prod and uat; the CSV/Excel menu isn't on uat yet).
  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await exportExactAudit({ ...filters, ...(category ? { category } : {}) });
      await downloadCsv(csv, `exact_audit${category ? `_${category}` : ""}`, "csv");
    } catch (err) {
      toast.error(err?.message || a("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <AuditPlan />

      <div className="rounded-lg border dark:border-white/10 px-4 py-3 text-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Database className="h-4 w-4 mt-0.5 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{a("copyTitle")}</p>
              <p className="text-muted-foreground">
                <PullInfo pull={pull} copiedAt={summary?.exact_copied_at} a={a} />
              </p>
            </div>
          </div>
          {canModify ? (
            <Button variant="outline" onClick={() => startPull()} disabled={!isConnected || running || isStarting}>
              <RefreshCw className={`w-4 h-4 mr-2 ${running ? "animate-spin" : ""}`} />
              {running ? a("pulling") : a("pull")}
            </Button>
          ) : null}
        </div>
        {summary ? (
          <p className="text-xs text-muted-foreground">
            {a("coverage", {
              records: coverage.iao_records ?? 0,
              ok: coverage.iao_ok ?? 0,
              entries: coverage.exact_entries ?? 0,
              first: coverage.exact_first_number ?? "—",
              last: coverage.exact_last_number ?? "—",
              payouts: coverage.mollie_payouts ?? 0,
            })}
            {summary.generated_at ? ` · ${a("generated", { when: formatDateTime(summary.generated_at) })}` : ""}
          </p>
        ) : null}
        {noExactCopy ? (
          <div className="flex gap-2 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {a("noCopy")}
          </div>
        ) : null}
      </div>

      {summaryLoading ? (
        <TableSkeleton rows={2} columns={4} />
      ) : summaryError ? (
        <ErrorMessage message={summaryError?.message || a("loadFailed")} onRetry={refetch} variant="inline" />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {totalIssues ? a("issuesFound", { count: totalIssues }) : a("noIssues")}
            </p>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!total || exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? a("exporting") : a("export")}
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const active = category === c.category;
              const muted = noExactCopy && NEEDS_EXACT_COPY.includes(c.category);
              return (
                <button
                  key={c.category}
                  type="button"
                  onClick={() => pickCategory(c.category)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    active ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 dark:border-white/10 hover:border-gray-300"
                  } ${muted ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {c.group} · {a(`category.${c.category}`)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${totals[c.category] ? SEVERITY_STYLES[c.severity] : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>
                      {totals[c.category] ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{a(`hint.${c.category}`)}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {a("stepLabel", { step: c.step })}
                    {amounts[c.category] ? ` · ${money(amounts[c.category])} EUR` : ""}
                    {muted ? ` · ${a("needsCopy")}` : ""}
                  </div>
                </button>
              );
            })}
          </div>

          {issuesLoading ? (
            <TableSkeleton rows={3} columns={6} />
          ) : total === 0 ? (
            <div className="rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 text-sm text-muted-foreground">
              {filtersActive || category ? t("integrations.exact.filters.noMatch") : a("noIssues")}
            </div>
          ) : (
            <>
              <div className="border dark:border-white/10 rounded-lg overflow-x-auto">
                <Table className="w-full min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{a("col.date")}</TableHead>
                      <TableHead>{a("col.problem")}</TableHead>
                      <TableHead>{a("col.iao")}</TableHead>
                      <TableHead className="text-right">{a("col.iaoAmount")}</TableHead>
                      <TableHead>{a("col.exact")}</TableHead>
                      <TableHead className="text-right">{a("col.exactAmount")}</TableHead>
                      <TableHead>{a("col.detail")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((i) => (
                      <TableRow key={i.key}>
                        <TableCell className="whitespace-nowrap">{formatDate(i.date)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[i.severity]}`}>
                            {a(`category.${i.category}`)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[260px]">
                          {i.iao ? (
                            <>
                              <div className="font-mono text-sm">{i.iao.uid}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[i.iao.payment_uid, i.iao.name].filter(Boolean).join(" · ")}
                              </div>
                              {i.iao.tr ? <div className="font-mono text-xs text-muted-foreground truncate">{i.iao.tr}</div> : null}
                            </>
                          ) : i.mollie ? (
                            <>
                              <div className="font-mono text-xs">{i.mollie.id}</div>
                              <div className="text-xs text-muted-foreground truncate">{i.mollie.description || i.mollie.payout}</div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{money(i.iao?.amount ?? i.mollie?.amount)}</TableCell>
                        <TableCell className="max-w-[240px]">
                          {i.exact ? (
                            <>
                              <div className="font-mono text-sm">#{i.exact.entry_number}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[i.exact.your_ref, i.exact.customer_name].filter(Boolean).join(" · ")}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">{money(i.exact?.amount)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[280px]">{i.detail || a(`hint.${i.category}`)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={total} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AuditTab;
