import { Download } from "lucide-react";
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
import { toast } from "sonner";
import { useArchivePersonResults } from "@/store/useArchiveStore";
import { getArchivePersonResults } from "@/api/archiveApi";
import { buildCsv, downloadCsv } from "@/utils/exportCsv";

//* Grade-code semantics (PAS/MER/DIS/CRE/5Y/4Y) and the pass threshold for
//* score_absoluut have not been confirmed by IAO (Resultaatdefinitie, which
//* would label these, was never extracted from CoachView). We deliberately
//* show the raw values only — no derived pass/fail verdict.
const ResultsTab = ({ personId }) => {
  const { data, isLoading, error, refetch } = useArchivePersonResults(personId, { limit: 100 });
  const results = data?.data || [];

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV export...");
    try {
      const response = await getArchivePersonResults(personId, { export: true });
      const rows = response?.data || [];
      if (rows.length === 0) {
        toast.error("No results to export.", { id: toastId });
        return;
      }
      const csv = buildCsv(
        ["Date", "Programme", "Score", "Grade code", "Comment"],
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
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{data?.total_count ?? 0} results</span>
        <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Programme</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Grade code</TableHead>
            <TableHead>Comment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={5} columns={5} />
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
                <TableCell className="max-w-[240px] truncate" title={r.soort_naam}>
                  {r.soort_code}
                </TableCell>
                <TableCell className="font-medium">{r.score_absoluut ?? "—"}</TableCell>
                <TableCell>{r.score_code || "—"}</TableCell>
                <TableCell className="max-w-[320px] truncate" title={r.opmerking || r.score_vrij}>
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
    </div>
  );
};

export default ResultsTab;
