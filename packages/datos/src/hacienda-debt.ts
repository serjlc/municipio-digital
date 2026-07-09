import type { Municipality } from "@municipio/config";
import * as XLSX from "xlsx";
import { fetchWorkbook, toNumber } from "./sheets";

/*
 * Outstanding debt ("deuda viva", PDE criterion) of every Spanish town
 * hall, published yearly by the Ministerio de Hacienda as one spreadsheet
 * per exercise. There is no API and the file names drift over the years,
 * so the links are discovered from the ministry's own index page, which
 * the legal note in the docs allows: documented, one request, daily cache.
 */
const INDEX_URL =
  "https://www.hacienda.gob.es/es-ES/CDI/Paginas/SistemasFinanciacionDeuda/InformacionEELLs/DeudaViva.aspx";

export interface DebtYear {
  year: number;
  /** Outstanding debt at 31 December, in euros */
  debt: number;
}

export interface MunicipalDebt {
  years: DebtYear[];
  latest: DebtYear;
  previous?: DebtYear;
  peak: DebtYear;
  sourceUrl: string;
}

function yearlyFileUrls(html: string): Map<number, string> {
  const byYear = new Map<number, string>();
  for (const match of html.matchAll(/href="([^"]*ayuntamientos[^"]*\.xlsx?)"/gi)) {
    const href = match[1]!;
    /* Decode before looking for the year: "%202013" would otherwise
       yield a spurious "2020" */
    const year = parseInt(decodeURIComponent(href).match(/20\d{2}/)?.[0] ?? "", 10);
    if (isNaN(year) || byYear.has(year)) continue;
    byYear.set(year, new URL(href, "https://www.hacienda.gob.es").href);
  }
  return byYear;
}

function debtFromSheet(sheet: XLSX.WorkSheet, province: string, town: string): number | null {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  /* Header wording drifts over the years ("Código Provincia" vs the
     accentless, truncated "Codigo Provin" of the oldest files) */
  const isProvinceHeader = (c: string) => c.includes("digo") && c.toLowerCase().includes("provin");
  const headerIdx = rows.findIndex((row) =>
    (row ?? []).some((cell) => isProvinceHeader(String(cell ?? ""))),
  );
  if (headerIdx === -1) return null;
  const header = rows[headerIdx]!.map((cell) => String(cell ?? ""));
  const provinceCol = header.findIndex(isProvinceHeader);
  const townCol = header.findIndex(
    (c) => c.includes("digo") && c.toLowerCase().includes("municipio"),
  );
  const debtCol = header.findIndex((c) => c.toLowerCase().includes("deuda"));
  if (provinceCol === -1 || townCol === -1 || debtCol === -1) return null;

  for (const row of rows.slice(headerIdx + 1)) {
    if (!row) continue;
    const rowProvince = String(row[provinceCol] ?? "").padStart(2, "0");
    const rowTown = String(row[townCol] ?? "").padStart(3, "0");
    if (rowProvince === province && rowTown === town) {
      const thousands = toNumber(row[debtCol]);
      return thousands === null ? null : Math.round(thousands * 1000);
    }
  }
  return null;
}

export async function fetchMunicipalDebt(m: Municipality): Promise<MunicipalDebt | null> {
  const province = m.ineCode.slice(0, 2);
  const town = m.ineCode.slice(2);

  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) return null;
    const files = yearlyFileUrls(await res.text());
    if (files.size === 0) return null;

    const years = (
      await Promise.all(
        [...files.entries()].map(async ([year, url]): Promise<DebtYear | null> => {
          try {
            const wb = await fetchWorkbook(url);
            const sheetName = wb.SheetNames.includes("Datos") ? "Datos" : wb.SheetNames[0];
            const debt = sheetName ? debtFromSheet(wb.Sheets[sheetName]!, province, town) : null;
            return debt === null ? null : { year, debt };
          } catch (err) {
            console.error(`Error parsing municipal debt ${year}:`, err);
            return null;
          }
        }),
      )
    )
      .filter((y): y is DebtYear => y !== null)
      .sort((a, b) => a.year - b.year);

    const latest = years[years.length - 1];
    if (!latest) return null;

    return {
      years,
      latest,
      previous: years[years.length - 2],
      peak: years.reduce((max, y) => (y.debt > max.debt ? y : max)),
      sourceUrl: INDEX_URL,
    };
  } catch (err) {
    console.error("Error fetching municipal debt:", err);
    return null;
  }
}
