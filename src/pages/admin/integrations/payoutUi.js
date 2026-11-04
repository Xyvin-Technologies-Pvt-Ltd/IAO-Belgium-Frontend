//* Shared bits for the Payouts tab and its detail dialog.

export const STATE_STYLES = {
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  hand_match: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  advance: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200",
  action: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  empty: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
};

export const LINE_STYLES = {
  in_exact: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  other_ref: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  waiting: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  sending: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  missing: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  advance: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200",
  not_booked: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200",
  unknown: "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-200",
  refund: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  chargeback: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
};

//* Order of the count chips on a payout row (worst first).
export const COUNT_ORDER = [
  "missing",
  "failed",
  "waiting",
  "sending",
  "advance",
  "other_ref",
  "not_booked",
  "unknown",
  "refund",
  "chargeback",
  "in_exact",
];

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function money(value, currency) {
  if (value === null || value === undefined || value === "") return "—";
  return `${Number(value).toFixed(2)} ${currency || ""}`.trim();
}
