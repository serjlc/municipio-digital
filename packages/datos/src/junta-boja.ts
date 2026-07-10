import type { Municipality } from "@municipio/config";
import { z } from "zod";

/*
 * Dispositions of the BOJA (the official gazette of Andalucía) that
 * mention the municipality, from the Junta's content API (the same
 * backend behind its open-data BOJA datasets, CC BY 4.0). Regional
 * connector: it only activates for Andalusian municipalities.
 */
const API = "https://www.juntadeandalucia.es/ssdigitales/datasets/contentapi/search/boja.json";

const responseSchema = z.object({
  numResultados: z.number(),
  resultado: z.array(
    z.object({
      _source: z.object({
        data: z.object({
          t_year: z.number(),
          t_number: z.number(),
          t_dispositionNumber: z.number(),
          t_asumarioNoHtml: z.string().nullish(),
          t_organisation: z.string().nullish(),
          t_typeDisposition: z.string().nullish(),
          t_sectionN1: z.string().nullish(),
          d_dateUTC: z.string().nullish(),
          l_pdf: z
            .array(z.object({ t_publicUrl: z.string().nullish() }))
            .nullish(),
        }),
      }),
    }),
  ),
});

export interface BojaMention {
  /** Publication date of the bulletin, ISO */
  date?: string;
  title: string;
  organisation?: string;
  type?: string;
  section?: string;
  bulletin: number;
  year: number;
  htmlUrl: string;
  pdfUrl?: string;
}

export interface BojaMentions {
  items: BojaMention[];
  totalAllTime: number;
  totalThisYear: number;
  year: number;
  sourceUrl: string;
}

async function search(phrase: string, extra: string, size: number): Promise<z.infer<typeof responseSchema> | null> {
  const q = encodeURIComponent(`data.t_bodyNoHtml:"${phrase}"${extra}`);
  const res = await fetch(
    `${API}?q=${q}&_source=data&size=${size}&sort=${encodeURIComponent("data.d_dateUTC:desc")}`,
  );
  if (!res.ok) return null;
  return responseSchema.parse(await res.json());
}

export async function fetchBojaMentions(m: Municipality): Promise<BojaMentions | null> {
  if (m.region !== "andalucia") return null;
  const year = new Date().getFullYear();

  try {
    const [latest, thisYear] = await Promise.all([
      search(m.name, "", 15),
      search(m.name, ` AND data.t_year:${year}`, 1),
    ]);
    if (!latest) return null;

    const items: BojaMention[] = latest.resultado.map(({ _source: { data } }) => ({
      date: data.d_dateUTC ?? undefined,
      title: data.t_asumarioNoHtml?.trim() || "Disposición sin extracto",
      organisation: data.t_organisation ?? undefined,
      type: data.t_typeDisposition ?? undefined,
      section: data.t_sectionN1 ?? undefined,
      bulletin: data.t_number,
      year: data.t_year,
      htmlUrl: `https://www.juntadeandalucia.es/boja/${data.t_year}/${data.t_number}/${data.t_dispositionNumber}`,
      pdfUrl: data.l_pdf?.[0]?.t_publicUrl ?? undefined,
    }));

    return {
      items,
      totalAllTime: latest.numResultados,
      totalThisYear: thisYear?.numResultados ?? 0,
      year,
      sourceUrl: "https://www.juntadeandalucia.es/boja",
    };
  } catch (err) {
    console.error("Error fetching BOJA mentions:", err);
    return null;
  }
}
