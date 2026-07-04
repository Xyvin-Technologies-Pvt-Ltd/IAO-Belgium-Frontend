const SUPPORTED_LOCALES = ["en", "fr", "nl", "de"];

export function slugifyPreviousEducationKey(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
}

export function humanizePreviousEducationKey(key) {
  const text = String(key || "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function getActivePreviousEducationOptions(options = []) {
  return [...options]
    .filter((option) => option.status !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function getAllPreviousEducationOptions(options = []) {
  return [...options].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function resolvePreviousEducationLabel(
  key,
  options = [],
  locale = "en",
) {
  if (!key) return "";

  const normalizedLocale = SUPPORTED_LOCALES.includes(locale) ? locale : "en";

  const byKey = options.find((option) => option.key === key);
  if (byKey) {
    return byKey.labels?.[normalizedLocale] || byKey.labels?.en || key;
  }

  const byLabel = options.find((option) =>
    Object.values(option.labels || {}).some(
      (label) => label && label.trim() === String(key).trim(),
    ),
  );
  if (byLabel) {
    return byLabel.labels?.[normalizedLocale] || byLabel.labels?.en || key;
  }

  return humanizePreviousEducationKey(key);
}

export function getProgramPreviousEducationOptions(program) {
  return (
    program?.previous_education_options ||
    program?.program?.previous_education_options ||
    []
  );
}

export function getApplicationPreviousEducationOptions(application) {
  return (
    application?.previous_education_options ||
    application?.intake?.program?.previous_education_options ||
    application?.batch?.intake?.program?.previous_education_options ||
    []
  );
}
