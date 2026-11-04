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
import { useGetExactSent } from "@/store/useExactStore";

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** History → GL lines: one row per GL line posted to Exact (accounting audit trail). */
const SentTable = ({ page, setPage, rowsPerPage, setRowsPerPage, filters = {}, filtersActive = false }) => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useGetExactSent({ page, limit: rowsPerPage, ...filters });

  const rows = data?.data ?? [];
  const count = data?.total_count ?? 0;

  const translated = (prefix, value) => {
    if (!value) return "—";
    const key = `integrations.exact.${prefix}.${value}`;
    const text = t(key);
    return text === key ? value : text;
  };

  if (isLoading) return <TableSkeleton rows={3} columns={15} />;
  if (error) {
    return (
      <ErrorMessage
        message={error?.message || t("integrations.exact.sentLoadFailed")}
        onRetry={refetch}
        variant="inline"
      />
    );
  }
  if (count === 0) {
    return (
      <div className="rounded-lg bg-muted/50 border dark:border-white/10 px-4 py-3 text-sm text-muted-foreground">
        {filtersActive ? t("integrations.exact.filters.noMatch") : t("integrations.exact.noSentEntries")}
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
        {t("integrations.exact.sentBanner", { count })}
      </div>

      <div className="w-full border dark:border-white/10 rounded-lg overflow-x-auto">
        <Table className="w-full min-w-[1800px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t("integrations.exact.table.date")}</TableHead>
              <TableHead>{t("integrations.exact.table.email")}</TableHead>
              <TableHead>{t("integrations.exact.table.source")}</TableHead>
              <TableHead>{t("integrations.exact.table.type")}</TableHead>
              <TableHead>{t("integrations.exact.table.document")}</TableHead>
              <TableHead>{t("integrations.exact.table.invoice")}</TableHead>
              <TableHead>{t("integrations.exact.table.transactionId")}</TableHead>
              <TableHead>{t("integrations.exact.table.yourRef")}</TableHead>
              <TableHead>{t("integrations.exact.table.description")}</TableHead>
              <TableHead>{t("integrations.exact.table.program")}</TableHead>
              <TableHead>{t("integrations.exact.table.glAccount")}</TableHead>
              <TableHead className="text-right">{t("integrations.exact.table.amount")}</TableHead>
              <TableHead>{t("integrations.exact.table.currency")}</TableHead>
              <TableHead>{t("integrations.exact.table.exactEntry")}</TableHead>
              <TableHead>{t("integrations.exact.table.exactEntryId")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isNegative = Number(row.amount) < 0;
              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(row.pushed_at)}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={row.email || undefined}>
                    {row.email || "—"}
                  </TableCell>
                  <TableCell>{translated("sources", row.source)}</TableCell>
                  <TableCell className="whitespace-nowrap">{translated("types", row.type)}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{row.uid || "—"}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{row.invoice_uid || "—"}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[160px] truncate" title={row.transaction_id || undefined}>
                    {row.transaction_id || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[200px] truncate" title={row.your_ref || undefined}>
                    {row.your_ref || "—"}
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate" title={row.description || undefined}>
                    {row.description || "—"}
                  </TableCell>
                  <TableCell>{row.program_name || "—"}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{row.gl_account || "—"}</TableCell>
                  <TableCell
                    className={`text-right whitespace-nowrap font-medium ${
                      isNegative ? "text-red-600 dark:text-red-400" : ""
                    }`}
                  >
                    {row.amount}
                  </TableCell>
                  <TableCell>{row.currency || "—"}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{row.exact_entry_number ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs max-w-[180px] truncate" title={row.exact_entry_id || undefined}>
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
        totalRows={count}
      />
    </div>
  );
};

export default SentTable;
