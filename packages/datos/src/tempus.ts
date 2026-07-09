import { z } from "zod";

const metaSchema = z.array(
  z.object({
    T3_Variable: z.string().optional(),
    Nombre: z.string(),
    Codigo: z.string().nullish(),
  }),
);

const seriesSchema = z.array(
  z.object({
    Nombre: z.string(),
    MetaData: metaSchema.optional(),
    Data: z.array(
      z.object({
        Anyo: z.number(),
        Valor: z.number().nullable(),
        T3_TipoDato: z.string().nullish(),
        /** Sub-year period on monthly tables, e.g. "M05" */
        T3_Periodo: z.string().nullish(),
      }),
    ),
  }),
);

export type TempusSeries = z.infer<typeof seriesSchema>[number];

const API = "https://servicios.ine.es/wstempus/js/ES";

/** Fetches a table from the INE Tempus3 API as yearly series. */
export async function fetchTempusTable(
  tableId: string,
  options: { lastPeriods?: number; filter?: string } = {},
): Promise<TempusSeries[] | null> {
  const { lastPeriods = 45, filter } = options;
  try {
    const tv = filter ? `&tv=${encodeURIComponent(filter)}` : "";
    const res = await fetch(`${API}/DATOS_TABLA/${tableId}?nult=${lastPeriods}&tip=AM${tv}`);
    if (!res.ok) return null;
    return seriesSchema.parse(await res.json());
  } catch {
    return null;
  }
}

const filterValueSchema = z.array(
  z.object({ Id: z.number(), FK_Variable: z.number(), Codigo: z.string().nullish() }),
);

/*
 * Big national tables (every municipality x several variables) exceed the
 * API volume limit unless the request is filtered, so we resolve the
 * municipality value id from its INE code and query with `tv=`. The value
 * id is stable across tables that share the municipality variable.
 */
export async function municipalityFilter(
  tableId: string,
  ineCode: string,
): Promise<string | null> {
  try {
    const groupsRes = await fetch(`${API}/GRUPOS_TABLA/${tableId}`);
    if (!groupsRes.ok) return null;
    const groups = z.array(z.object({ Id: z.number() })).parse(await groupsRes.json());

    for (const group of groups) {
      const valuesRes = await fetch(`${API}/VALORES_GRUPOSTABLA/${tableId}/${group.Id}?det=0`);
      if (!valuesRes.ok) continue;
      const match = filterValueSchema
        .parse(await valuesRes.json())
        .find((v) => v.Codigo === ineCode);
      if (match) return `${match.FK_Variable}:${match.Id}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Value of a series dimension, e.g. metaValue(s, "Sexo") -> "Hombres" */
export function metaValue(series: TempusSeries, variable: string): string | undefined {
  return series.MetaData?.find((m) => m.T3_Variable === variable)?.Nombre;
}

export function tableUrl(tableId: string): string {
  return `https://www.ine.es/jaxiT3/Tabla.htm?t=${tableId}`;
}
