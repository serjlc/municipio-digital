import type { Municipality } from "@municipio/config";
import { fetchTempusTable, metaValue, municipalityFilter, tableUrl } from "./tempus";

/*
 * INE "Censo Anual de Población": annual municipal detail since 2021,
 * published every year (the successor of the old Padrón Continuo detail,
 * which stopped in 2022). Population by age is one table per province with
 * no documented id formula, so verified ids are added as municipalities
 * join; education lives in a single national table.
 */
const PYRAMID_TABLE_BY_PROVINCE: Record<string, string> = {
  "11": "69145",
};

const EDUCATION_TABLE = "66621";

export interface AgeGroup {
  label: string; // e.g. "0-4", "5-9"... "100+"
  men: number;
  women: number;
}

export interface CensusPyramid {
  year: number;
  groups: AgeGroup[];
  tableUrl: string;
}

function ageLabel(name: string): string | null {
  if (name === "Todas las edades") return null;
  const range = name.match(/^De (\d+) a (\d+) años$/);
  if (range) return `${range[1]}-${range[2]}`;
  const open = name.match(/^(\d+) y más años$/);
  if (open) return `${open[1]}+`;
  return null;
}

export async function fetchCensusPyramid(m: Municipality): Promise<CensusPyramid | null> {
  const tableId = PYRAMID_TABLE_BY_PROVINCE[m.ineCode.slice(0, 2)];
  if (!tableId) return null;

  const filter = await municipalityFilter(tableId, m.ineCode);
  if (!filter) return null;
  const table = await fetchTempusTable(tableId, { filter, lastPeriods: 1 });
  if (!table) return null;

  const groups = new Map<string, AgeGroup>();
  let year = 0;
  for (const series of table) {
    const sex = metaValue(series, "Sexo");
    const nationality = metaValue(series, "Nacionalidad");
    /* Ages are split across two variables: the five-year brackets live in
       "Grupos de edad" and the open-ended "100 y más años" bracket in
       "Semiintervalos de edad" */
    const age =
      metaValue(series, "Grupos de edad") ?? metaValue(series, "Semiintervalos de edad") ?? "";
    const label = ageLabel(age);
    if (!label || (sex !== "Hombres" && sex !== "Mujeres")) continue;
    if (nationality !== undefined && nationality !== "Total") continue;
    const point = series.Data.find((p) => p.Valor !== null);
    if (!point) continue;

    year = Math.max(year, point.Anyo);
    const group = groups.get(label) ?? { label, men: 0, women: 0 };
    if (sex === "Hombres") group.men = point.Valor!;
    else group.women = point.Valor!;
    groups.set(label, group);
  }
  if (groups.size === 0) return null;

  const sorted = [...groups.values()].sort((a, b) => parseInt(a.label, 10) - parseInt(b.label, 10));
  return { year, groups: sorted, tableUrl: tableUrl(tableId) };
}

export interface EducationLevel {
  label: string;
  count: number;
}

export interface EducationLevels {
  year: number;
  /** Population aged 15 and over, the universe of the education census */
  population: number;
  levels: EducationLevel[];
  tableUrl: string;
}

export async function fetchEducationLevels(m: Municipality): Promise<EducationLevels | null> {
  const filter = await municipalityFilter(EDUCATION_TABLE, m.ineCode);
  if (!filter) return null;
  const table = await fetchTempusTable(EDUCATION_TABLE, { filter, lastPeriods: 1 });
  if (!table) return null;

  const relevant = table.filter(
    (s) =>
      metaValue(s, "Sexo") === "Total" &&
      metaValue(s, "Países") === "Total" &&
      metaValue(s, "Nivel de formación alcanzado") !== undefined,
  );

  let year = 0;
  let population = 0;
  const levels: EducationLevel[] = [];
  for (const series of relevant) {
    const level = metaValue(series, "Nivel de formación alcanzado")!;
    const point = series.Data.find((p) => p.Valor !== null);
    if (!point) continue;
    year = Math.max(year, point.Anyo);
    if (level === "Total") population = point.Valor!;
    else levels.push({ label: level, count: point.Valor! });
  }
  if (levels.length === 0) return null;

  return { year, population, levels, tableUrl: tableUrl(EDUCATION_TABLE) };
}
