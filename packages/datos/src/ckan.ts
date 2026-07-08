import { z } from "zod";

const packageShowSchema = z.object({
  success: z.literal(true),
  result: z.object({
    name: z.string(),
    title: z.string(),
    license_title: z.string().nullish(),
    metadata_modified: z.string().nullish(),
    resources: z.array(
      z.object({
        name: z.string().nullish(),
        format: z.string().nullish(),
        url: z.string(),
      }),
    ),
  }),
});

export interface CkanResource {
  name: string;
  format: string;
  url: string;
}

export interface CkanDataset {
  title: string;
  license?: string;
  modified?: string;
  datasetUrl: string;
  resources: CkanResource[];
}

/**
 * Works against any CKAN portal (Chiclana, Junta de Andalucía, datos.gob.es...):
 * they all expose the same action API.
 */
export async function fetchCkanDataset(
  portalUrl: string,
  datasetId: string,
): Promise<CkanDataset | null> {
  try {
    const res = await fetch(
      `${portalUrl.replace(/\/$/, "")}/api/3/action/package_show?id=${encodeURIComponent(datasetId)}`,
    );
    if (!res.ok) return null;
    const parsed = packageShowSchema.parse(await res.json());
    const { result } = parsed;

    return {
      title: result.title,
      license: result.license_title ?? undefined,
      modified: result.metadata_modified ?? undefined,
      datasetUrl: `${portalUrl.replace(/\/$/, "")}/dataset/${result.name}`,
      resources: result.resources.map((r) => ({
        name: r.name?.trim() || "Recurso sin nombre",
        format: r.format ?? "",
        url: r.url,
      })),
    };
  } catch {
    return null;
  }
}
