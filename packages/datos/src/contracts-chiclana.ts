import * as XLSX from "xlsx";
import type { CkanDataset, CkanResource } from "./ckan";
import type { ContractsParser, ContractsQuarter, MinorContract } from "./contracts";
import { fetchWorkbook, toNumber } from "./sheets";

/*
 * Adapter for the quarterly minor-contract listings Chiclana publishes in
 * its CKAN portal (one XLS/XLSX/ODS per quarter, named "LISTADO <N>
 * TRIMESTRE <year>"). The header row moves around and its wording changes
 * from file to file, so columns are located by keyword.
 */

const QUARTER_BY_NAME: Record<string, 1 | 2 | 3 | 4> = {
  primer: 1,
  segundo: 2,
  tercer: 3,
  cuarto: 4,
};

function resourcePeriod(resource: CkanResource): { year: number; quarter: 1 | 2 | 3 | 4 } | null {
  const match = resource.name.match(/(primer|segundo|tercer|cuarto)\s+trimestre\s+(\d{4})/i);
  if (!match) return null;
  return { quarter: QUARTER_BY_NAME[match[1]!.toLowerCase()]!, year: parseInt(match[2]!, 10) };
}

function findColumn(header: unknown[], predicate: (cell: string) => boolean): number {
  return header.findIndex((cell) => predicate(String(cell ?? "").toUpperCase()));
}

function parseQuarterSheet(sheet: XLSX.WorkSheet): MinorContract[] | null {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
  const headerIdx = rows.findIndex((row) =>
    (row ?? []).some((cell) => /ADJUDICATARIO|CONTRATISTA/.test(String(cell ?? "").toUpperCase())),
  );
  if (headerIdx === -1) return null;
  const header = rows[headerIdx]!;

  const contractorCol = findColumn(header, (c) => c.includes("ADJUDICATARIO") || c.includes("CONTRATISTA"));
  const subjectCol = findColumn(header, (c) => c.includes("OBJETO"));
  /* Amount column wording drifts: "IMPORTE CON IVA", "IMPORTE (IVA
     INCLUIDO)", "IMPORTE ADJUDICACIÓN"... and one 2023 file labels it just
     "IVA". Never pick "IMPORTE SIN IVA". */
  let amountCol = findColumn(header, (c) => c.includes("IMPORTE") && !c.includes("SIN IVA"));
  if (amountCol === -1) amountCol = findColumn(header, (c) => c.trim() === "IVA");
  if (contractorCol === -1 || subjectCol === -1 || amountCol === -1) return null;

  const contracts: MinorContract[] = [];
  for (const row of rows.slice(headerIdx + 1)) {
    if (!row) continue;
    const contractor = String(row[contractorCol] ?? "").trim();
    const amount = toNumber(row[amountCol]);
    if (!contractor || /^total/i.test(contractor) || amount === null) continue;
    contracts.push({
      /* Person names arrive as "FERNANDEZ,CALVO,FRANCISCO": a space after
         each comma lets them wrap and read like names */
      contractor: contractor.replace(/,(?=\S)/g, ", "),
      subject: String(row[subjectCol] ?? "").trim(),
      amount,
    });
  }
  return contracts;
}

export const chiclanaContracts: ContractsParser = async (dataset: CkanDataset) => {
  const quarterly = dataset.resources
    .map((resource) => ({ resource, period: resourcePeriod(resource) }))
    .filter((r): r is { resource: CkanResource; period: NonNullable<ReturnType<typeof resourcePeriod>> } =>
      r.period !== null,
    );
  if (quarterly.length === 0) return null;

  const quarters = await Promise.all(
    quarterly.map(async ({ resource, period }): Promise<ContractsQuarter | null> => {
      try {
        const wb = await fetchWorkbook(resource.url);
        const sheetName = wb.SheetNames[0];
        const contracts = sheetName ? parseQuarterSheet(wb.Sheets[sheetName]!) : null;
        if (!contracts || contracts.length === 0) return null;
        return {
          ...period,
          contracts,
          totalAmount: contracts.reduce((sum, c) => sum + c.amount, 0),
        };
      } catch (err) {
        console.error(`Error parsing minor contracts ${resource.name}:`, err);
        return null;
      }
    }),
  );

  return quarters.filter((q): q is ContractsQuarter => q !== null);
};
