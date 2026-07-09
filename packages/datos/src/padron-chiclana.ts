import * as XLSX from "xlsx";
import type { CkanDataset } from "./ckan";
import type { DistrictPopulation, PadronParser } from "./padron";
import { fetchWorkbook, toNumber } from "./sheets";

/*
 * Adapter for the one padron detail the INE does not publish: population by
 * district and electoral section, from the XLSX Chiclana publishes in its
 * CKAN portal ("Total Distrito N" summary rows, one sheet per year).
 * Everything else on the demographics page comes from INE connectors,
 * which are universal and fresher.
 *
 * If your town publishes different files, write a sibling adapter and
 * register it in `padronParsers` (padron.ts).
 */

function toCount(value: unknown): number {
  return Math.trunc(toNumber(value) ?? 0);
}

function parseDistricts(sheet: XLSX.WorkSheet): DistrictPopulation[] {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const districts: DistrictPopulation[] = [];
  let currentDistrict: DistrictPopulation | null = null;

  for (const row of data) {
    if (!row || row.length === 0) continue;
    const cell0 = String(row[0] ?? "").trim();

    if (cell0.toLowerCase().startsWith("total distrito")) {
      currentDistrict = {
        name: cell0.replace(/total\s+/i, ""),
        women: toCount(row[1]),
        men: toCount(row[2]),
        total: toCount(row[3]),
        sections: [],
      };
      districts.push(currentDistrict);
    } else if (currentDistrict && /^\d+$/.test(cell0)) {
      currentDistrict.sections.push({
        section: parseInt(cell0, 10),
        women: toCount(row[1]),
        men: toCount(row[2]),
        total: toCount(row[3]),
      });
    }
  }

  return districts;
}

export const chiclanaPadron: PadronParser = async (dataset: CkanDataset) => {
  const findResource = (keyword: string, format: string) =>
    dataset.resources.find((r) => r.name.toLowerCase().includes(keyword) && r.format === format);

  const distritosRes = findResource("distrito", "XLSX");
  if (!distritosRes) {
    return null;
  }

  const distritosWb = await fetchWorkbook(distritosRes.url);

  /* Districts workbook has one sheet per year; pick the most recent */
  const yearSheets = distritosWb.SheetNames.filter((n) => /^\d{4}$/.test(n)).sort();
  const latestSheetName =
    yearSheets[yearSheets.length - 1] ?? distritosWb.SheetNames[distritosWb.SheetNames.length - 1];
  if (!latestSheetName) return null;
  const distritosSheet = distritosWb.Sheets[latestSheetName];
  if (!distritosSheet) return null;
  const districts = parseDistricts(distritosSheet);

  const year = /^\d{4}$/.test(latestSheetName)
    ? parseInt(latestSheetName, 10)
    : new Date().getFullYear();

  return { year, districts };
};
