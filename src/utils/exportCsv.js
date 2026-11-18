//* Shared CSV export — the pattern originally written inline in
//* src/pages/admin/results/index.jsx, extracted so every archive list can use
//* the same escaping and download logic instead of re-implementing it.
import moment from "moment";

const BOM = String.fromCharCode(0xfeff);
const BOM_RE = new RegExp(`^${BOM}`);

const escape_cell = (value) => {
  const str = value === undefined || value === null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * @param {string[]} headers - column headers, in order
 * @param {object[]} rows - raw row objects
 * @param {(row: object) => (string|number)[]} row_mapper - row -> cell values, same order as headers
 * @returns {string} CSV text
 */
export const buildCsv = (headers, rows, row_mapper) => {
  const lines = [
    headers.map(escape_cell).join(","),
    ...rows.map((row) => row_mapper(row).map(escape_cell).join(",")),
  ];
  return lines.join("\n");
};

//* RFC 4180 CSV -> rows of strings (quoted cells, "" escapes, newlines inside quotes)
export const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') (cell += '"'), i++;
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push(cell), (cell = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell), rows.push(row), (row = []), (cell = "");
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
};

//* Plain numbers become number cells so Excel can sum them. Leading zeros and
//* >15 digits (phone numbers, IDs) stay text; ="x" (Excel text trick) is unwrapped.
export const toXlsxCell = (value) => {
  const text = /^="(.*)"$/.exec(value);
  if (text) return text[1];
  return /^-?(0|[1-9]\d{0,14})(\.\d+)?$/.test(value) ? Number(value) : value;
};

const csvToXlsxBlob = async (csv_text) => {
  const XLSX = await import("xlsx"); // loaded only when someone exports Excel
  const rows = parseCsv(csv_text.replace(BOM_RE, "")).map((r) => r.map(toXlsxCell));
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "Export");
  const data = XLSX.write(book, { type: "array", bookType: "xlsx" });
  return new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Triggers a browser download of CSV content, as .csv or converted to .xlsx.
 * @param {string|Blob} csv_content - CSV text, or a CSV blob from the API
 * @param {string} filename_prefix - gets a timestamp suffix, e.g. "archive_students"
 * @param {"csv"|"xlsx"} [format]
 */
export const downloadCsv = async (csv_content, filename_prefix, format = "csv") => {
  const xlsx = format === "xlsx";
  let blob =
    csv_content instanceof Blob
      ? csv_content
      : new Blob([BOM + csv_content], { type: "text/csv;charset=utf-8;" }); //* BOM so Excel reads UTF-8
  if (xlsx) blob = await csvToXlsxBlob(await blob.text());
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename_prefix}_${moment().format("YYYYMMDD_HHmmss")}.${xlsx ? "xlsx" : "csv"}`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
