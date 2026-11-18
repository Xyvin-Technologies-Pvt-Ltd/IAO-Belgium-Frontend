//* VAT number check — same rule as the backend (src/utils/normalize_vat.js there).
//* Optional: empty, "/", "NVT" or a remark → no VAT number. Anything else must be
//* a real VAT number (BE + 10 digits with valid check digits, or another EU number).
//*
//* checkVat(value, { country }) →
//*   { ok: true, value: "BE0123456789" }  valid, cleaned
//*   { ok: true, value: "" }              no VAT number
//*   { ok: false, reason }                reason: iban | be_length | be_check | country | not_vat

const NONE_WORDS = new Set(["", "/", "-", "--", ".", "0", "NVT", "NV", "NA", "N/A", "NONE", "GEEN", "AUCUN", "AUCUNE", "NEANT", "X"]);
const EU_PREFIXES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU", "IE", "IT",
  "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK", "XI",
]);
const FORMATS = {
  DK: /^\d{8}$/,
  DE: /^\d{9}$/,
  NL: /^\d{9}B\d{2}$/,
  FR: /^[0-9A-Z]{2}\d{9}$/,
  LU: /^\d{8}$/,
  PT: /^\d{9}$/,
  ES: /^[0-9A-Z]\d{7}[0-9A-Z]$/,
  IT: /^\d{11}$/,
  AT: /^U\d{8}$/,
};

function beCheckOk(tenDigits) {
  return 97 - (Number(tenDigits.slice(0, 8)) % 97) === Number(tenDigits.slice(8));
}

export function checkVat(value, { country = null } = {}) {
  const upper = String(value ?? "").trim().toUpperCase();
  if (NONE_WORDS.has(upper.replace(/\s+/g, "")) || !/\d/.test(upper)) return { ok: true, value: "" };
  const compact = upper.replace(/[\s.\-_/]/g, "");

  if (/^BE\d{14}$/.test(compact) || (/^[A-Z]{2}\d{2}[A-Z0-9]{12,30}$/.test(compact) && compact.length >= 18)) {
    return { ok: false, reason: "iban" };
  }

  const home = country ? String(country).toUpperCase().replace(/^GR$/, "EL") : null;
  if (home && home !== "BE" && /^[0-9]/.test(compact)) {
    const format = FORMATS[home];
    if (EU_PREFIXES.has(home) && (format ? format.test(compact) : /^[0-9A-Z]{2,12}$/.test(compact))) {
      return { ok: true, value: `${home}${compact}` };
    }
    return { ok: false, reason: "country" };
  }

  const be = /^(?:BE)?(\d{9,10})$/.exec(compact);
  if (be) {
    const digits = be[1].length === 9 ? `0${be[1]}` : be[1];
    if (!/^[01]/.test(digits) || !beCheckOk(digits)) return { ok: false, reason: "be_check" };
    return { ok: true, value: `BE${digits}` };
  }
  if (/^BE/.test(compact)) return { ok: false, reason: "be_length" };

  const eu = /^([A-Z]{2})([0-9A-Z]{2,12})$/.exec(compact);
  if (eu && EU_PREFIXES.has(eu[1])) {
    const format = FORMATS[eu[1]];
    if (format && !format.test(eu[2])) return { ok: false, reason: "country" };
    return { ok: true, value: compact };
  }
  return { ok: false, reason: "not_vat" };
}

/** English message (for screens without translations). */
export const VAT_REASON_EN = {
  iban: "This looks like a bank account number (IBAN), not a VAT number.",
  be_length: "A Belgian VAT number is BE followed by 10 digits, e.g. BE0123456789.",
  be_check: "This is not a valid Belgian VAT number — please check the digits.",
  country: "This is not a valid VAT number for the company's country.",
  not_vat: "This is not a VAT number.",
};
