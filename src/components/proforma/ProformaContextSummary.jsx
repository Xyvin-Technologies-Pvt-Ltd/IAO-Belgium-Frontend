import React from "react";
import { useTranslation } from "react-i18next";
import {
  planningAddress,
  proformaModuleName,
  proformaTeacherName,
  proformaTeacherRole,
  teacherHomeAddress,
} from "@/utils/proformaCourseLabel";

/**
 * Compact context block for proforma detail pages.
 * Admin: teacher + role + home + planning + module + payout bank / company
 * Teacher: home + planning + module + payout bank / company
 */
export default function ProformaContextSummary({ proforma, showTeacherName = true }) {
  const { t } = useTranslation();
  if (!proforma) return null;

  const signature = proforma.digital_signature || {};
  const party = signature.invoice_party || {};
  const useCompany = Boolean(party.use_different_details);
  const bank =
    signature.bank_account_number ||
    proforma.teacher_id?.IBAN ||
    null;

  const rows = [];
  if (showTeacherName) {
    const role = proformaTeacherRole(proforma);
    rows.push({
      label: t("proforma.context.teacher"),
      value: role
        ? `${proformaTeacherName(proforma.teacher_id)} · ${role}`
        : proformaTeacherName(proforma.teacher_id),
    });
  }
  rows.push({
    label: t("proforma.context.homeAddress"),
    value: teacherHomeAddress(proforma.teacher_id) || "—",
  });
  rows.push({
    label: t("proforma.context.planningAddress"),
    value: planningAddress(proforma) || "—",
  });
  rows.push({
    label: t("proforma.context.module"),
    value: proformaModuleName(proforma) || "—",
  });

  if (useCompany) {
    if (party.company_name) {
      rows.push({ label: t("proforma.invoiceCompany"), value: party.company_name });
    }
    if (party.address) {
      rows.push({ label: t("proforma.companyAddress"), value: party.address });
    }
    if (String(party.additional_info_1 || "").trim()) {
      rows.push({
        label: t("proforma.additionalInfo1"),
        value: String(party.additional_info_1).trim(),
      });
    }
    if (String(party.additional_info_2 || "").trim()) {
      rows.push({
        label: t("proforma.additionalInfo2"),
        value: String(party.additional_info_2).trim(),
      });
    }
  }

  if (bank) {
    rows.push({
      label: signature.is_signed ? t("proforma.bankAccount") : t("proforma.bankAccountProfile"),
      value: <span className="font-mono">{bank}</span>,
    });
  }

  if (signature.is_signed && signature.signed_by_name) {
    rows.push({
      label: t("proforma.signedByLabel", { defaultValue: "Signed by" }),
      value: signature.signed_by_name,
    });
  }

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dl className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:gap-4 gap-0.5 text-sm"
          >
            <dt className="sm:w-40 shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 font-medium text-foreground break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
