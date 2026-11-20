//* Shared bits for the Audit tab.

export const SEVERITY_STYLES = {
  high: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  low: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
};

//* Categories that need the Exact copy (pulled from Exact) to be meaningful.
export const NEEDS_EXACT_COPY = [
  "link_missing",
  "not_found_in_exact",
  "duplicate",
  "unknown_in_exact",
  "amount_mismatch",
  "wrong_customer",
  "old_reference",
  "customer_gone",
];

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function money(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toFixed(2);
}
