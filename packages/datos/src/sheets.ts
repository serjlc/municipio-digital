import * as XLSX from "xlsx";

/** Downloads a spreadsheet (XLS, XLSX, XLSB or ODS) and parses it. */
export async function fetchWorkbook(url: string): Promise<XLSX.WorkBook> {
  const buf = await fetch(url).then((res) => res.arrayBuffer());
  return XLSX.read(buf, { type: "buffer" });
}

/** Parses a cell that should hold a count or amount; es-ES strings included. */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return isNaN(value) ? null : value;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? null : parsed;
}
