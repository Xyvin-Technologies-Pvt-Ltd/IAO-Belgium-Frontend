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
import SortableTableHead from "@/components/ui/table/SortableTableHead";
import { useClientTableSort } from "@/hooks/useClientTableSort";
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

const LINE_ACCESSORS = {
  description: (l) => l.naam,
  qty: (l) => l.aantal,
  unit_price: (l) => l.stuksprijs,
  amount: (l) => l.bedrag,
  vat: (l) => l.btw_percentage,
};

const Content = ({ data, navigate }) => {
  const { invoice, lines } = data;
  const lineSort = useClientTableSort(lines, { defaultKey: "description", accessors: LINE_ACCESSORS });

  return (
    <div className="space-y-6 mt-4">
      <div className="rounded-xl border border-sidebar-border bg-sidebar p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-dashboard-text dark:text-white">Factuur {invoice.nummer}</h2>
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
            {invoice.betaald ? "Betaald (Paid)" : "Openstaand (Open)"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Datum (Date)</p>
            <p>{invoice.datum ? new Date(invoice.datum).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Betaald op (Paid on)</p>
            <p>{invoice.datum_betaald ? new Date(invoice.datum_betaald).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Totaal uit regels (Total from lines)</p>
            <p className="font-semibold">{invoice.line_total != null ? `€${invoice.line_total.toFixed(2)}` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Omschrijving (Description)</p>
            <p>{invoice.omschrijving || "—"}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-dashboard-text dark:text-white">
          Factuurregels <span className="font-normal text-gray-400">(Lines — {lines.length})</span>
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="description" activeKey={lineSort.sortBy} order={lineSort.sortOrder} onSort={lineSort.handleSort}>
                Omschrijving <span className="opacity-60">(Description)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="qty" activeKey={lineSort.sortBy} order={lineSort.sortOrder} onSort={lineSort.handleSort} align="right">
                Aantal <span className="opacity-60">(Qty)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="unit_price" activeKey={lineSort.sortBy} order={lineSort.sortOrder} onSort={lineSort.handleSort} align="right">
                Stuksprijs <span className="opacity-60">(Unit price)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="amount" activeKey={lineSort.sortBy} order={lineSort.sortOrder} onSort={lineSort.handleSort} align="right">
                Bedrag <span className="opacity-60">(Amount)</span>
              </SortableTableHead>
              <SortableTableHead sortKey="vat" activeKey={lineSort.sortBy} order={lineSort.sortOrder} onSort={lineSort.handleSort} align="right">
                Btw <span className="opacity-60">(VAT)</span>
              </SortableTableHead>
              <TableHead>
                Gekoppelde opleidingsvraag <span className="opacity-60">(Linked enrolment)</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineSort.sorted.length > 0 ? (
              lineSort.sorted.map((line) => (
                <TableRow key={line.cv_id}>
                  <TableCell className="max-w-65 truncate" title={line.naam}>
                    {line.naam || "—"}
                  </TableCell>
                  <TableCell className="text-right">{line.aantal ?? "—"}</TableCell>
                  <TableCell className="text-right">{line.stuksprijs != null ? `€${Number(line.stuksprijs).toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{line.bedrag != null ? `€${Number(line.bedrag).toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-right">{line.btw_percentage != null ? `${line.btw_percentage}%` : "—"}</TableCell>
                  <TableCell>
                    {line.enrolment ? (
                      <span className="text-xs">
                        {line.enrolment.soort_code}
                        <span className="ml-1 text-gray-400">({line.enrolment.soort_naam})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Niet gekoppeld (Not linked)</span>
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
