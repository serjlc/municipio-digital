import type { Municipality } from "@municipio/config";
import { fetchCkanDataset, type CkanDataset } from "./ckan";
import { chiclanaContracts } from "./contracts-chiclana";

export interface MinorContract {
  /** Company or person awarded the contract, as published by the town hall */
  contractor: string;
  subject: string;
  /** Awarded amount in euros, VAT included */
  amount: number;
}

export interface ContractsQuarter {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  contracts: MinorContract[];
  totalAmount: number;
}

export interface MinorContractsData {
  quarters: ContractsQuarter[];
  latest: ContractsQuarter;
  datasetUrl: string;
  license?: string;
  modified?: string;
}

/**
 * Town halls must publish their minor contracts (LCSP art. 63.4) but each
 * one formats the files its own way, so parsing lives in per-municipality
 * adapters picked through `datasets.minorContractsFormat`, like the padron.
 */
export type ContractsParser = (dataset: CkanDataset) => Promise<ContractsQuarter[] | null>;

export const contractsParsers: Record<string, ContractsParser> = {
  chiclana: chiclanaContracts,
};

export async function fetchMinorContracts(m: Municipality): Promise<MinorContractsData | null> {
  const portal = m.sources.ckan;
  const datasetId = m.datasets?.minorContracts;
  const format = m.datasets?.minorContractsFormat;
  const parser = format ? contractsParsers[format] : undefined;
  if (!portal || !datasetId || !parser) return null;

  try {
    const dataset = await fetchCkanDataset(portal, datasetId);
    if (!dataset) return null;

    const quarters = await parser(dataset);
    if (!quarters || quarters.length === 0) return null;

    const sorted = [...quarters].sort((a, b) => a.year - b.year || a.quarter - b.quarter);
    return {
      quarters: sorted,
      latest: sorted[sorted.length - 1]!,
      datasetUrl: dataset.datasetUrl,
      license: dataset.license,
      modified: dataset.modified,
    };
  } catch (err) {
    console.error("Error fetching or parsing minor contracts:", err);
    return null;
  }
}
