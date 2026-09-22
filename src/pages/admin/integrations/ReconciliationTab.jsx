import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Download,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { useCanModify } from "@/hooks/useCanModify";
import {
  useGetExactReconciliation,
  useVerifyExactReconciliation,
  useResyncExactReconciliationRow,
} from "@/store/useExactStore";
import { exportExactReconciliation } from "@/api/exactApi";
import { downloadCsv } from "@/utils/exportCsv";

const ALL = "all";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Verdicts the verify endpoint can return. Anything unmapped falls through to a
 * neutral pill rather than being silently rendered as a pass.
 */
const VERDICT_STYLES = {
  matched: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  status_mismatch: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  mollie_amount_mismatch: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  exact_amount_mismatch: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  missing_in_exact: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  missing_in_mollie: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  no_transaction_id: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
  exact_error: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
  error: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
};

const ReconciliationTab = ({ page, setPage, rowsPerPage, setRowsPerPage }) => {
  const { t } = useTranslation();
  const canModify = useCanModify("finance");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [recordType, setRecordType] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [verdicts, setVerdicts] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [resyncTarget, setResyncTarget] = useState(null);

  const filterParams = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(recordType !== ALL ? { record_type: recordType } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    [debouncedSearch, recordType, from, to],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, recordType, from, to, setPage]);

  const { data, isLoading, isFetching, error, refetch } = useGetExactReconciliation({
    page,
    limit: rowsPerPage,
    ...filterParams,
  });

  const { mutate: verify, isPending: isVerifying } = useVerifyExactReconciliation();
  const { mutate: resyncRow, isPending: isResyncing } =
    useResyncExactReconciliationRow();

  const rows = data?.data ?? [];
  const totalRows = data?.total_count ?? 0;

  //* Verdicts are keyed by row id and only live for this session — the server
  //* stores nothing, so paging away discards them deliberately.
  const applyResults = (results = []) => {
    setVerdicts((prev) => {
      const next = { ...prev };
      for (const r of results) next[r.id] = r;
      return next;
    });
    const bad = results.filter((r) => r.verdict !== "matched").length;
    if (bad === 0) {
      toast.success(t("integrations.exact.reconciliation.allMatched"));
    } else {
      toast.warning(
        t("integrations.exact.reconciliation.someMismatched", { count: bad }),
      );
    }
  };

  const handleVerifyRow = (id) =>
    verify([id], { onSuccess: (res) => applyResults(res?.data || []) });

  const handleVerifyPage = () =>
    verify(
      rows.map((r) => r.id),
      { onSuccess: (res) => applyResults(res?.data || []) },
    );

  //* Accountant confirms per row — no bulk trigger. Dialog stays open on error
  //* so a transient failure (rate limit, etc.) can be retried immediately.
  const handleConfirmResync = () => {
    if (!resyncTarget) return;
    resyncRow(resyncTarget.id, { onSuccess: () => setResyncTarget(null) });
  };

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading(t("integrations.exact.reconciliation.exporting"));
    try {
      //* Export re-queries with the active filters so the file matches the
      //* filtered set, not just the visible page.
      const csv = await exportExactReconciliation(filterParams);
      downloadCsv(csv, "exact_reconciliation");
      toast.success(t("integrations.exact.reconciliation.exported"), { id: toastId });
    } catch (err) {
      toast.error(
        err?.message || t("integrations.exact.reconciliation.exportFailed"),
        { id: toastId },
      );
    } finally {
      setIsExporting(false);
    }
  };

  const hasFilters =
    Boolean(debouncedSearch) || recordType !== ALL || Boolean(from) || Boolean(to);

  const clearFilters = () => {
    setSearch("");
    setRecordType(ALL);
    setFrom("");
    setTo("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t("integrations.exact.reconciliation.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            {t("integrations.exact.reconciliation.recordType")}
          </label>
          <Select value={recordType} onValueChange={setRecordType}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t("integrations.exact.reconciliation.allRecords")}
              </SelectItem>
              <SelectItem value="invoice">
                {t("integrations.exact.reconciliation.typeInvoice")}
              </SelectItem>
              <SelectItem value="entry">
                {t("integrations.exact.reconciliation.typeEntry")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            {t("integrations.exact.reconciliation.from")}
          </label>
          <Input
            type="date"
            className="w-[150px]"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">
            {t("integrations.exact.reconciliation.to")}
          </label>
          <Input
            type="date"
            className="w-[150px]"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {hasFilters ? (
          <Button variant="ghost" onClick={clearFilters}>
            {t("integrations.exact.reconciliation.clear")}
          </Button>
        ) : null}

        <div className="ml-auto flex gap-2">
          {canModify ? (
            <Button
              variant="outline"
              onClick={handleVerifyPage}
              disabled={isVerifying || rows.length === 0}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              {isVerifying
                ? t("integrations.exact.reconciliation.verifying")
                : t("integrations.exact.reconciliation.verifyPage")}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting || totalRows === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("integrations.exact.reconciliation.export")}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Table>
          <TableBody>
            <TableSkeleton rows={5} columns={12} />
          </TableBody>
        </Table>
      ) : error ? (
        <ErrorMessage
          message={
            error?.message || t("integrations.exact.reconciliation.loadFailed")
          }
          onRetry={refetch}
          variant="inline"
        />
      ) : totalRows === 0 ? (
        <div className="rounded-lg border dark:border-white/10 px-4 py-6 text-sm text-muted-foreground text-center">
          {t("integrations.exact.reconciliation.empty")}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <Table className="w-full min-w-[1900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>{t("integrations.exact.table.date")}</TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.iaoDocument")}
                  </TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.student")}
                  </TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.company")}
                  </TableHead>
                  <TableHead>{t("integrations.exact.table.program")}</TableHead>
                  <TableHead className="text-right">
                    {t("integrations.exact.table.amount")}
                  </TableHead>
                  <TableHead>
                    {t("integrations.exact.table.transactionId")}
                  </TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.method")}
                  </TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.recordType")}
                  </TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.exactInvoiceNo")}
                  </TableHead>
                  <TableHead>{t("integrations.exact.table.exactEntry")}</TableHead>
                  <TableHead>{t("integrations.exact.table.glAccount")}</TableHead>
                  <TableHead>
                    {t("integrations.exact.reconciliation.match")}
                  </TableHead>
                  {canModify ? <TableHead /> : null}
                </TableRow>
              </TableHeader>
              <TableBody
                className={isFetching ? "opacity-50 pointer-events-none" : ""}
              >
                {rows.map((row) => {
                  const isNegative = Number(row.amount) < 0;
                  const isInvoice = row.record_type === "invoice";
                  const result = verdicts[row.id];
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(row.pushed_at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{row.invoice_uid || row.uid}</div>
                        <div className="text-xs text-muted-foreground">{row.type}</div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="truncate" title={row.student_name || undefined}>
                          {row.student_name || "—"}
                        </div>
                        <div
                          className="text-xs text-muted-foreground truncate"
                          title={row.email || undefined}
                        >
                          {row.email || "—"}
                        </div>
                      </TableCell>
                      <TableCell
                        className="max-w-[180px] truncate"
                        title={row.company_name || undefined}
                      >
                        {row.company_name || "—"}
                      </TableCell>
                      <TableCell>{row.program_name || "—"}</TableCell>
                      <TableCell
                        className={`text-right whitespace-nowrap font-medium ${
                          isNegative ? "text-red-600 dark:text-red-400" : ""
                        }`}
                      >
                        {row.amount} {row.currency}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs max-w-[180px] truncate"
                        title={row.transaction_id || undefined}
                      >
                        {row.transaction_id || "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {row.payment_method || "—"}
                      </TableCell>
                      <TableCell>
                        {/* The column that shows the original problem: rows reading
                            "Entry" have no invoice number and no document in Exact. */}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            isInvoice
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {isInvoice
                            ? t("integrations.exact.reconciliation.typeInvoice")
                            : t("integrations.exact.reconciliation.typeEntry")}
                        </span>
                        {row.document ? (
                          <CheckCircle2
                            className="inline-block h-4 w-4 ml-1 text-emerald-600"
                            aria-label={t("integrations.exact.table.document")}
                          />
                        ) : null}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {row.exact_invoice_number ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {row.exact_entry_number ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {row.gl_account || "—"}
                      </TableCell>
                      <TableCell>
                        {result ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              VERDICT_STYLES[result.verdict] || VERDICT_STYLES.error
                            }`}
                            title={(result.issues || []).join(", ") || undefined}
                          >
                            {result.verdict === "matched" ? (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {t(
                              `integrations.exact.reconciliation.verdict.${result.verdict}`,
                              result.verdict,
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("integrations.exact.reconciliation.notChecked")}
                          </span>
                        )}
                      </TableCell>
                      {canModify ? (
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isVerifying}
                            onClick={() => handleVerifyRow(row.id)}
                          >
                            {t("integrations.exact.reconciliation.verify")}
                          </Button>
                          {!isInvoice && row.source !== "credit_note" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-2"
                              disabled={isResyncing}
                              onClick={() => setResyncTarget(row)}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                              {t("integrations.exact.reconciliation.convertToInvoice")}
                            </Button>
                          ) : null}
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
            totalRows={totalRows}
          />
        </div>
      )}

      <Dialog
        open={Boolean(resyncTarget)}
        onOpenChange={(open) => !open && !isResyncing && setResyncTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-amber-500" />
              {t("integrations.exact.reconciliation.convertTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("integrations.exact.reconciliation.convertDescription")}
            </DialogDescription>
          </DialogHeader>

          {resyncTarget ? (
            <div className="rounded-md border dark:border-white/10 px-3 py-2 text-sm space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("integrations.exact.reconciliation.iaoDocument")}
                </span>
                <span className="font-medium">
                  {resyncTarget.invoice_uid || resyncTarget.uid}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("integrations.exact.reconciliation.student")}
                </span>
                <span className="font-medium truncate max-w-[220px]">
                  {resyncTarget.student_name || resyncTarget.email || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("integrations.exact.table.amount")}
                </span>
                <span className="font-medium">
                  {resyncTarget.amount} {resyncTarget.currency}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("integrations.exact.table.exactEntry")}
                </span>
                <span className="font-mono">
                  {resyncTarget.exact_entry_number ?? "—"}
                </span>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setResyncTarget(null)}
              disabled={isResyncing}
            >
              {t("integrations.exact.reconciliation.convertCancel")}
            </Button>
            <Button onClick={handleConfirmResync} disabled={isResyncing}>
              {isResyncing
                ? t("integrations.exact.reconciliation.converting")
                : t("integrations.exact.reconciliation.convertConfirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReconciliationTab;
