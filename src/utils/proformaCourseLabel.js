/**
 * Course Planning cell label from finance-queue invoice + course_meta.
 * Multi-session: "12 Jan – 15 Mar 2026 (N sessions)"
 */
export function coursePlanningLabel(inv) {
  const meta = inv?.course_meta || {};
  const title =
    meta.module_name ||
    meta.program_name ||
    inv?.planning_id?.description ||
    inv?.planning_id?.venue ||
    "Course Planning";

  const subtitle = meta.session_date_label || null;

  return { title, subtitle };
}
