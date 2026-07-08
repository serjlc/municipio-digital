import type { Municipality } from "@municipio/config";
import { fetchCkanDataset, type CkanDataset } from "./ckan";
import { chiclanaPadron } from "./padron-chiclana";

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

/**
 * There is no standard format for the padron files that town halls publish,
 * so each municipality contributes an adapter that turns its CKAN dataset
 * into the shared PadronData types. The municipality config picks one by
 * name through `datasets.padronFormat`; without one, the portal simply
 * skips the padron sections.
 */
export type PadronParser = (dataset: CkanDataset) => Promise<PadronData | null>;

export const padronParsers: Record<string, PadronParser> = {
  chiclana: chiclanaPadron,
};

export async function fetchPadronData(m: Municipality): Promise<PadronData | null> {
  const portal = m.sources.ckan;
  const datasetId = m.datasets?.padron;
  const format = m.datasets?.padronFormat;
  const parser = format ? padronParsers[format] : undefined;
  if (!portal || !datasetId || !parser) return null;

  try {
    const dataset = await fetchCkanDataset(portal, datasetId);
    if (!dataset) return null;
    return await parser(dataset);
  } catch (err) {
    console.error("Error fetching or parsing CKAN padron data:", err);
    return null;
  }
}
