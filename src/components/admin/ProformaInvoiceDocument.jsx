import React from "react";
import { CheckCircle, ShieldCheck } from "lucide-react";
import moment from "moment";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import {
  InvoicePrintHeader,
  InvoicePrintFooter,
} from "@/components/admin/invoice-print/InvoicePrintBrand";
import { proformaTeacherName } from "@/utils/proformaCourseLabel";
import {
  localizedItemLabel,
  proformaInvoiceLabels,
  resolveProformaInvoiceLocale,
} from "@/utils/proformaInvoiceLocale";

function teacherDisplayName(teacher = {}, fallback = "Lecturer") {
  return proformaTeacherName(teacher, fallback);
}

function teacherFullAddress(teacher = {}) {
  return [teacher.address, teacher.postal_code, teacher.city, teacher.country]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean)
    .join(", ");
}

function programName(planning = {}, courseMeta = {}) {
  return (
    courseMeta?.program_name ||
    planning?.component?.program?.name ||
    planning?.batch?.intake?.program?.name ||
    null
  );
}

function moduleName(planning = {}, courseMeta = {}) {
  return (
    courseMeta?.module_name ||
    planning?.component?.name ||
    planning?.description ||
    null
  );
}

function itemCalculation(item) {
  if (item.item_type === "TEACHING") {
    const blocks = Number(item.blocks || item.multiplier || 0) || 1;
    const lineTotal = Number(item.line_total || 0);
    let rate = Number(item.unit_rate || 0);
    if (blocks > 0 && lineTotal > 0) {
      const implied = Math.round((lineTotal / blocks) * 100) / 100;
      const fromRate = Math.round(blocks * rate * 100) / 100;
      if (Math.abs(fromRate - lineTotal) > 0.02) {
        rate = implied;
      }
    }
    return `${blocks} blocks × €${rate.toFixed(2)}`;
  }
  if (item.calculation_breakdown) {
    const lineTotal = Number(item.line_total || 0);
    if (lineTotal <= 0) return item.calculation_breakdown;
    const match = item.calculation_breakdown.match(/€\s*([\d.,]+)\s*$/);
    if (match) {
      const shown = parseFloat(String(match[1]).replace(",", "."));
      if (!Number.isNaN(shown) && Math.abs(shown - lineTotal) > 0.05) {
        // fall through
      } else {
        return item.calculation_breakdown;
      }
    } else {
      return item.calculation_breakdown;
    }
  }
  if (item.item_type === "TRAVEL") {
    const mode = String(item.travel_mode || "ROAD").toUpperCase();
    if (mode === "FIXED") {
      return `1 module × €${Number(item.line_total || item.unit_rate || 0).toFixed(2)}`;
    }
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
  if (item.item_type === "TEACHING") {
    if (item.teacher_role_name) return `Role: ${item.teacher_role_name}`;
    return "";
  }
  if (item.origin_address || item.destination_address) {
    return [item.origin_address, item.destination_address].filter(Boolean).join(" — ");
  }
  if (item.item_type === "TRAVEL" && item.blocks_source) return item.blocks_source;
  if (item.teacher_role_name) return `Role: ${item.teacher_role_name}`;
  return "";
}

function resolvePartyDisplay(proforma, previewParty) {
  const teacher = proforma.teacher_id || {};
  const signature = proforma.digital_signature || {};
  const party =
    previewParty ||
    signature.invoice_party ||
    {};
  const useDifferent = Boolean(party.use_different_details);

  const additionalInfo1 = String(party.additional_info_1 || "").trim() || null;
  const additionalInfo2 = String(party.additional_info_2 || "").trim() || null;

  if (useDifferent) {
    return {
      useDifferent: true,
      primaryName: party.company_name || "—",
      contactName: party.contact_person_name || signature.signed_by_name || null,
      email: teacher.email || null,
      address: party.address || "—",
      additionalInfo1,
      additionalInfo2,
      bank:
        previewParty?.bank_account_number ||
        signature.bank_account_number ||
        teacher.IBAN ||
        null,
      signedByName: party.contact_person_name || signature.signed_by_name || null,
    };
  }

  return {
    useDifferent: false,
    primaryName: teacherDisplayName(teacher, "—"),
    contactName: null,
    email: teacher.email || null,
    address: teacherFullAddress(teacher) || "—",
    additionalInfo1: null,
    additionalInfo2: null,
    bank:
      previewParty?.bank_account_number ||
      signature.bank_account_number ||
      teacher.IBAN ||
      null,
    signedByName: signature.signed_by_name || null,
  };
}

/** Shared printable body used by modal and dedicated print tab. */
export function ProformaInvoiceDocument({ proforma, previewParty = null }) {
  if (!proforma) return null;

  const teacher = proforma.teacher_id || {};
  const planning = proforma.planning_id || {};
  const courseMeta = proforma.course_meta || {};
  const locale = resolveProformaInvoiceLocale(proforma);
  const t = proformaInvoiceLabels(locale);
  const programLabel = programName(planning, courseMeta) || "—";
  const moduleLabel = moduleName(planning, courseMeta) || "—";
  const items = (proforma.items || []).filter((i) => Number(i.line_total || 0) > 0);
  const signature = proforma.digital_signature || {};
  const party = resolvePartyDisplay(proforma, previewParty);
  const roleName =
    teacher.teacher_role?.name || items.find((i) => i.teacher_role_name)?.teacher_role_name || "—";
  const sessionDates = [
    ...new Set(
      items
        .map((i) => (i.session_date ? moment(i.session_date).format("DD MMM YYYY") : null))
        .filter(Boolean)
    ),
  ];
  const approvedForFinance =
    proforma.status === "MOVED_TO_FINANCE" || proforma.status === "PAID";
  const showSigned = Boolean(signature.is_signed) && !previewParty?.forceUnsigned;
  const previewSignedName = previewParty?.signed_by_name || party.signedByName;

  return (
    <div
      id="printable-proforma-invoice"
      className="bg-white text-[#1a202c] print:p-0 w-full"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 12,
        lineHeight: 1.45,
        boxSizing: "border-box",
      }}
    >
      <InvoicePrintHeader />

      <div className="px-7 pb-3 pt-1">
        <div className="mb-5 rounded-[12px] px-5 py-4" style={{ background: "#F2F5F9" }}>
          <div className="flex flex-row justify-between gap-5">
            <div className="w-1/2 min-w-0">
              <p className="m-0 mb-2 text-lg font-bold text-black" style={{ fontSize: 18 }}>
                {t.title}
              </p>
              <p className="m-0 mb-1 text-[10px] uppercase tracking-wide text-[#6b7280]">{t.issuedBy}</p>
              <p className="m-0 mb-1 text-[13px] font-bold text-[#0f172a]">
                The International Academy of Osteopathy
              </p>
              <p className="m-0 text-[11px] text-[#6b7280] leading-relaxed">
                IAO VZW, Bollebergen 2B, Bus 15, 9052 Ghent (Zwijnaarde), Belgium
                <br />
                info@osteopathy.eu
              </p>
            </div>
            <div className="w-1/2 text-right min-w-0">
              <div className="inline-block ml-auto text-left">
                <div className="flex justify-between gap-4 mb-1.5">
                  <span className="text-[10px] text-[#6b7280]">{t.proformaNo}</span>
                  <span className="text-[13px] font-bold text-[#0f172a]">{proforma.proforma_number}</span>
                </div>
                <div className="flex justify-between gap-4 mb-1.5">
                  <span className="text-[10px] text-[#6b7280]">{t.date}</span>
                  <span className="text-[12px] text-[#0f172a]">
                    {moment(proforma.createdAt).format("DD MMMM YYYY")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="min-w-0">
            <p className="m-0 mb-1 text-[10px] uppercase tracking-wide text-[#6b7280]">{t.lecturer}</p>
            <p className="m-0 mb-0.5 text-[13px] font-bold text-[#0f172a]">{party.primaryName}</p>
            {party.useDifferent && party.contactName && (
              <p className="m-0 text-[11px] text-[#6b7280]">
                {t.contact}: <span className="text-[#374151] font-semibold">{party.contactName}</span>
              </p>
            )}
            {party.email && <p className="m-0 text-[11px] text-[#6b7280]">{party.email}</p>}
            <p className="m-0 mt-1 text-[11px] text-[#6b7280] whitespace-pre-line">
              {party.address || "—"}
            </p>
            <p className="m-0 mt-1.5 text-[11px] text-[#6b7280]">
              {t.role}: <span className="text-[#374151] font-semibold">{roleName}</span>
            </p>
            {party.bank && (
              <p className="m-0 mt-1 text-[11px] text-[#6b7280]">
                {t.bankAccount}:{" "}
                <span className="text-[#374151] font-semibold font-mono">{party.bank}</span>
              </p>
            )}
            {party.additionalInfo1 && (
              <p className="m-0 mt-1 text-[11px] text-[#6b7280]">
                {t.additionalInfo1}:{" "}
                <span className="text-[#374151] font-semibold">{party.additionalInfo1}</span>
              </p>
            )}
            {party.additionalInfo2 && (
              <p className="m-0 mt-1 text-[11px] text-[#6b7280]">
                {t.additionalInfo2}:{" "}
                <span className="text-[#374151] font-semibold">{party.additionalInfo2}</span>
              </p>
            )}
          </div>
          <div className="min-w-0">
            <p className="m-0 mb-1 text-[10px] uppercase tracking-wide text-[#6b7280]">{t.program}</p>
            <p className="m-0 mb-0.5 text-[13px] font-bold text-[#0f172a]">{programLabel}</p>
            <p className="m-0 text-[11px] text-[#6b7280]">
              {t.module}: <span className="text-[#374151]">{moduleLabel}</span>
            </p>
            <p className="m-0 text-[11px] text-[#6b7280]">
              {t.venue}:{" "}
              <span className="text-[#374151]">{planning.venue || courseMeta.venue || "—"}</span>
            </p>
            {(planning.venue_address || courseMeta.venue_address) && (
              <p className="m-0 text-[11px] text-[#6b7280]">
                {planning.venue_address || courseMeta.venue_address}
              </p>
            )}
            {sessionDates.length > 0 && (
              <p className="m-0 mt-1 text-[11px] text-[#6b7280]">
                {t.dates}: <span className="text-[#374151]">{sessionDates.join(", ")}</span>
              </p>
            )}
            <p className="m-0 mt-1 text-[11px] text-[#6b7280]">
              {t.region}:{" "}
              <span className="text-[#374151]">{proforma.region_snapshot_name || "—"}</span>
            </p>
          </div>
        </div>

        <div className="mb-5">
          <div className="flex justify-between items-end mb-1.5">
            <p className="m-0 text-[13px] font-bold text-[#0f172a]">{t.items}</p>
            <p className="m-0 text-[10px] uppercase tracking-wide text-[#6b7280]">{t.amount}</p>
          </div>
          <div className="border-t-2 border-[#1a202c]" />
          <table className="w-full border-collapse">
            <tbody>
              {items.map((item, idx) => (
                <tr key={item._id || idx}>
                  <td className="py-2.5 pr-3 align-top">
                    <p className="m-0 text-[12px] font-semibold text-[#0f172a]">
                      {localizedItemLabel(item, t)}
                    </p>
                    <p className="m-0 mt-0.5 text-[12px] text-[#374151]">{itemCalculation(item)}</p>
                    {itemSource(item) ? (
                      <p className="m-0 mt-0.5 text-[10px] text-[#6b7280]">{itemSource(item)}</p>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-right align-top whitespace-nowrap text-[12px] text-[#374151] font-medium">
                    €{Number(item.line_total || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-[#e5e7eb] mt-1" />
        </div>

        <div className="flex justify-end mb-7">
          <div
            className="w-full max-w-[240px] rounded-lg flex justify-between items-center px-4 py-2.5"
            style={{ background: "#F2F5F9" }}
          >
            <span className="text-[12px] font-bold text-[#374151]">{t.total}</span>
            <span className="text-[16px] font-bold text-[#0f172a] whitespace-nowrap">
              €{Number(proforma.grand_total || 0).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="border-t border-[#e5e7eb] pt-4 mb-4">
          <p className="m-0 mb-1.5 text-[10px] uppercase tracking-wide text-[#6b7280]">{t.signature}</p>
          {showSigned ? (
            <div>
              <p
                className="m-0 text-[14px] italic font-bold text-[#0f172a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {signature.signed_by_name || previewSignedName}
              </p>
              {(signature.bank_account_number || party.bank) && (
                <p className="m-0 mt-1 text-[11px] font-mono text-[#374151]">
                  {t.bankAccount}: {signature.bank_account_number || party.bank}
                </p>
              )}
              <p className="m-0 mt-1 text-[10px] font-medium text-[#137333] flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                {t.signedOn} {moment(signature.signed_at).format("DD MMM YYYY, HH:mm")}
              </p>
            </div>
          ) : (
            <p className="m-0 text-[11px] italic text-amber-700">{t.signaturePending}</p>
          )}
          {approvedForFinance && (
            <p className="m-0 mt-2 text-[10px] text-[#6b7280] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {t.approvedForFinance}
              {proforma.updatedAt ? ` · ${moment(proforma.updatedAt).format("DD MMM YYYY")}` : ""}
            </p>
          )}
        </div>
      </div>

      <InvoicePrintFooter />
    </div>
  );
}

/**
 * Opens the system print dialog so the user can Save as PDF.
 */
export function printProformaInvoicePdf(_proforma) {
  if (typeof window === "undefined") return false;
  const el = document.getElementById("printable-proforma-invoice");
  if (!el) return false;
  window.print();
  return true;
}

/**
 * Slice a tall canvas into A4 pages without cutting through the brand footer,
 * and without leaving a black gap at the page break.
 */
function addCanvasPagesToPdf(pdf, canvas, sourceEl, marginMm = 8) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginMm * 2;
  const contentHeight = pageHeight - marginMm * 2;
  const pxPerMm = canvas.width / contentWidth;
  const pageHeightPx = Math.floor(contentHeight * pxPerMm);

  const footerEl = sourceEl.querySelector("[data-invoice-footer='true']");
  let avoidFrom = null;
  let avoidTo = null;
  if (footerEl) {
    const rootRect = sourceEl.getBoundingClientRect();
    const footerRect = footerEl.getBoundingClientRect();
    const scaleY = canvas.height / Math.max(sourceEl.offsetHeight, 1);
    avoidFrom = Math.max(0, Math.floor((footerRect.top - rootRect.top) * scaleY));
    avoidTo = Math.min(
      canvas.height,
      Math.ceil((footerRect.bottom - rootRect.top) * scaleY)
    );
  }

  const breaks = [];
  let y = 0;
  while (y < canvas.height - 1) {
    let end = Math.min(y + pageHeightPx, canvas.height);
    // Keep footer on one page — don't slice through it
    if (
      avoidFrom != null &&
      avoidTo != null &&
      end > avoidFrom &&
      end < avoidTo
    ) {
      if (avoidFrom > y + 24) {
        end = avoidFrom;
      } else {
        end = Math.min(avoidTo, canvas.height);
      }
    }
    if (end <= y) end = Math.min(y + pageHeightPx, canvas.height);
    breaks.push([y, end]);
    y = end;
  }

  breaks.forEach(([startY, endY], index) => {
    if (index > 0) pdf.addPage();
    const sliceH = Math.max(1, endY - startY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(
      canvas,
      0,
      startY,
      canvas.width,
      sliceH,
      0,
      0,
      canvas.width,
      sliceH
    );
    const sliceMm = sliceH / pxPerMm;
    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.98),
      "JPEG",
      marginMm,
      marginMm,
      contentWidth,
      sliceMm
    );
  });
}

/** A4 width at 96dpi — keep PDF scale independent of dialog/viewport width. */
const A4_CAPTURE_WIDTH_PX = 794;

/**
 * Direct .pdf download of the invoice at a fixed A4 layout width.
 * Uses html2canvas-pro (oklch/Tailwind v4 safe) + jsPDF.
 */
export async function downloadProformaInvoicePdf(proforma) {
  if (typeof window === "undefined") return false;
  const el = document.getElementById("printable-proforma-invoice");
  if (!el) return false;

  const filename = `${proforma?.proforma_number || "proforma-invoice"}.pdf`;
  const host = document.createElement("div");
  host.setAttribute("data-proforma-pdf-host", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${A4_CAPTURE_WIDTH_PX}px`,
    background: "#ffffff",
    pointerEvents: "none",
    zIndex: "-1",
  });

  const clone = el.cloneNode(true);
  clone.removeAttribute("id");
  clone.setAttribute("data-proforma-pdf-clone", "true");
  Object.assign(clone.style, {
    width: `${A4_CAPTURE_WIDTH_PX}px`,
    maxWidth: `${A4_CAPTURE_WIDTH_PX}px`,
    boxSizing: "border-box",
  });
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    const imgs = Array.from(clone.querySelectorAll("img"));
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      width: A4_CAPTURE_WIDTH_PX,
      windowWidth: A4_CAPTURE_WIDTH_PX,
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    addCanvasPagesToPdf(pdf, canvas, clone, 10);
    pdf.save(filename);
    return true;
  } finally {
    host.remove();
  }
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
