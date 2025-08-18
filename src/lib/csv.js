/**
 * Lightweight CSV export helper.
 *
 * This module has no dependencies and uses the browser's `Blob` and
 * `URL` APIs to trigger a download of tabular data. The function expects
 * an array of objects where each object's keys correspond to CSV column
 * headers.
 */

/**
 * Trigger a CSV file download in the browser.
 *
 * @param {string} filename - Desired name of the file, e.g. "data.csv".
 * @param {Object[]} rows - Array of records to write. Keys become column headers.
 */
export function downloadCSV(filename, rows) {
  if (!rows.length) return; // nothing to export

  // Compose header row from object keys and body rows from values
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).join(",")).join("\n");
  const csv = `${header}\n${body}`;

  // Create a blob and synthetic anchor element to prompt the browser download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
