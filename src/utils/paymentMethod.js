export const PAYMENT_METHOD_FILTER_OPTIONS = [
  { labelKey: "studentManagement.paymentMethods.ideal", fallback: "iDEAL", value: "ideal" },
  { labelKey: "studentManagement.paymentMethods.creditCard", fallback: "Credit Card", value: "creditcard" },
  { labelKey: "studentManagement.paymentMethods.paypal", fallback: "PayPal", value: "paypal" },
  { labelKey: "studentManagement.paymentMethods.bankTransfer", fallback: "Bank Transfer", value: "banktransfer" },
];

export const formatPaymentMethod = (method, t) => {
  if (!method) {
    return t ? t("common.notAvailable") : "—";
  }

  const normalized = String(method).toLowerCase();

  if (normalized === "online" || normalized === "mollie") {
    return t ? t("common.notAvailable") : "—";
  }

  const labels = {
    ideal: t?.("studentManagement.paymentMethods.ideal", "iDEAL") ?? "iDEAL",
    creditcard: t?.("studentManagement.paymentMethods.creditCard", "Credit Card") ?? "Credit Card",
    bancontact: t?.("studentManagement.paymentMethods.bancontact", "Bancontact") ?? "Bancontact",
    paypal: t?.("studentManagement.paymentMethods.paypal", "PayPal") ?? "PayPal",
    banktransfer: t?.("studentManagement.paymentMethods.bankTransfer", "Bank Transfer") ?? "Bank Transfer",
    transfer: t?.("studentManagement.paymentMethods.bankTransfer", "Bank Transfer") ?? "Bank Transfer",
  };

  return labels[normalized] ?? method;
};
