import moment from "moment";
import { AlertCircle, Check } from "lucide-react";
import { FINANCE_EMAIL_LABELS, financeEmailStatus } from "@/utils/proformaFinanceEmail";

const pillBase =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none";

const pillClass = {
  SENT: `${pillBase} border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300`,
  FAILED: `${pillBase} border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300`,
};

const pillIcon = {
  SENT: Check,
  FAILED: AlertCircle,
};

function formatDateTime(value) {
  return value ? moment(value).format("DD-MM-YYYY HH:mm") : null;
}

/**
 * Status cell for an expense note emailed to Exact (IPB-139):
 * Sent to Exact via Email · Email failed (with reason + attempts).
 * Returns null when the note has no email state, so callers keep their default badge.
 */
export function ProformaFinanceEmailBadge({ proforma }) {
  const status = financeEmailStatus(proforma);
  if (!status) return null;

  const fe = proforma.finance_email || {};
  const Icon = pillIcon[status];
  const maxAttempts = fe.max_attempts || 3;

  let detail = null;
  if (status === "SENT") {
    detail = formatDateTime(fe.sent_at);
  } else if (status === "FAILED") {
    const last = formatDateTime(fe.last_attempt_at);
    detail = [`${fe.attempts || 0} of ${maxAttempts} attempts`, last ? `last ${last}` : null]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className={pillClass[status]}>
        <Icon className="w-3 h-3" />
        {FINANCE_EMAIL_LABELS[status]}
      </span>
      {status === "FAILED" && fe.failure_reason ? (
        <span className="text-[11px] font-normal leading-snug text-red-700 dark:text-red-400 max-w-[220px] whitespace-normal">
          {fe.failure_reason}
        </span>
      ) : null}
      {detail ? (
        <span className="text-[11px] font-normal leading-none text-muted-foreground whitespace-nowrap">
          {detail}
        </span>
      ) : null}
    </span>
  );
}

export default ProformaFinanceEmailBadge;
