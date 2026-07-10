import type { CkanDataset, CkanResource } from "./ckan";
import type { BudgetChapter, BudgetParser, MunicipalBudget } from "./budget";

/*
 * Adapter for Chiclana's initial budget CSVs ("Tabla de gastos/ingresos
 * del año YYYY"): hierarchical rows where chapters start with "CAP. I".
 * The files are technically broken CSV (decimal commas without quoting
 * split every amount in two fields), so rows are parsed with a pattern
 * instead of a CSV reader.
 */

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9 };

/* "CAP. I GASTOS DE PERSONAL,28.738.740,00€,0,00€" */
const ROW = /^(.*?),([\d.]+),(\d{2})€,([\d.]+),(\d{2})€\s*$/;

function titleCase(raw: string): string {
  const minor = new Set(["de", "del", "la", "las", "los", "el", "y", "a", "e", "o"]);
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && minor.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function parseChapters(csv: string): BudgetChapter[] {
  const chapters: BudgetChapter[] = [];
  for (const line of csv.split(/\r?\n/)) {
    const row = line.match(ROW);
    if (!row) continue;
    const cap = row[1]!.trim().match(/^CAP\.\s*([IVX]+)\s+(.+)$/);
    if (!cap || !(cap[1]! in ROMAN)) continue;
    const euros = parseInt(row[2]!.replace(/\./g, ""), 10) + parseInt(row[3]!, 10) / 100;
    chapters.push({ chapter: ROMAN[cap[1]!]!, label: titleCase(cap[2]!), amount: euros });
  }
  return chapters.sort((a, b) => a.chapter - b.chapter);
}

function resourceYear(resource: CkanResource): number {
  return parseInt(resource.name.match(/\d{4}/)?.[0] ?? "", 10);
}

export const chiclanaBudget: BudgetParser = async (dataset: CkanDataset) => {
  const csvs = dataset.resources.filter((r) => r.format === "CSV" && !isNaN(resourceYear(r)));
  const years = [...new Set(csvs.map(resourceYear))].sort((a, b) => b - a);

  for (const year of years) {
    const expensesRes = csvs.find((r) => resourceYear(r) === year && /gasto/i.test(r.name));
    const incomeRes = csvs.find((r) => resourceYear(r) === year && /ingreso/i.test(r.name));
    if (!expensesRes || !incomeRes) continue;

    const [expensesCsv, incomeCsv] = await Promise.all([
      fetch(expensesRes.url).then((res) => res.text()),
      fetch(incomeRes.url).then((res) => res.text()),
    ]);
    const expenses = parseChapters(expensesCsv);
    const income = parseChapters(incomeCsv);
    if (expenses.length === 0 || income.length === 0) continue;

    const budget: MunicipalBudget = {
      year,
      expenses,
      income,
      totalExpenses: expenses.reduce((sum, c) => sum + c.amount, 0),
      totalIncome: income.reduce((sum, c) => sum + c.amount, 0),
      datasetUrl: dataset.datasetUrl,
      license: dataset.license,
    };
    return budget;
  }
  return null;
};
