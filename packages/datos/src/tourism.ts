import type { Municipality } from "@municipio/config";
import { fetchCkanDataset, type CkanDataset } from "./ckan";
import { chiclanaTourism } from "./tourism-chiclana";

export interface OccupancyYear {
  year: number;
  /** Average occupancy percentage (0-100) per month, January first */
  months: (number | null)[];
}

export interface LocalOccupancy {
  years: OccupancyYear[];
  /** What the town hall says the figures cover, shown next to the chart */
  scope?: string;
  datasetUrl: string;
  license?: string;
}

export interface VisitorOrigin {
  label: string;
  count: number;
}

export interface LocalVisitors {
  year: number;
  origins: VisitorOrigin[];
  total: number;
  datasetUrl: string;
  license?: string;
}

export interface LocalTourismData {
  occupancy?: LocalOccupancy;
  visitors?: LocalVisitors;
}

/**
 * Local tourism files (hotel occupancy compiled by the town hall, visitor
 * counts at tourist offices) have no standard format, so parsing lives in
 * per-municipality adapters picked through `datasets.tourism.format`.
 */
export type TourismParser = (datasets: {
  occupancy?: CkanDataset;
  visitors?: CkanDataset;
}) => Promise<LocalTourismData | null>;

export const tourismParsers: Record<string, TourismParser> = {
  chiclana: chiclanaTourism,
};

export async function fetchLocalTourism(m: Municipality): Promise<LocalTourismData | null> {
  const portal = m.sources.ckan;
  const config = m.datasets?.tourism;
  const parser = config?.format ? tourismParsers[config.format] : undefined;
  if (!portal || !config || !parser) return null;

  try {
    const [occupancy, visitors] = await Promise.all([
      config.occupancy ? fetchCkanDataset(portal, config.occupancy) : null,
      config.visitors ? fetchCkanDataset(portal, config.visitors) : null,
    ]);
    if (!occupancy && !visitors) return null;
    return await parser({ occupancy: occupancy ?? undefined, visitors: visitors ?? undefined });
  } catch (err) {
    console.error("Error fetching or parsing local tourism data:", err);
    return null;
  }
}
