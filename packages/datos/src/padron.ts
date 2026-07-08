import type { Municipality } from "@municipio/config";
import * as XLSX from "xlsx";
import { fetchCkanDataset } from "./ckan";

export interface AgeGroup {
  label: string; // e.g. "0-4", "5-9"...
  men: number;
  women: number;
}

export interface SectionPopulation {
  section: number;
  men: number;
  women: number;
  total: number;
}

export interface DistrictPopulation {
  name: string; // e.g. "Distrito 1"
  men: number;
  women: number;
  total: number;
  sections: SectionPopulation[];
}

export interface BirthsDeathsYearly {
  year: number;
  births: number;
  deaths: number;
}

export interface PadronData {
  year: number;
  agePyramid: AgeGroup[];
  districts: DistrictPopulation[];
  yearlySeries: BirthsDeathsYearly[];
}

function parseAgePyramid(sheet: XLSX.WorkSheet): AgeGroup[] {
  const rows = XLSX.utils.sheet_to_json<any>(sheet);
  const counts: Record<string, { men: number; women: number }> = {};

  for (const row of rows) {
    const sex = String(row.SEXO || row.Sexo || "").trim(); // "Varón", "Mujer"
    const ageVal = row.EDAD !== undefined ? row.EDAD : row.Edad;
    const age = parseInt(String(ageVal), 10);
    if (isNaN(age)) continue;

    const groupStart = Math.floor(age / 5) * 5;
    const groupEnd = groupStart + 4;
    // Cap at 95+ to keep it clean.
    let groupLabel = `${groupStart}-${groupEnd}`;
    if (groupStart >= 95) {
      groupLabel = "95+";
    }

    if (!counts[groupLabel]) {
      counts[groupLabel] = { men: 0, women: 0 };
    }

    const grp = counts[groupLabel]!;

    const isMale =
      sex.toLowerCase().startsWith("v") ||
      sex.toLowerCase().startsWith("h") ||
      sex.toLowerCase().startsWith("m"); // Varón, Hombre, Male
    
    // In Chiclana they use "Varón" and "Mujer"
    if (sex.toLowerCase() === "varón" || sex.toLowerCase() === "varon" || sex.toLowerCase() === "hombre") {
      grp.men++;
    } else if (sex.toLowerCase() === "mujer") {
      grp.women++;
    } else {
      // fallback just in case
      if (isMale) grp.men++;
      else grp.women++;
    }
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

function parseDistricts(sheet: XLSX.WorkSheet): DistrictPopulation[] {
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const districts: DistrictPopulation[] = [];
  let currentDistrict: DistrictPopulation | null = null;

  for (const row of data) {
    if (!row || row.length === 0) continue;
    const cell0 = String(row[0] || "").trim();

    if (cell0.toLowerCase().startsWith("total distrito")) {
      // e.g. "Total Distrito 1"
      const name = cell0.replace(/total\s+/i, ""); // "Distrito 1"
      currentDistrict = {
        name,
        women: parseInt(row[1], 10) || 0,
        men: parseInt(row[2], 10) || 0,
        total: parseInt(row[3], 10) || 0,
        sections: [],
      };
      districts.push(currentDistrict);
    } else if (currentDistrict && /^\d+$/.test(cell0)) {
      // Section row
      const sectionNum = parseInt(cell0, 10);
      currentDistrict.sections.push({
        section: sectionNum,
        women: parseInt(row[1], 10) || 0,
        men: parseInt(row[2], 10) || 0,
        total: parseInt(row[3], 10) || 0,
      });
    }
  }

  return districts;
}

function extractBirthsOrDeaths(sheet: XLSX.WorkSheet): Record<number, number> {
  const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
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
    const cell0 = String(row[0] || "").trim();
    if (cell0.toLowerCase().startsWith("total distrito")) {
      for (const { year, colIndex } of yearCols) {
        const val = parseInt(row[colIndex], 10) || 0;
        yearlyTotals[year] = (yearlyTotals[year] || 0) + val;
      }
    }
  }

  return yearlyTotals;
}

export async function fetchPadronData(m: Municipality): Promise<PadronData | null> {
  if (!m.sources.ckan || !m.datasets?.padron) return null;

  try {
    const dataset = await fetchCkanDataset(m.sources.ckan, m.datasets.padron);
    if (!dataset) return null;

    // 1. Age pyramid (XLSB)
    const piramideRes = dataset.resources.find(
      (r) => r.name.toLowerCase().includes("pirámide") && r.format === "XLSB",
    );
    // 2. Districts (XLSX)
    const distritosRes = dataset.resources.find(
      (r) => r.name.toLowerCase().includes("distrito") && r.format === "XLSX",
    );
    // 3. Births (XLSX)
    const birthsRes = dataset.resources.find(
      (r) => r.name.toLowerCase().includes("nacimiento") && r.format === "XLSX",
    );
    // 4. Deaths (XLSX)
    const deathsRes = dataset.resources.find(
      (r) => r.name.toLowerCase().includes("defuncion") && r.format === "XLSX",
    );

    if (!piramideRes || !distritosRes) {
      return null;
    }

    // Fetch and parse Age Pyramid (XLSB)
    const piramideBuf = await fetch(piramideRes.url).then((res) => res.arrayBuffer());
    const piramideWb = XLSX.read(piramideBuf, { type: "buffer" });
    const firstPiramideSheet = piramideWb.SheetNames[0];
    if (!firstPiramideSheet) return null;
    const piramideSheet = piramideWb.Sheets[firstPiramideSheet];
    if (!piramideSheet) return null;
    const agePyramid = parseAgePyramid(piramideSheet);

    // Fetch and parse Districts (XLSX)
    const distritosBuf = await fetch(distritosRes.url).then((res) => res.arrayBuffer());
    const distritosWb = XLSX.read(distritosBuf, { type: "buffer" });
    const latestSheetName = distritosWb.SheetNames.includes("2023")
      ? "2023"
      : distritosWb.SheetNames[distritosWb.SheetNames.length - 1];
    if (!latestSheetName) return null;
    const distritosSheet = distritosWb.Sheets[latestSheetName];
    if (!distritosSheet) return null;
    const districts = parseDistricts(distritosSheet);

    // Fetch births and deaths (optional)
    let birthsTotals: Record<number, number> = {};
    let deathsTotals: Record<number, number> = {};

    if (birthsRes) {
      try {
        const buf = await fetch(birthsRes.url).then((res) => res.arrayBuffer());
        const wb = XLSX.read(buf, { type: "buffer" });
        const sheetName = wb.SheetNames[0];
        if (sheetName) {
          const sheet = wb.Sheets[sheetName];
          if (sheet) birthsTotals = extractBirthsOrDeaths(sheet);
        }
      } catch (e) {
        console.error("Error parsing births:", e);
      }
    }

    if (deathsRes) {
      try {
        const buf = await fetch(deathsRes.url).then((res) => res.arrayBuffer());
        const wb = XLSX.read(buf, { type: "buffer" });
        const sheetName = wb.SheetNames[0];
        if (sheetName) {
          const sheet = wb.Sheets[sheetName];
          if (sheet) deathsTotals = extractBirthsOrDeaths(sheet);
        }
      } catch (e) {
        console.error("Error parsing deaths:", e);
      }
    }

    // Merge births and deaths into a yearly series
    const yearsSet = new Set([...Object.keys(birthsTotals), ...Object.keys(deathsTotals)].map(Number));
    const yearlySeries: BirthsDeathsYearly[] = Array.from(yearsSet)
      .map((year) => ({
        year,
        births: birthsTotals[year] || 0,
        deaths: deathsTotals[year] || 0,
      }))
      .sort((a, b) => a.year - b.year);

    const yearMatch = piramideRes.name.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : 2023;

    return {
      year,
      agePyramid,
      districts,
      yearlySeries,
    };
  } catch (err) {
    console.error("Error fetching or parsing CKAN Padrón data:", err);
    return null;
  }
}
