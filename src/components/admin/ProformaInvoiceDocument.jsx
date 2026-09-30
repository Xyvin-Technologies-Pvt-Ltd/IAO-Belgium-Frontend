import React from "react";
import { CheckCircle, ShieldCheck } from "lucide-react";
import moment from "moment";
import {
  InvoicePrintHeader,
  InvoicePrintFooter,
} from "@/components/admin/invoice-print/InvoicePrintBrand";

function teacherDisplayName(teacher = {}) {
  if (teacher.full_name || teacher.name) return teacher.full_name || teacher.name;
  const parts = [teacher.first_name, teacher.last_name].filter(Boolean);
  return parts.length ? parts.join(" ") : "Lecturer";
}

function teacherFullAddress(teacher = {}) {
  return [teacher.address, teacher.postal_code, teacher.city, teacher.country]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean)
    .join(", ");
}

function courseName(planning = {}) {
  return (
    planning?.component?.program?.name ||
    planning?.batch?.intake?.program?.name ||
    planning?.description ||
    planning?.venue ||
    "Course"
  );
}

function programmeType(planning = {}) {
  return planning?.component?.program?.type || planning?.batch?.intake?.program?.type || "—";
}

function itemLabel(item) {
  if (item.item_type === "TEACHING") return "Teaching fee";
  if (item.item_type === "TRAVEL") {
    const mode = (item.travel_mode || "ROAD").toLowerCase();
    return `Travel (${mode})`;
  }
  if (item.item_type === "FOOD") return "Meal allowance";
  if (item.item_type === "STAY") return "Accommodation";
  return item.description || "Miscellaneous";
}

function itemCalculation(item) {
  if (item.calculation_breakdown) return item.calculation_breakdown;
  if (item.item_type === "TEACHING") {
    const blocks = item.blocks || item.multiplier || 1;
    return `${blocks} blocks × €${Number(item.unit_rate || 0).toFixed(2)}`;
  }
  if (item.item_type === "TRAVEL") {
    const mode = String(item.travel_mode || "ROAD").toUpperCase();
    if (mode === "RAIL" || mode === "FLIGHT") {
      return `Actual cost · €${Number(item.unit_rate || item.line_total || 0).toFixed(2)}`;
    }
    const km =
      item.road_one_way_km != null && item.road_multiplier != null
        ? Number(item.road_one_way_km) * Number(item.road_multiplier)
        : item.distance_km || item.multiplier || 0;
    const rate = item.road_rate_per_km != null ? item.road_rate_per_km : item.unit_rate;
    return `${km} km × €${Number(rate || 0).toFixed(4)}`;
  }
  return `${item.multiplier || 1} × €${Number(item.unit_rate || 0).toFixed(2)}`;
}

function itemSource(item) {
  if (item.blocks_source) return item.blocks_source;
  if (item.origin_address || item.destination_address) {
    return [item.origin_address, item.destination_address].filter(Boolean).join(" — ");
  }
  if (item.teacher_role_name) return `Role: ${item.teacher_role_name}`;
  return item.description || "";
}

function statusLabel(status) {
  if (!status) return "Draft";
  return String(status).replace(/_/g, " ");
}

