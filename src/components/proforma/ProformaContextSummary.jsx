import React from "react";
import {
  planningAddress,
  proformaModuleName,
  proformaTeacherName,
  proformaTeacherRole,
  teacherHomeAddress,
} from "@/utils/proformaCourseLabel";

/**
 * Compact context block for proforma detail pages.
 * Admin: teacher + role + home + planning + module
 * Teacher: home + planning + module (no teacher name)
 */
export default function ProformaContextSummary({ proforma, showTeacherName = true }) {
  if (!proforma) return null;

  const rows = [];
  if (showTeacherName) {
    const role = proformaTeacherRole(proforma);
    rows.push({
      label: "Teacher",
      value: role
        ? `${proformaTeacherName(proforma.teacher_id)} · ${role}`
        : proformaTeacherName(proforma.teacher_id),
    });
  }
  rows.push({
    label: "Home address",
    value: teacherHomeAddress(proforma.teacher_id) || "—",
  });
  rows.push({
    label: "Planning address",
    value: planningAddress(proforma) || "—",
  });
  rows.push({
    label: "Module",
    value: proformaModuleName(proforma) || "—",
  });

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <dl className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:gap-4 gap-0.5 text-sm"
          >
            <dt className="sm:w-36 shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="min-w-0 font-medium text-foreground break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
