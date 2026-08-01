import { useNavigate } from "@tanstack/react-router";
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
import { useArchivePersonInvoices } from "@/store/useArchiveStore";

const InvoicesTab = ({ personId }) => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useArchivePersonInvoices(personId, { limit: 100 });
  const invoices = data?.data || [];

  return (
    <div className="space-y-4">
      <span className="text-sm text-gray-400">{data?.total_count ?? 0} invoices</span>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid on</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableSkeleton rows={5} columns={6} />
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
                <TableCell className="max-w-[240px] truncate" title={inv.omschrijving}>
                  {inv.omschrijving || "—"}
                </TableCell>
                <TableCell className="font-medium">{inv.line_total != null ? `€${inv.line_total.toFixed(2)}` : "—"}</TableCell>
                <TableCell>
                  <span className={inv.betaald ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                    {inv.betaald ? "Paid" : "Open"}
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
    </div>
  );
};

export default InvoicesTab;
