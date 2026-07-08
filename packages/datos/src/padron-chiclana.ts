import * as XLSX from "xlsx";
import type { CkanDataset } from "./ckan";
import type { AgeGroup, BirthsDeathsYearly, DistrictPopulation, PadronParser } from "./padron";

/*
 * Adapter for the padron files Chiclana publishes in its CKAN portal: an
 * XLSB of microdata (one row per inhabitant, SEXO/EDAD columns) for the age
 * pyramid, plus XLSX workbooks whose "Total Distrito N" rows summarize
 * districts, births and deaths, with one sheet per year.
 *
 * If your town publishes different files, write a sibling adapter and
 * register it in `padronParsers` (padron.ts).
 */

/* Sex labels seen in Spanish padron files; rows with anything else are
   skipped rather than guessed */
const MALE_LABELS = new Set(["varón", "varon", "hombre", "v", "h"]);
const FEMALE_LABELS = new Set(["mujer", "m"]);

function parseAgePyramid(sheet: XLSX.WorkSheet): AgeGroup[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const counts: Record<string, { men: number; women: number }> = {};

  for (const row of rows) {
    const sex = String(row.SEXO ?? row.Sexo ?? "")
      .trim()
      .toLowerCase();
    const age = parseInt(String(row.EDAD ?? row.Edad), 10);
    if (isNaN(age)) continue;

    const groupStart = Math.floor(age / 5) * 5;
    const groupLabel = groupStart >= 95 ? "95+" : `${groupStart}-${groupStart + 4}`;
    const grp = (counts[groupLabel] ??= { men: 0, women: 0 });

    if (MALE_LABELS.has(sex)) grp.men++;
    else if (FEMALE_LABELS.has(sex)) grp.women++;
  }

  const getGroupVal = (g: string) => {
    if (g === "95+") return 95;
    const firstPart = g.split("-")[0];
    return firstPart ? parseInt(firstPart, 10) : 0;
  };

  const sortedGroups = Object.keys(counts).sort((a, b) => getGroupVal(a) - getGroupVal(b));

  return sortedGroups.map((group) => {
    const grp = counts[group]!;
    return {
      label: group,
      men: grp.men,
      women: grp.women,
    };
  });
}

function toCount(value: unknown): number {
  return parseInt(String(value ?? ""), 10) || 0;
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

function extractBirthsOrDeaths(sheet: XLSX.WorkSheet): Record<number, number> {
  const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const yearlyTotals: Record<number, number> = {};
  if (data.length < 2) return yearlyTotals;

  const header = data[0] || [];
  const yearCols: { year: number; colIndex: number }[] = [];
  header.forEach((val, idx) => {
    const parsed = parseInt(String(val), 10);
    if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
      yearCols.push({ year: parsed, colIndex: idx });
    }
  });

  for (const row of data) {
    if (!row || row.length === 0) continue;
    const cell0 = String(row[0] ?? "").trim();
    if (cell0.toLowerCase().startsWith("total distrito")) {
      for (const { year, colIndex } of yearCols) {
        yearlyTotals[year] = (yearlyTotals[year] || 0) + toCount(row[colIndex]);
      }
    }
  }

  return yearlyTotals;
}

async function fetchWorkbook(url: string): Promise<XLSX.WorkBook> {
  const buf = await fetch(url).then((res) => res.arrayBuffer());
  return XLSX.read(buf, { type: "buffer" });
}

function firstSheet(wb: XLSX.WorkBook | null): XLSX.WorkSheet | null {
  const name = wb?.SheetNames[0];
  return (name && wb?.Sheets[name]) || null;
}

export const chiclanaPadron: PadronParser = async (dataset: CkanDataset) => {
  const findResource = (keyword: string, format: string) =>
    dataset.resources.find((r) => r.name.toLowerCase().includes(keyword) && r.format === format);

  const piramideRes = findResource("pirámide", "XLSB");
  const distritosRes = findResource("distrito", "XLSX");
  const birthsRes = findResource("nacimiento", "XLSX");
  const deathsRes = findResource("defuncion", "XLSX");

  if (!piramideRes || !distritosRes) {
    return null;
  }

  const optionalWorkbook = (url: string | undefined, what: string) =>
    url
      ? fetchWorkbook(url).catch((err): null => {
          console.error(`Error fetching ${what}:`, err);
          return null;
        })
      : Promise.resolve(null);

  const [piramideWb, distritosWb, birthsWb, deathsWb] = await Promise.all([
    fetchWorkbook(piramideRes.url),
    fetchWorkbook(distritosRes.url),
    optionalWorkbook(birthsRes?.url, "births"),
    optionalWorkbook(deathsRes?.url, "deaths"),
  ]);

  const piramideSheet = firstSheet(piramideWb);
  if (!piramideSheet) return null;
  const agePyramid = parseAgePyramid(piramideSheet);

  /* Districts workbook has one sheet per year; pick the most recent */
  const yearSheets = distritosWb.SheetNames.filter((n) => /^\d{4}$/.test(n)).sort();
  const latestSheetName =
    yearSheets[yearSheets.length - 1] ?? distritosWb.SheetNames[distritosWb.SheetNames.length - 1];
  if (!latestSheetName) return null;
  const distritosSheet = distritosWb.Sheets[latestSheetName];
  if (!distritosSheet) return null;
  const districts = parseDistricts(distritosSheet);

  const birthsSheet = firstSheet(birthsWb);
  const deathsSheet = firstSheet(deathsWb);
  const birthsTotals = birthsSheet ? extractBirthsOrDeaths(birthsSheet) : {};
  const deathsTotals = deathsSheet ? extractBirthsOrDeaths(deathsSheet) : {};

  const yearsSet = new Set([...Object.keys(birthsTotals), ...Object.keys(deathsTotals)].map(Number));
  const yearlySeries: BirthsDeathsYearly[] = Array.from(yearsSet)
    .map((year) => ({
      year,
      births: birthsTotals[year] || 0,
      deaths: deathsTotals[year] || 0,
    }))
    .sort((a, b) => a.year - b.year);

  const yearMatch = piramideRes.name.match(/\d{4}/);
  const year = yearMatch
    ? parseInt(yearMatch[0], 10)
    : /^\d{4}$/.test(latestSheetName)
      ? parseInt(latestSheetName, 10)
      : new Date().getFullYear();

  return {
    year,
    agePyramid,
    districts,
    yearlySeries,
  };
};
