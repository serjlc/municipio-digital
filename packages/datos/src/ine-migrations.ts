import type { Municipality } from "@municipio/config";
import { fetchTempusTable, metaValue, municipalityFilter, tableUrl } from "./tempus";

/*
 * INE "Estadística de Migraciones y Cambios de Residencia" (EMCR), the
 * operation that replaced the old Estadística de Variaciones Residenciales:
 * net migration balances per municipality, coherent with the annual census.
 * One national table, so it works for any municipality.
 */
const BALANCES_TABLE = "69767";

export interface MigrationYear {
  year: number;
  /** Net total balance: people arriving minus people leaving */
  total: number;
  /** Net balance with other countries */
  external?: number;
  /** Net balance with the rest of Spain */
  internal?: number;
}

export interface MigrationBalances {
  years: MigrationYear[];
  latest: MigrationYear;
  tableUrl: string;
}

export async function fetchMigrationBalances(m: Municipality): Promise<MigrationBalances | null> {
  const filter = await municipalityFilter(BALANCES_TABLE, m.ineCode);
  if (!filter) return null;
  const table = await fetchTempusTable(BALANCES_TABLE, { filter });
  if (!table) return null;

  const byYear = new Map<number, MigrationYear>();
  const seriesFor = (kind: string) =>
    table.find(
      (s) => metaValue(s, "Sexo") === "Ambos sexos" && metaValue(s, "Saldo migratorio") === kind,
    );

  for (const point of seriesFor("Saldo total")?.Data ?? []) {
    if (point.Valor !== null) byYear.set(point.Anyo, { year: point.Anyo, total: point.Valor });
  }
  for (const point of seriesFor("Saldo exterior")?.Data ?? []) {
    const entry = byYear.get(point.Anyo);
    if (entry && point.Valor !== null) entry.external = point.Valor;
  }
  for (const point of seriesFor("Saldo interior")?.Data ?? []) {
    const entry = byYear.get(point.Anyo);
    if (entry && point.Valor !== null) entry.internal = point.Valor;
  }

  const years = [...byYear.values()].sort((a, b) => a.year - b.year);
  const latest = years[years.length - 1];
  if (!latest) return null;

  return { years, latest, tableUrl: tableUrl(BALANCES_TABLE) };
}
