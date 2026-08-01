import { useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useBreadcrumb } from "@/context/BreadCrumbContext";
import LoadingState from "@/components/common/LoadingState";
import ErrorMessage from "@/components/common/ErrorMessage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import { useArchiveInvoice } from "@/store/useArchiveStore";
import ArchiveGate from "../components/ArchiveGate";

const InvoiceDetail = () => {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const id = params.id;
  const { updateBreadcrumbs } = useBreadcrumb();
  const { data, isLoading, error, refetch } = useArchiveInvoice(id);

  useEffect(() => {
    if (data?.data) {
      updateBreadcrumbs([
        { label: "CoachView Archive", path: "/admin/archive/invoices", navigable: true },
        { label: "Invoices", path: "/admin/archive/invoices", navigable: true },
        { label: data.data.invoice.nummer, path: "/admin/archive/invoices", navigable: false },
      ]);
    }
    return () => updateBreadcrumbs([]);
  }, [data?.data, id]);

  return (
    <ArchiveGate>
      {isLoading ? (
        <LoadingState text="Loading invoice..." fullHeight />
      ) : error ? (
        <div className="p-6">
          <ErrorMessage message={error?.message || "Failed to load invoice"} onRetry={refetch} variant="card" />
        </div>
      ) : !data?.data ? null : (
        <Content data={data.data} navigate={navigate} />
      )}
    </ArchiveGate>
  );
};

const Content = ({ data, navigate }) => {
  const { invoice, lines } = data;
  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-dashboard-text dark:text-white">Invoice {invoice.nummer}</h2>
            <p
              className="text-sm text-gray-500 dark:text-white/60 cursor-pointer hover:underline"
              onClick={() =>
                invoice.persoon_id &&
                navigate({ to: "/admin/archive/students/$id", params: { id: invoice.persoon_id } })
              }
            >
              {invoice.person_name || "Unknown person"} {invoice.person_email && `· ${invoice.person_email}`}
            </p>
          </div>
          <span className={invoice.betaald ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
            {invoice.betaald ? "Paid" : "Open"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Date</p>
            <p>{invoice.datum ? new Date(invoice.datum).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Paid on</p>
            <p>{invoice.datum_betaald ? new Date(invoice.datum_betaald).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total (from lines)</p>
            <p className="font-semibold">{invoice.line_total != null ? `€${invoice.line_total.toFixed(2)}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Description</p>
            <p>{invoice.omschrijving || "—"}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
          Lines <span className="font-normal text-gray-400">({lines.length})</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>VAT</TableHead>
              <TableHead>Linked enrolment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length > 0 ? (
              lines.map((line) => (
                <TableRow key={line.cv_id}>
                  <TableCell className="max-w-[260px] truncate" title={line.naam}>
                    {line.naam || "—"}
                  </TableCell>
                  <TableCell>{line.aantal ?? "—"}</TableCell>
                  <TableCell>{line.stuksprijs != null ? `€${Number(line.stuksprijs).toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="font-medium">{line.bedrag != null ? `€${Number(line.bedrag).toFixed(2)}` : "—"}</TableCell>
                  <TableCell>{line.btw_percentage != null ? `${line.btw_percentage}%` : "—"}</TableCell>
                  <TableCell>
                    {line.enrolment ? (
                      <span className="text-xs">
                        {line.enrolment.soort_code}
                        <span className="ml-1 text-gray-400">({line.enrolment.soort_naam})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Not linked</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-400">
                  No line items on this invoice.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default InvoiceDetail;
