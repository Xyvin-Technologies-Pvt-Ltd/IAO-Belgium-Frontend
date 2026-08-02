import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useArchivePersonInvoices } from "@/store/useArchiveStore";

const InvoicesTab = ({ personId }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [betaald, setBetaald] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { sortBy, sortOrder, handleSort, sortParams } = useTableSort("date", "desc", { setPage });

  useEffect(() => {
    setPage(1);
  }, [betaald, from, to]);

  const filterParams = useMemo(
    () => ({
      ...(betaald !== "all" ? { betaald: betaald === "true" } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...sortParams,
    }),
    [betaald, from, to, sortParams],
  );

  const { data, isLoading, error, refetch } = useArchivePersonInvoices(personId, {
    page,
    limit: rowsPerPage,
    ...filterParams,
  });
  const invoices = data?.data || [];
  const totalRows = data?.total_count || 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={betaald} onValueChange={setBetaald}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="true">Betaald (Paid)</SelectItem>
            <SelectItem value="false">Openstaand (Open)</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        <span className="text-sm text-gray-400">{totalRows} invoices</span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead sortKey="number" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Nummer <span className="opacity-60">(Number)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="date" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Datum <span className="opacity-60">(Date)</span>
            </SortableTableHead>
            <TableHead>
              Omschrijving <span className="opacity-60">(Description)</span>
            </TableHead>
            <SortableTableHead sortKey="amount" activeKey={sortBy} order={sortOrder} onSort={handleSort} align="right">
              Bedrag <span className="opacity-60">(Amount)</span>
            </SortableTableHead>
            <SortableTableHead sortKey="status" activeKey={sortBy} order={sortOrder} onSort={handleSort}>Status</SortableTableHead>
            <SortableTableHead sortKey="paid_on" activeKey={sortBy} order={sortOrder} onSort={handleSort}>
              Betaald op <span className="opacity-60">(Paid on)</span>
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
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
                <TableCell className="text-gray-500 dark:text-white/60">
                  {inv.datum ? new Date(inv.datum).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="max-w-60 truncate" title={inv.omschrijving}>
                  {inv.omschrijving || "—"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {inv.line_total != null ? `€${inv.line_total.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell>
                  <span className={inv.betaald ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {inv.betaald ? "Betaald (Paid)" : "Openstaand (Open)"}
                  </span>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-white/60">
                  {inv.datum_betaald ? new Date(inv.datum_betaald).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                No invoices found for this student.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination page={page} setPage={setPage} rowsPerPage={rowsPerPage} setRowsPerPage={setRowsPerPage} totalRows={totalRows} />
    </div>
  );
};

export default InvoicesTab;
