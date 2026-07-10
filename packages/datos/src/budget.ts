import type { Municipality } from "@municipio/config";
import { fetchCkanDataset, type CkanDataset } from "./ckan";
import { chiclanaBudget } from "./budget-chiclana";

export interface BudgetChapter {
  /** Chapter number within its side of the budget (1-9) */
  chapter: number;
  label: string;
  /** Budgeted amount in euros */
  amount: number;
}

export interface MunicipalBudget {
  year: number;
  expenses: BudgetChapter[];
  income: BudgetChapter[];
  totalExpenses: number;
  totalIncome: number;
  datasetUrl: string;
  license?: string;
}

/*
 * Per-municipality budget files, like the padron: the Ministerio de
 * Hacienda only offers per-entity liquidations behind an interactive,
 * session-gated application (CONPREL), so the reusable source here is
 * whatever each town hall publishes in its own portal.
 */
export type BudgetParser = (dataset: CkanDataset) => Promise<MunicipalBudget | null>;

export const budgetParsers: Record<string, BudgetParser> = {
  chiclana: chiclanaBudget,
};

export async function fetchMunicipalBudget(m: Municipality): Promise<MunicipalBudget | null> {
  const portal = m.sources.ckan;
  const datasetId = m.datasets?.budget;
  const format = m.datasets?.budgetFormat;
  const parser = format ? budgetParsers[format] : undefined;
  if (!portal || !datasetId || !parser) return null;

  try {
    const dataset = await fetchCkanDataset(portal, datasetId);
    if (!dataset) return null;
    return await parser(dataset);
  } catch (err) {
    console.error("Error fetching or parsing municipal budget:", err);
    return null;
  }
}
