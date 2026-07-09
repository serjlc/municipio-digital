import type { Municipality } from "@municipio/config";
import { fetchTempusTable, tableUrl, type TempusSeries } from "./tempus";

/*
 * INE "Indicadores Demográficos Básicos": national Tempus3 tables with one
 * series per municipality, so the same ids work for any municipality. The
 * INE only includes municipalities above roughly 75.000 inhabitants; for
 * smaller towns every lookup misses and the connector returns null.
 */
const TABLES = {
  birthRate: "30664",
  deathRate: "30685",
  marriageRate: "30689",
  naturalGrowthRate: "30696",
  lifeExpectancy: "30687",
};

export interface VitalRatesYear {
  year: number;
  /** Births per 1.000 inhabitants */
  birthRate?: number;
  /** Deaths per 1.000 inhabitants */
  deathRate?: number;
  /** Marriages per 1.000 inhabitants */
  marriageRate?: number;
  /** Births minus deaths per 1.000 inhabitants */
  naturalGrowthRate?: number;
}

export interface LifeExpectancy {
  year: number;
  total: number;
  men?: number;
  women?: number;
}

export interface DemographicIndicators {
  rates: VitalRatesYear[];
  latest: VitalRatesYear;
  lifeExpectancy?: LifeExpectancy;
  tableUrls: Record<keyof typeof TABLES, string>;
}

function municipalitySeries(
  table: TempusSeries[] | null,
  m: Municipality,
  filter?: (name: string) => boolean,
): TempusSeries | undefined {
  return table?.find(
    (s) => s.Nombre.startsWith(`${m.name}.`) && (filter ? filter(s.Nombre) : true),
  );
}

function yearValues(series: TempusSeries | undefined): Map<number, number> {
  const byYear = new Map<number, number>();
  for (const point of series?.Data ?? []) {
    if (point.Valor !== null) byYear.set(point.Anyo, point.Valor);
  }
  return byYear;
}

export async function fetchDemographicIndicators(
  m: Municipality,
): Promise<DemographicIndicators | null> {
  const [birthTable, deathTable, marriageTable, growthTable, lifeTable] = await Promise.all([
    fetchTempusTable(TABLES.birthRate),
    fetchTempusTable(TABLES.deathRate),
    fetchTempusTable(TABLES.marriageRate),
    fetchTempusTable(TABLES.naturalGrowthRate),
    fetchTempusTable(TABLES.lifeExpectancy),
  ]);

  const births = yearValues(municipalitySeries(birthTable, m));
  const deaths = yearValues(municipalitySeries(deathTable, m));
  const marriages = yearValues(municipalitySeries(marriageTable, m));
  const growth = yearValues(municipalitySeries(growthTable, m));
  if (births.size === 0 && deaths.size === 0) return null;

  const years = [...new Set([...births.keys(), ...deaths.keys(), ...marriages.keys()])].sort(
    (a, b) => a - b,
  );
  const rates: VitalRatesYear[] = years.map((year) => ({
    year,
    birthRate: births.get(year),
    deathRate: deaths.get(year),
    marriageRate: marriages.get(year),
    naturalGrowthRate: growth.get(year),
  }));
  const latest = rates[rates.length - 1];
  if (!latest) return null;

  const lifeTotal = yearValues(municipalitySeries(lifeTable, m, (n) => n.includes(". Total.")));
  const lifeMen = yearValues(municipalitySeries(lifeTable, m, (n) => n.includes(". Hombres.")));
  const lifeWomen = yearValues(municipalitySeries(lifeTable, m, (n) => n.includes(". Mujeres.")));
  const lifeYear = Math.max(...lifeTotal.keys(), 0);
  const lifeExpectancy: LifeExpectancy | undefined =
    lifeYear > 0
      ? {
          year: lifeYear,
          total: lifeTotal.get(lifeYear)!,
          men: lifeMen.get(lifeYear),
          women: lifeWomen.get(lifeYear),
        }
      : undefined;

  return {
    rates,
    latest,
    lifeExpectancy,
    tableUrls: {
      birthRate: tableUrl(TABLES.birthRate),
      deathRate: tableUrl(TABLES.deathRate),
      marriageRate: tableUrl(TABLES.marriageRate),
      naturalGrowthRate: tableUrl(TABLES.naturalGrowthRate),
      lifeExpectancy: tableUrl(TABLES.lifeExpectancy),
    },
  };
}