/** Shared printable body used by modal and dedicated print tab. */
export function ProformaInvoiceDocument({ proforma }) {
  if (!proforma) return null;

  const teacher = proforma.teacher_id || {};
  const planning = proforma.planning_id || {};
  const items = (proforma.items || []).filter(
    (i) => Number(i.line_total || 0) > 0 || Number(i.unit_rate || 0) > 0
  );
  const signature = proforma.digital_signature || {};
  const roleName =
    teacher.teacher_role?.name || items.find((i) => i.teacher_role_name)?.teacher_role_name || "—";
  const sessionDates = [
    ...new Set(
      items
        .map((i) => (i.session_date ? moment(i.session_date).format("DD MMM YYYY") : null))
        .filter(Boolean)
    ),
  ];
  const internalRef = String(proforma._id || "").slice(-8).toUpperCase() || "—";
  const approvedForFinance =
    proforma.status === "MOVED_TO_FINANCE" || proforma.status === "PAID";

  return (
    <div
      id="printable-proforma-invoice"
      className="bg-white text-[#1a202c] print:p-0"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 13, lineHeight: 1.5 }}
    >
      {/* {{> header}} — same as email/invoice partials/header.hbs */}
      <InvoicePrintHeader />

      <div className="px-9 sm:px-10 print:px-10 pb-4 pt-2">
        <div className="mb-7 rounded-[14px] px-7 py-5" style={{ background: "#F2F5F9" }}>
          <div className="flex flex-col md:flex-row md:justify-between gap-6">
            <div className="md:w-1/2">
              <p className="m-0 mb-3.5 text-2xl font-bold text-black">Pro-forma Invoice</p>
              <p className="m-0 mb-1 text-[11px] uppercase tracking-wide text-[#6b7280]">Issued By</p>
              <p className="m-0 mb-1 text-sm font-bold text-[#0f172a]">
                The International Academy of Osteopathy
              </p>
              <p className="m-0 text-xs text-[#6b7280] leading-relaxed">
                IAO VZW, Bollebergen 2B, Bus 15, 9052 Ghent (Zwijnaarde), Belgium
                <br />
                info@osteopathy.eu
              </p>
            </div>
            <div className="md:w-1/2 md:text-right">
              <div className="inline-block md:ml-auto text-left">
                <div className="flex justify-between gap-4 mb-2">
                  <span className="text-[11px] text-[#6b7280]">Pro-forma No.</span>
                  <span className="text-sm font-bold text-[#0f172a]">{proforma.proforma_number}</span>
                </div>
                <div className="flex justify-between gap-4 mb-2">
                  <span className="text-[11px] text-[#6b7280]">Date</span>
                  <span className="text-[13px] text-[#0f172a]">
                    {moment(proforma.createdAt).format("DD MMMM YYYY")}
                  </span>
                </div>
                <div className="flex justify-between gap-4 mb-2">
                  <span className="text-[11px] text-[#6b7280]">Internal Ref.</span>
                  <span className="text-[13px] text-[#0f172a]">{internalRef}</span>
                </div>
                <div className="flex justify-between gap-4 items-center mt-3">
                  <span className="text-[11px] text-[#6b7280]">Status</span>
                  <span
                    className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full"
                    style={{
                      background: approvedForFinance ? "#e6f4ea" : "#eef2f7",
                      color: approvedForFinance ? "#137333" : "#374151",
                    }}
                  >
                    {statusLabel(proforma.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <p className="m-0 mb-1 text-[11px] uppercase tracking-wide text-[#6b7280]">Lecturer</p>
            <p className="m-0 mb-0.5 text-sm font-bold text-[#0f172a]">{teacherDisplayName(teacher)}</p>
            <p className="m-0 text-xs text-[#6b7280]">{teacher.email || "—"}</p>
            <p className="m-0 mt-1 text-xs text-[#6b7280] whitespace-pre-line">
              {teacherFullAddress(teacher) || "—"}
            </p>
            <p className="m-0 mt-2 text-xs text-[#6b7280]">
              Role: <span className="text-[#374151] font-semibold">{roleName}</span>
            </p>
          </div>
          <div>
            <p className="m-0 mb-1 text-[11px] uppercase tracking-wide text-[#6b7280]">Course</p>
            <p className="m-0 mb-0.5 text-sm font-bold text-[#0f172a]">{courseName(planning)}</p>
            <p className="m-0 text-xs text-[#6b7280]">
              Programme: <span className="text-[#374151]">{programmeType(planning)}</span>
            </p>
            <p className="m-0 text-xs text-[#6b7280]">
              Venue: <span className="text-[#374151]">{planning.venue || "—"}</span>
            </p>
            {planning.venue_address && (
              <p className="m-0 text-xs text-[#6b7280]">{planning.venue_address}</p>
            )}
            {sessionDates.length > 0 && (
              <p className="m-0 mt-1 text-xs text-[#6b7280]">
                Dates: <span className="text-[#374151]">{sessionDates.join(", ")}</span>
              </p>
            )}
            <p className="m-0 mt-1 text-xs text-[#6b7280]">
              Region:{" "}
              <span className="text-[#374151]">{proforma.region_snapshot_name || "—"}</span>
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <p className="m-0 text-sm font-bold text-[#0f172a]">Items</p>
            <p className="m-0 text-[11px] uppercase tracking-wide text-[#6b7280]">Amount</p>
          </div>
          <div className="border-t-2 border-[#1a202c]" />
          <table className="w-full border-collapse">
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id || idx}>
                  <td className="py-3.5 pr-4 align-top">
                    <p className="m-0 text-[13px] font-semibold text-[#0f172a]">{itemLabel(item)}</p>
                    <p className="m-0 mt-0.5 text-[13px] text-[#374151]">{itemCalculation(item)}</p>
                    {itemSource(item) ? (
                      <p className="m-0 mt-0.5 text-[11px] text-[#6b7280]">{itemSource(item)}</p>
                    ) : null}
                  </td>
                  <td className="py-3.5 text-right align-top whitespace-nowrap text-[13px] text-[#374151] font-medium">
                    €{Number(item.line_total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#e5e7eb] mt-1" />
        </div>

        <div className="flex justify-end mb-10">
          <div
            className="w-full max-w-[280px] rounded-xl flex justify-between items-center px-[18px] py-3.5"
            style={{ background: "#F2F5F9" }}
          >
            <span className="text-[13px] font-bold text-[#374151]">Total</span>
            <span className="text-xl font-bold text-[#0f172a] whitespace-nowrap">
              €{Number(proforma.grand_total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t border-[#e5e7eb] pt-6 mb-6">
          <p className="m-0 mb-2 text-[11px] uppercase tracking-wide text-[#6b7280]">Signature</p>
          {signature.is_signed ? (
            <div>
              <p
                className="m-0 text-base italic font-bold text-[#0f172a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {signature.signed_by_name}
              </p>
              <p className="m-0 mt-1 text-[11px] font-medium text-[#137333] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Electronically signed on {moment(signature.signed_at).format("DD MMM YYYY, HH:mm")}
              </p>
            </div>
          ) : (
            <p className="m-0 text-xs italic text-amber-700">Signature pending</p>
          )}
          {approvedForFinance && (
            <p className="m-0 mt-3 text-[11px] text-[#6b7280] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Approved for finance
              {proforma.updatedAt ? ` · ${moment(proforma.updatedAt).format("DD MMM YYYY")}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* {{> footer}} — same as email/invoice partials/footer.hbs */}
      <InvoicePrintFooter />
    </div>
  );
}

/**
 * Opens the system print dialog so the user can Save as PDF.
 * Call this on the print page (or any page that already renders #printable-proforma-invoice
 * with app styles) — prefers native print so Tailwind/print CSS stay intact.
 */
export function printProformaInvoicePdf(_proforma) {
  if (typeof window === "undefined") return false;
  const el = document.getElementById("printable-proforma-invoice");
  if (!el) return false;
  window.print();
  return true;
}

/** @deprecated Use printProformaInvoicePdf */
export function downloadProformaInvoiceHtml(proforma) {
  return printProformaInvoicePdf(proforma);
}

export function openProformaInvoiceTab(id) {
  if (!id) return;
  window.open(`/admin/proforma-invoices/${id}/print`, "_blank", "noopener,noreferrer");
}

export default ProformaInvoiceDocument;
