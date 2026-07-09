import * as XLSX from "xlsx";
import type { CkanDataset } from "./ckan";
import { fetchWorkbook, toNumber } from "./sheets";
import type {
  LocalOccupancy,
  LocalTourismData,
  OccupancyYear,
  TourismParser,
  VisitorOrigin,
} from "./tourism";

/*
 * Adapter for the tourism files Chiclana publishes in its CKAN portal:
 *
 * - "Flujos turísticos": a year-by-month matrix of average hotel occupancy
 *   (fractions of 1) for the Novo/Loma de Sancti Petri resorts.
 * - "Visitantes y turismo": one file per year with visitors attended at the
 *   tourist offices broken down by nationality; the header row floats and
 *   the 2024 file is mislabelled "Provincias" while holding nationalities,
 *   so sheets are recognized by their "ESPAÑOLES" header instead of names.
 */

const MONTH_HEADER = /^enero$/i;

function parseOccupancySheet(sheet: XLSX.WorkSheet): OccupancyYear[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const headerIdx = rows.findIndex((row) =>
    (row ?? []).some((cell) => MONTH_HEADER.test(String(cell ?? "").trim())),
  );
  if (headerIdx === -1) return [];
  const header = rows[headerIdx]!;
  const januaryCol = header.findIndex((cell) => MONTH_HEADER.test(String(cell ?? "").trim()));

  const years: OccupancyYear[] = [];
  for (const row of rows.slice(headerIdx + 1)) {
    if (!row) continue;
    const year = Math.trunc(toNumber(row[0]) ?? 0);
    if (year < 2000 || year > 2100) continue;
    const months = Array.from({ length: 12 }, (_, month) => {
      const value = toNumber(row[januaryCol + month]);
      if (value === null) return null;
      /* Published as fractions of 1; be tolerant if that ever changes */
      return Math.round((value <= 1.5 ? value * 100 : value) * 10) / 10;
    });
    years.push({ year, months });
  }
  return years.sort((a, b) => a.year - b.year);
}

async function parseOccupancy(dataset: CkanDataset): Promise<LocalOccupancy | null> {
  /* Several formats of the same matrix; the ODS has carried more years */
  const resources = dataset.resources.filter((r) => ["ODS", "XLSX"].includes(r.format));
  let best: OccupancyYear[] = [];
  for (const resource of resources) {
    try {
      const wb = await fetchWorkbook(resource.url);
      const sheetName = wb.SheetNames[0];
      const years = sheetName ? parseOccupancySheet(wb.Sheets[sheetName]!) : [];
      if (years.length > best.length) best = years;
    } catch (err) {
      console.error(`Error parsing occupancy ${resource.name}:`, err);
    }
  }
  if (best.length === 0) return null;
  return {
    years: best,
    scope: "Hoteles y hoteles-apartamento de Novo Sancti Petri y Loma de Sancti Petri",
    datasetUrl: dataset.datasetUrl,
    license: dataset.license,
  };
}

function titleCase(value: string): string {
  const lower = value.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function parseVisitorsSheet(sheet: XLSX.WorkSheet): { origins: VisitorOrigin[]; total: number } | null {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const headerIdx = rows.findIndex((row) =>
    (row ?? []).some((cell) => String(cell ?? "").trim().toUpperCase() === "ESPAÑOLES"),
  );
  if (headerIdx === -1) return null;
  const header = rows[headerIdx]!;

  const originCols: { label: string; col: number }[] = [];
  let totalCol = -1;
  header.forEach((cell, col) => {
    const name = String(cell ?? "").trim().toUpperCase();
    if (name === "TOTALES" || name === "TOTAL") totalCol = col;
    else if (/^[A-ZÑÁÉÍÓÚ]{4,}$/.test(name) && name !== "PAIS") {
      originCols.push({ label: titleCase(name), col });
    }
  });
  if (originCols.length === 0) return null;

  for (const row of rows.slice(headerIdx + 1)) {
    if (!row) continue;
    const origins = originCols.map(({ label, col }) => ({ label, count: toNumber(row[col]) }));
    if (origins.every((o) => o.count !== null)) {
      const clean = origins.map((o) => ({ label: o.label, count: o.count! }));
      const total = toNumber(totalCol >= 0 ? row[totalCol] : null);
      return { origins: clean, total: total ?? clean.reduce((sum, o) => sum + o.count, 0) };
    }
  }
  return null;
}

async function parseVisitors(dataset: CkanDataset): Promise<LocalTourismData["visitors"] | null> {
  const dated = dataset.resources
    .map((resource) => ({ resource, year: parseInt(resource.name.match(/\d{4}/)?.[0] ?? "", 10) }))
    .filter((r) => !isNaN(r.year) && ["ODS", "XLSX", "XLS"].includes(r.resource.format))
    .sort((a, b) => b.year - a.year);

  for (const { resource, year } of dated) {
    try {
      const wb = await fetchWorkbook(resource.url);
      for (const sheetName of wb.SheetNames) {
        const parsed = parseVisitorsSheet(wb.Sheets[sheetName]!);
        if (parsed) {
          return { year, ...parsed, datasetUrl: dataset.datasetUrl, license: dataset.license };
        }
      }
    } catch (err) {
      console.error(`Error parsing visitors ${resource.name}:`, err);
    }
  }
  return null;
}

export const chiclanaTourism: TourismParser = async ({ occupancy, visitors }) => {
  const [parsedOccupancy, parsedVisitors] = await Promise.all([
    occupancy ? parseOccupancy(occupancy) : null,
    visitors ? parseVisitors(visitors) : null,
  ]);
  if (!parsedOccupancy && !parsedVisitors) return null;
  return {
    occupancy: parsedOccupancy ?? undefined,
    visitors: parsedVisitors ?? undefined,
  };
};
