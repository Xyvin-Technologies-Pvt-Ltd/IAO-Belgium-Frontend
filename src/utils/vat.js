//* VAT number check — same rule as the backend (src/utils/normalize_vat.js there).
//* Optional: empty, "/", "NVT" or a remark → no VAT number. Anything else must be
//* a real VAT number (BE + 10 digits with valid check digits, or another EU number).
//*
//* checkVat(value, { country }) →
//*   { ok: true, value: "BE0123456789" }  valid, cleaned
//*   { ok: true, value: "" }              no VAT number
//*   { ok: false, reason }                reason: iban | be_length | be_check | country | not_vat

const NONE_WORDS = new Set(["", "/", "-", "--", ".", "0", "NVT", "NV", "NA", "N/A", "NONE", "GEEN", "AUCUN", "AUCUNE", "NEANT", "X"]);
//* Number part per country (after the prefix): the official VIES formats for
//* all 27 EU countries + Northern Ireland (XI). Greece uses EL, not GR.
const FORMATS = {
  AT: /^U\d{8}$/,
  BE: /^[01]\d{9}$/,
  BG: /^\d{9,10}$/,
  CY: /^\d{8}[A-Z]$/,
  CZ: /^\d{8,10}$/,
  DE: /^\d{9}$/,
  DK: /^\d{8}$/,
  EE: /^\d{9}$/,
  EL: /^\d{9}$/,
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,
  FI: /^\d{8}$/,
  FR: /^[A-HJ-NP-Z0-9]{2}\d{9}$/,
  HR: /^\d{11}$/,
  HU: /^\d{8}$/,
  IE: /^(\d{7}[A-W][A-IW]?|\d[A-Z+*]\d{5}[A-W])$/,
  IT: /^\d{11}$/,
  LT: /^(\d{9}|\d{12})$/,
  LU: /^\d{8}$/,
  LV: /^\d{11}$/,
  MT: /^\d{8}$/,
  NL: /^\d{9}B\d{2}$/,
  PL: /^\d{10}$/,
  PT: /^\d{9}$/,
  RO: /^\d{2,10}$/,
  SE: /^\d{10}01$/,
  SI: /^\d{8}$/,
  SK: /^\d{10}$/,
  XI: /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/,
};
const EU_PREFIXES = new Set(Object.keys(FORMATS));

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
    if (EU_PREFIXES.has(home) && format.test(compact)) {
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
