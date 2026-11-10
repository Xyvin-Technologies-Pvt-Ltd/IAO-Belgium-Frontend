/**
 * Expense note → Exact Online email delivery state (IPB-139).
 * The note keeps status MOVED_TO_FINANCE; delivery lives in `finance_email`.
 * The shown status stays unchanged while attempts run (`finance_email.sending`).
 */
export const FINANCE_EMAIL_LABELS = {
  SENT: "Sent to Exact via Email",
  FAILED: "Email failed",
};

export function financeEmailStatus(proforma) {
  if (proforma?.status !== "MOVED_TO_FINANCE") return null;
  return proforma?.finance_email?.status || null;
}

export function isFinanceEmailSending(proforma) {
  return proforma?.status === "MOVED_TO_FINANCE" && Boolean(proforma?.finance_email?.sending);
}

/** Badge for a MOVED_TO_FINANCE note, or null to fall back to the default. */
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
