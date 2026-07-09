import type { Municipality } from "@municipio/config";
import { fetchTempusTable, tableUrl } from "./tempus";

/*
 * INE publishes official municipal population in one Tempus3 table per
 * province ("Cifras oficiales de población de los municipios"). There is no
 * documented formula from province code to table id, so verified ids are
 * added here as municipalities join.
 */
const POPULATION_TABLE_BY_PROVINCE: Record<string, string> = {
  "11": "2864",
};

export interface PopulationYear {
  year: number;
  total: number;
  men?: number;
  women?: number;
  provisional: boolean;
}

export interface PopulationSeries {
  years: PopulationYear[];
  latest: PopulationYear;
  tableUrl: string;
}

export async function fetchPopulation(m: Municipality): Promise<PopulationSeries | null> {
  const tableId = POPULATION_TABLE_BY_PROVINCE[m.ineCode.slice(0, 2)];
  if (!tableId) return null;

  try {
    const table = await fetchTempusTable(tableId);
    if (!table) return null;

    const seriesFor = (group: "Total" | "Hombres" | "Mujeres") =>
      table.find((s) => s.Nombre.startsWith(`${m.name}. ${group}`));

    const total = seriesFor("Total");
    if (!total) return null;
    const men = seriesFor("Hombres");
    const women = seriesFor("Mujeres");

    const byYear = new Map<number, PopulationYear>();
    for (const point of total.Data) {
      if (point.Valor === null) continue;
      byYear.set(point.Anyo, {
        year: point.Anyo,
        total: point.Valor,
        provisional: point.T3_TipoDato?.startsWith("Prov") ?? false,
      });
    }
    for (const point of men?.Data ?? []) {
      const entry = byYear.get(point.Anyo);
      if (entry && point.Valor !== null) entry.men = point.Valor;
    }
    for (const point of women?.Data ?? []) {
      const entry = byYear.get(point.Anyo);
      if (entry && point.Valor !== null) entry.women = point.Valor;
    }

    const years = [...byYear.values()].sort((a, b) => a.year - b.year);
    const latest = years[years.length - 1];
    if (!latest) return null;

    return {
      years,
      latest,
      tableUrl: tableUrl(tableId),
    };
  } catch {
    return null;
  }
}
