//* Shared CSV export — the pattern originally written inline in
//* src/pages/admin/results/index.jsx, extracted so every archive list can use
//* the same escaping and download logic instead of re-implementing it.
import moment from "moment";

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

/**
 * Triggers a browser download of the given CSV text.
 * @param {string} csv_content
 * @param {string} filename_prefix - gets a timestamp suffix, e.g. "archive_students"
 */
export const downloadCsv = (csv_content, filename_prefix) => {
  const blob = new Blob([csv_content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename_prefix}_${moment().format("YYYYMMDD_HHmmss")}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
