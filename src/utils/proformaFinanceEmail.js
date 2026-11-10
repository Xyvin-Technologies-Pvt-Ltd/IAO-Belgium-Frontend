/**
 * Expense note → Exact Online email delivery state (IPB-139, IPB-141).
 * Delivery lives in `finance_email`; a manual send lives in status PAID / paid_at.
 * When a note was sent both ways, the latest action wins.
 * The shown status stays unchanged while attempts run (`finance_email.sending`).
 */
export const FINANCE_EMAIL_LABELS = {
  SENT: "Sent to Exact via Email",
  FAILED: "Email failed",
};

const IN_FINANCE = ["MOVED_TO_FINANCE", "PAID"];

function emailEventTime(fe = {}) {
  if (fe.status === "SENT") return fe.sent_at;
  if (fe.status === "FAILED") return fe.last_attempt_at;
  return null;
}

/** "SENT" | "FAILED" when the email is the latest Exact action, else null. */
export function financeEmailStatus(proforma) {
  if (!IN_FINANCE.includes(proforma?.status)) return null;
  const fe = proforma?.finance_email || {};
  if (!fe.status) return null;
  if (proforma.status === "PAID") {
    const emailAt = emailEventTime(fe);
    if (!emailAt || !proforma.paid_at) return null;
    if (new Date(proforma.paid_at) >= new Date(emailAt)) return null;
  }
  return fe.status;
}

export function isFinanceEmailSending(proforma) {
  return IN_FINANCE.includes(proforma?.status) && Boolean(proforma?.finance_email?.sending);
}

/** Badge for the email state, or null to fall back to the default badge. */
export function financeEmailBadge(proforma) {
  const status = financeEmailStatus(proforma);
  if (status === "SENT") {
    return {
      label: FINANCE_EMAIL_LABELS.SENT,
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400",
    };
  }
  if (status === "FAILED") {
    return {
      label: FINANCE_EMAIL_LABELS.FAILED,
      bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400",
    };
  }
  return null;
}

export function canRetryFinanceEmail(proforma) {
  return financeEmailStatus(proforma) === "FAILED";
}

/** IPB-141: "Send to Exact via Email" is active unless that is already the latest status. */
export function canSendFinanceEmail(proforma) {
  return (
    IN_FINANCE.includes(proforma?.status) &&
    !isFinanceEmailSending(proforma) &&
    financeEmailStatus(proforma) !== "SENT"
  );
}
