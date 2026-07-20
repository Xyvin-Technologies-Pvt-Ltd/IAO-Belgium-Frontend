/** Purposes where amount includes a separate convenience fee on the payment record. */
export const hasPaymentConvenienceFee = (payment) =>
  Number(payment?.convenience_fee) > 0 &&
  (payment?.purpose === "module-purchase" || payment?.purpose === "location-switch");

/** Module / top-up portion of a payment (excludes convenience fee). */
export const getPaymentModuleAmount = (payment) => {
  if (hasPaymentConvenienceFee(payment)) {
    return Number(payment.amount) - Number(payment.convenience_fee);
  }
  return Number(payment?.amount || 0);
};

/** Convenience fee display value, or null when not applicable. */
export const getPaymentConvenienceFeeAmount = (payment) => {
  if (!hasPaymentConvenienceFee(payment)) return null;
  return Number(payment.convenience_fee);
};
