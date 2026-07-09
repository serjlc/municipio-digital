import type { Municipality } from "@municipio/config";
import { fetchCkanDataset, type CkanDataset } from "./ckan";
import { chiclanaStreets } from "./streets-chiclana";

export interface Street {
  /** Display name, e.g. "Calle Ayala" or "Urbanización Novo Sancti Petri" */
  name: string;
  district: number;
  section: number;
}

export interface StreetGazetteer {
  streets: Street[];
  /** Recognizable zones (urbanizations, quarters) per district number */
  zonesByDistrict: Record<number, string[]>;
  datasetUrl: string;
  license?: string;
}

/**
 * Official street gazetteers have no standard format either, so each
 * municipality contributes an adapter picked through
 * `datasets.streetsFormat`, like the padron and the contracts.
 */
export type StreetsParser = (dataset: CkanDataset) => Promise<StreetGazetteer | null>;

export const streetsParsers: Record<string, StreetsParser> = {
  chiclana: chiclanaStreets,
};

export async function fetchStreetGazetteer(m: Municipality): Promise<StreetGazetteer | null> {
  const portal = m.sources.ckan;
  const datasetId = m.datasets?.streets;
  const format = m.datasets?.streetsFormat;
  const parser = format ? streetsParsers[format] : undefined;
  if (!portal || !datasetId || !parser) return null;

  try {
    const dataset = await fetchCkanDataset(portal, datasetId);
    if (!dataset) return null;
    return await parser(dataset);
  } catch (err) {
    console.error("Error fetching or parsing street gazetteer:", err);
    return null;
  }
}
