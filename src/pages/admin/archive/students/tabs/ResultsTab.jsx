import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useTableSort } from "@/hooks/useTableSort";
import { toast } from "sonner";
import { useArchivePersonResults } from "@/store/useArchiveStore";
import { getArchivePersonResults } from "@/api/archiveApi";
import { buildCsv, downloadCsv } from "@/utils/exportCsv";
import { buildCsvHeaders } from "../../labels/archiveLabels";

//* Grade-code semantics (PAS/MER/DIS/CRE/5Y/4Y) and the pass threshold for
//* score_absoluut have not been confirmed by IAO (Resultaatdefinitie, which
//* would label these, was never extracted from CoachView). We deliberately
//* show the raw values only — no derived pass/fail verdict.
const ResultsTab = ({ personId }) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("date", "desc", { setPage });

  useEffect(() => {
    setPage(1);
  }, [from, to]);

  const filterParams = useMemo(
    () => ({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...sortParams,
    }),
    [from, to, sortParams],
  );

  const { data, isLoading, error, refetch } = useArchivePersonResults(personId, {
    page,
    limit: rowsPerPage,
    ...filterParams,
  });
  const results = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV export...");
    try {
      const response = await getArchivePersonResults(personId, { ...filterParams, export: true });
      const rows = response?.data || [];
      if (rows.length === 0) {
        toast.error("No results to export.", { id: toastId });
        return;
      }
      const csv = buildCsv(
        buildCsvHeaders("results", ["date", "programme", "score", "code", "comment"]),
        rows,
        (r) => [r.datum, `${r.soort_code} — ${r.soort_naam}`, r.score_absoluut, r.score_code, r.opmerking || r.score_vrij],
      );
      downloadCsv(csv, "coachview_archive_results");
      toast.success("Results exported successfully!", { id: toastId });
    } catch (err) {
      toast.error(err?.message || "Failed to export results.", { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" className="w-40" placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" className="w-40" placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} />
          <span className="text-sm text-gray-400">{totalRows} results</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="date" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Datum <span className="opacity-60">(Date)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="programme" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Opleiding <span className="opacity-60">(Programme)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="score" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Resultaat <span className="opacity-60">(Score)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="code" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Resultaatcode <span className="opacity-60">(Grade code)</span>
            </SortableTableHead>
            <TableHead>
              Opmerking <span className="opacity-60">(Comment)</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={rowsPerPage} columns={5} />
          ) : error ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center p-8">
                <ErrorMessage message={error?.message || "Failed to load results"} onRetry={refetch} variant="inline" />
              </TableCell>
            </TableRow>
          ) : results.length > 0 ? (
            results.map((r) => (
              <TableRow key={r.cv_id}>
                <TableCell className="text-gray-500 dark:text-white/60">
                  {r.datum ? new Date(r.datum).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="max-w-60 truncate" title={r.soort_naam}>
                  {r.soort_code}
                </TableCell>
                <TableCell className="font-medium">{r.score_absoluut ?? "—"}</TableCell>
                <TableCell>{r.score_code || "—"}</TableCell>
                <TableCell className="max-w-80 truncate" title={r.opmerking || r.score_vrij}>
                  {r.opmerking || r.score_vrij || "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-400">
                No results recorded for this student.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />
    </div>
  );
};

export default ResultsTab;
