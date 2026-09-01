import { useTranslation } from "react-i18next";

const statusVariants = {
  pending: "text-amber-600 dark:text-amber-400",
  paid: "text-green-600 dark:text-green-400",
  failed: "text-red-600 dark:text-red-400",
  no_fee: "text-blue-600 dark:text-blue-400",
};

export const getAdmissionPaymentDisplay = ({
  payment_status,
  payment_amount,
  currency = "€",
  t,
}) => {
  const amount = payment_amount ?? 0;

  if (amount === 0 && payment_status === "paid") {
    return {
      key: "no_fee",
      text: t("common.admissionPayment.noFeeRequired", "No Fee Required"),
    };
  }

  if (payment_status === "paid" && amount > 0) {
    return {
      key: "paid",
      text: t("common.admissionPayment.paidAmount", "Paid {{currency}}{{amount}}", {
        currency,
        amount,
      }),
    };
  }

  if (payment_status === "pending") {
    return {
      key: "pending",
      text: t("common.pending", "Pending"),
    };
  }

  if (payment_status === "failed") {
    return {
      key: "failed",
      text: t("common.failed", "Failed"),
    };
  }

  return {
    key: payment_status || "unknown",
    text: payment_status || t("common.dash", "-"),
  };
};

const AdmissionPaymentBadge = ({
  payment_status,
  payment_amount,
  currency = "€",
}) => {
  const { t } = useTranslation();
  const display = getAdmissionPaymentDisplay({
    payment_status,
    payment_amount,
    currency,
    t,
  });

  return (
    <span className={`font-medium capitalize ${statusVariants[display.key] || "text-gray-800 dark:text-gray-200"}`}>
      {display.text}
    </span>
  );
};

export default AdmissionPaymentBadge;
