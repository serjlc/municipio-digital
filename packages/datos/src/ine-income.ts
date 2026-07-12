import type { Municipality } from "@municipio/config";
import { z } from "zod";
import { fetchTempusTable, tableUrl } from "./tempus";

/*
 * Atlas de Distribución de Renta de los Hogares (ADRH): average household
 * and per-person income for every municipality, district and census
 * section in Spain, derived from tax records. One Tempus3 table per
 * province; there is no formula from province code to table id, so
 * verified ids are registered here as municipalities join. Each
 * territorial level lives in its own Tempus3 variable (municipality 19,
 * district 846, section 847) and the API only accepts one unit per
 * request, so the connector asks unit by unit in small batches.
 */
const INCOME_TABLE_BY_PROVINCE: Record<string, string> = {
  "11": "30824",
};

const API = "https://servicios.ine.es/wstempus/js/ES";

export interface IncomeYear {
  year: number;
  /** Renta neta media por persona, in euros */
  perPerson: number | null;
  /** Renta neta media por hogar, in euros */
  perHousehold: number | null;
  /** Mediana de la renta por unidad de consumo, in euros */
  medianPerUnit: number | null;
}

export interface IncomeUnit {
  /** INE code: 5 digits (municipality), 7 (district) or 10 (section) */
  code: string;
  level: "municipality" | "district" | "section";
  district?: number;
  section?: number;
  years: IncomeYear[];
}

export interface IncomeDistribution {
  municipality: IncomeUnit;
  districts: IncomeUnit[];
  sections: IncomeUnit[];
  /** Latest year with published municipal data */
  latestYear: number;
  tableUrl: string;
}

const groupsSchema = z.array(z.object({ Id: z.number() }));
const valuesSchema = z.array(
  z.object({ Id: z.number(), FK_Variable: z.number(), Codigo: z.string().nullish() }),
);

/** Every territorial unit of the municipality present in the table */
async function territorialUnits(
  tableId: string,
  ineCode: string,
): Promise<{ id: number; variable: number; code: string }[]> {
  const groupsRes = await fetch(`${API}/GRUPOS_TABLA/${tableId}`);
  if (!groupsRes.ok) return [];
  const groups = groupsSchema.parse(await groupsRes.json());

  for (const group of groups) {
    const valuesRes = await fetch(`${API}/VALORES_GRUPOSTABLA/${tableId}/${group.Id}?det=0`);
    if (!valuesRes.ok) continue;
    const units = valuesSchema
      .parse(await valuesRes.json())
      .filter((v) => v.Codigo?.startsWith(ineCode))
      .map((v) => ({ id: v.Id, variable: v.FK_Variable, code: v.Codigo! }));
    if (units.length > 0) return units;
  }
  return [];
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    results.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  }
  return results;
}

async function fetchUnit(
  tableId: string,
  unit: { id: number; variable: number; code: string },
): Promise<IncomeUnit | null> {
  const table = await fetchTempusTable(tableId, {
    lastPeriods: 30,
    filter: `${unit.variable}:${unit.id}`,
  });
  if (!table) return null;

  const perPerson = table.find((s) => s.Nombre.includes("Renta neta media por persona"));
  const perHousehold = table.find((s) => s.Nombre.includes("Renta neta media por hogar"));
  const medianPerUnit = table.find((s) =>
    s.Nombre.includes("Mediana de la renta por unidad de consumo"),
  );

  const byYear = new Map<number, IncomeYear>();
  const entry = (year: number) => {
    let e = byYear.get(year);
    if (!e) {
      e = { year, perPerson: null, perHousehold: null, medianPerUnit: null };
      byYear.set(year, e);
    }
    return e;
  };
  for (const p of perPerson?.Data ?? []) entry(p.Anyo).perPerson = p.Valor;
  for (const p of perHousehold?.Data ?? []) entry(p.Anyo).perHousehold = p.Valor;
  for (const p of medianPerUnit?.Data ?? []) entry(p.Anyo).medianPerUnit = p.Valor;

  const level = unit.code.length === 5 ? "municipality" : unit.code.length === 7 ? "district" : "section";
  return {
    code: unit.code,
    level,
    district: level === "municipality" ? undefined : parseInt(unit.code.slice(5, 7), 10),
    section: level === "section" ? parseInt(unit.code.slice(7), 10) : undefined,
    years: [...byYear.values()].sort((a, b) => a.year - b.year),
  };
}

export async function fetchIncomeDistribution(
  m: Municipality,
): Promise<IncomeDistribution | null> {
  const tableId = INCOME_TABLE_BY_PROVINCE[m.ineCode.slice(0, 2)];
  if (!tableId) return null;

  try {
    const units = await territorialUnits(tableId, m.ineCode);
    if (units.length === 0) return null;

    const fetched = (await inBatches(units, 8, (u) => fetchUnit(tableId, u))).filter(
      (u): u is IncomeUnit => u !== null,
    );
    const municipality = fetched.find((u) => u.level === "municipality");
    if (!municipality) return null;

    const latestYear = [...municipality.years]
      .reverse()
      .find((y) => y.perPerson !== null || y.perHousehold !== null)?.year;
    if (!latestYear) return null;

    const byNumber = (a: IncomeUnit, b: IncomeUnit) =>
      (a.district ?? 0) * 1000 + (a.section ?? 0) - ((b.district ?? 0) * 1000 + (b.section ?? 0));

    return {
      municipality,
      districts: fetched.filter((u) => u.level === "district").sort(byNumber),
      sections: fetched.filter((u) => u.level === "section").sort(byNumber),
      latestYear,
      tableUrl: tableUrl(tableId),
    };
  } catch (err) {
    console.error("Error fetching income distribution:", err);
    return null;
  }
}
