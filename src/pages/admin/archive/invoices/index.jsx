import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import TableSkeleton from "@/components/ui/table/TableSkeleton";
import { Pagination } from "@/components/ui/table/Pagination";
import ErrorMessage from "@/components/common/ErrorMessage";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useArchiveInvoices } from "@/store/useArchiveStore";
import { getArchiveInvoices } from "@/api/archiveApi";
import { buildCsv, downloadCsv } from "@/utils/exportCsv";
import ArchiveGate from "../components/ArchiveGate";

const ArchiveInvoices = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [betaald, setBetaald] = useState("all");
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, betaald]);

  const params = {
    page,
    limit: rowsPerPage,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(betaald !== "all" ? { betaald: betaald === "true" } : {}),
  };

  const { data, isLoading, isFetching, error, refetch } = useArchiveInvoices(params);
  const invoices = data?.data || [];
  const totalRows = data?.total_count || 0;

  const handleExport = async () => {
    const toastId = toast.loading("Preparing CSV export...");
    try {
      const response = await getArchiveInvoices({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(betaald !== "all" ? { betaald: betaald === "true" } : {}),
        export: true,
      });
      const rows = response?.data || [];
      if (rows.length === 0) {
        toast.error("No invoices to export matching applied filters.", { id: toastId });
        return;
      }
      const csv = buildCsv(
        ["Number", "Person", "Date", "Amount", "Status", "Paid on", "Description"],
        rows,
        (r) => [r.nummer, r.person_name, r.datum, r.line_total, r.betaald ? "Paid" : "Open", r.datum_betaald, r.omschrijving],
      );
      downloadCsv(csv, "coachview_archive_invoices");
      toast.success("Invoices exported successfully!", { id: toastId });
    } catch (err) {
      toast.error(err?.message || "Failed to export invoices.", { id: toastId });
    }
  };

  return (
    <ArchiveGate>
      <div className="space-y-6 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-dashboard-text dark:text-white">
              Facturen <span className="text-sm font-normal text-gray-400">(Invoices — CoachView archive)</span>
            </h2>
            <p className="text-sm text-gray-500 dark:text-white/60">
              "Open" reflects the payment status as of the snapshot date, not necessarily today.
            </p>
          </div>
          <Button onClick={handleExport} className="flex items-center gap-2 self-start sm:self-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by invoice number or student name..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={betaald} onValueChange={setBetaald}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="true">Paid</SelectItem>
              <SelectItem value="false">Open</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching ? "opacity-50 pointer-events-none" : ""}>
            {isLoading ? (
              <TableSkeleton rows={rowsPerPage} columns={6} />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8">
                  <ErrorMessage message={error?.message || "Failed to load invoices"} onRetry={refetch} variant="inline" />
                </TableCell>
              </TableRow>
            ) : invoices.length > 0 ? (
              invoices.map((inv) => (
                <TableRow
                  key={inv.cv_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate({ to: "/admin/archive/invoices/$id", params: { id: inv.cv_id } })}
                >
                  <TableCell className="font-medium">{inv.nummer}</TableCell>
                  <TableCell>{inv.person_name || "—"}</TableCell>
                  <TableCell className="text-gray-500 dark:text-white/60">
                    {inv.datum ? new Date(inv.datum).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="font-medium">{inv.line_total != null ? `€${inv.line_total.toFixed(2)}` : "—"}</TableCell>
                  <TableCell>
                    <span className={inv.betaald ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                      {inv.betaald ? "Paid" : "Open"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate" title={inv.omschrijving}>
                    {inv.omschrijving || "—"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />
      </div>
    </ArchiveGate>
  );
};

export default ArchiveInvoices;
