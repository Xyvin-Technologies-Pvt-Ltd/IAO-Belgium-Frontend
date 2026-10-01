/**
 * Display name for a populated teacher user (proforma lists / headers).
 */
export function proformaTeacherName(teacher, fallback = "Teacher") {
  if (!teacher) return fallback;
  if (teacher.full_name) return teacher.full_name;
  if (teacher.name) return teacher.name;
  const parts = [teacher.last_name, teacher.first_name].filter(Boolean);
  return parts.length ? parts.join(" ") : fallback;
}

/**
 * Teacher role from invoice snapshot / populated user.
 */
export function proformaTeacherRole(inv) {
  return (
    inv?.teacher_role_name ||
    inv?.teacher_id?.teacher_role?.name ||
    (inv?.items || []).find((i) => i.item_type === "TEACHING")?.teacher_role_name ||
    null
  );
}

/**
 * Teacher home address from populated user fields.
 */
export function teacherHomeAddress(teacher) {
  if (!teacher) return null;
  const parts = [teacher.address, teacher.postal_code, teacher.city, teacher.country]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

/**
 * Planning venue address (prefer full address, then venue name).
 */
export function planningAddress(inv) {
  const meta = inv?.course_meta || {};
  const planning = inv?.planning_id || {};
  const address = meta.venue_address || planning.venue_address || null;
  const venue = meta.venue || planning.venue || null;
  if (address && venue && address !== venue) return `${venue} — ${address}`;
  return address || venue || null;
}

/**
 * Module / course name for detail headers.
 */
export function proformaModuleName(inv) {
  const meta = inv?.course_meta || {};
  const planning = inv?.planning_id || {};
  return (
    meta.module_name ||
    planning?.component?.name ||
    meta.program_name ||
    planning?.component?.program?.name ||
    planning?.batch?.intake?.program?.name ||
    planning?.description ||
    null
  );
}

/**
 * Planning location lines: city · venue · address
 */
export function planningLocationLines(inv) {
  const meta = inv?.course_meta || {};
  const planning = inv?.planning_id || {};
  const city =
    meta.city ||
    planning?.component?.program?.city?.name ||
    planning?.batch?.intake?.program?.city?.name ||
    planning.city ||
    null;
  const venue = meta.venue || planning.venue || null;
  const address = meta.venue_address || planning.venue_address || null;

  const lines = [];
  if (city) lines.push(typeof city === "object" ? city.name : city);
  if (venue) lines.push(venue);
  if (address && address !== venue) lines.push(address);
  return lines;
}

/**
 * Course Planning cell label from finance-queue invoice + course_meta.
 * Multi-session: lists session dates, e.g. "12 Jan 2026, 15 Mar 2026"
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
  const locationLines = planningLocationLines(inv);

  return { title, subtitle, locationLines };
}
