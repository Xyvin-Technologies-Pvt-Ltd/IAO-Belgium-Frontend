/**
 * Export thesis (student) + thesisManagement (admin) i18n keys to Excel
 * for client translation review.
 *
 * Usage (from IAO-Belgium-Frontend):
 *   npm install xlsx --no-save
 *   node scripts/export-thesis-i18n-excel.cjs
 *
 * Outputs:
 *   exports/thesis-translations-student.xlsx
 *   exports/thesis-translations-admin.xlsx
 */

const fs = require("fs");
const path = require("path");

let XLSX;
try {
  XLSX = require("xlsx");
} catch {
  console.error(
    "Missing dependency `xlsx`. Run: npm install xlsx --no-save"
  );
  process.exit(1);
}

const ROOT = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(ROOT, "src", "i18n", "locales");
const OUT_DIR = path.join(ROOT, "exports");

const LOCALES = ["en", "nl", "fr", "de"];

function loadLocale(code) {
  const file = path.join(LOCALES_DIR, `${code}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function flatten(obj, prefix = "", out = {}) {
  if (obj == null) return out;
  if (typeof obj !== "object" || Array.isArray(obj)) {
    out[prefix] = obj == null ? "" : String(obj);
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value != null && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, next, out);
    } else {
      out[next] = value == null ? "" : String(value);
    }
  }
  return out;
}

function getByPath(obj, dotted) {
  return dotted.split(".").reduce((acc, part) => {
    if (acc == null) return undefined;
    return acc[part];
  }, obj);
}

function buildRows(namespace, locales) {
  const enRoot = getByPath(locales.en, namespace) || {};
  const keys = Object.keys(flatten(enRoot, namespace)).sort();

  return keys.map((key) => {
    const relative = key.startsWith(`${namespace}.`)
      ? key.slice(namespace.length + 1)
      : key;
    const row = {
      key,
      en: "",
      nl: "",
      fr: "",
      de: "",
      client_correction_nl: "",
      client_correction_fr: "",
      client_correction_de: "",
    };
    for (const code of LOCALES) {
      const nsObj = getByPath(locales[code], namespace);
      const flat = flatten(nsObj || {}, namespace);
      row[code] = flat[key] ?? "";
      // also try relative if missing (shouldn't happen)
      if (!row[code] && relative !== key) {
        const flatRel = flatten(nsObj || {});
        row[code] = flatRel[relative] ?? "";
      }
    }
    return row;
  });
}

function writeWorkbook(rows, outPath) {
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "key",
      "en",
      "nl",
      "fr",
      "de",
      "client_correction_nl",
      "client_correction_fr",
      "client_correction_de",
    ],
  });
  sheet["!cols"] = [
    { wch: 56 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 },
    { wch: 48 },
    { wch: 40 },
    { wch: 40 },
    { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "translations");
  XLSX.writeFile(wb, outPath);
}

(function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const locales = {};
  for (const code of LOCALES) {
    locales[code] = loadLocale(code);
  }

  const studentRows = buildRows("thesis", locales);
  const adminRows = buildRows("thesisManagement", locales);

  const studentPath = path.join(OUT_DIR, "thesis-translations-student.xlsx");
  const adminPath = path.join(OUT_DIR, "thesis-translations-admin.xlsx");

  writeWorkbook(studentRows, studentPath);
  writeWorkbook(adminRows, adminPath);

  console.log(`Wrote ${studentRows.length} rows → ${studentPath}`);
  console.log(`Wrote ${adminRows.length} rows → ${adminPath}`);
})();
