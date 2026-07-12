import type { Municipality } from "@municipio/config";

/*
 * Registered unemployment ("paro registrado") and new contracts of every
 * Spanish municipality, published monthly by SEPE as one CSV per year
 * (latin-1, semicolon separated, counts under 5 masked as "<5"). Universal:
 * rows are keyed by INE municipality code. Two source quirks: a missing
 * file comes back as an HTML page with HTTP 200, and some years are
 * incomplete at the source (2013 stops in April, 2020 lacks December).
 */
const DATA_BASE =
  "https://sede.sepe.gob.es/es/portaltrabaja/resources/sede/datos_abiertos/datos/";
const FIRST_YEAR = 2006;

export const SEPE_CATALOG_URL =
  "https://datos.gob.es/es/catalogo/ea0041513-paro-registrado-por-municipio";

export interface EmploymentMonth {
  year: number;
  /** 1 to 12 */
  month: number;
  unemployed: number;
}

export interface ContractsMonth {
  year: number;
  month: number;
  total: number;
  /** Initial permanent contracts plus conversions; null when masked */
  permanent: number | null;
}

export interface SexAgeGroup {
  group: string;
  men: number | null;
  women: number | null;
}

export interface SectorGroup {
  sector: string;
  value: number | null;
}

export interface MunicipalEmployment {
  months: EmploymentMonth[];
  latest: EmploymentMonth;
  previous?: EmploymentMonth;
  /** Same month of the previous year, when published */
  yearAgo?: EmploymentMonth;
  peak: EmploymentMonth;
  /** Breakdowns of the latest month; masked cells come through as null */
  bySexAge: SexAgeGroup[];
  bySector: SectorGroup[];
  contracts: {
    months: ContractsMonth[];
    latest: ContractsMonth;
    yearAgo?: ContractsMonth;
  } | null;
  sourceUrl: string;
}

interface ParsedRow {
  year: number;
  month: number;
  values: (number | null)[];
}

/** "<5" means the count is masked for privacy; keep it as unknown */
function toCount(cell: string | undefined): number | null {
  if (!cell || cell.includes("<")) return null;
  const n = parseInt(cell, 10);
  return isNaN(n) ? null : n;
}

function addCounts(...values: (number | null | undefined)[]): number | null {
  let sum = 0;
  for (const v of values) {
    if (v === null || v === undefined) return null;
    sum += v;
  }
  return sum;
}

/**
 * Downloads one yearly CSV and returns the rows of the municipality with
 * the requested columns resolved by header keywords (all lowercase).
 */
async function fetchYearRows(
  file: "Paro" | "Contratos",
  year: number,
  ineCode: string,
  columns: string[][],
): Promise<ParsedRow[] | null> {
  /* The date in the query dodges the sede's cache, which stores 206 partial
     responses and replays somebody else's 500-byte range to a plain GET */
  const url = `${DATA_BASE}${file}_por_municipios_${year}_csv.csv?r=${new Date().toISOString().slice(0, 10)}`;
  try {
    /* The files exceed the 2MB cacheable limit, so no point in force-cache;
       the sede occasionally drops one of the parallel requests, so retry */
    let text: string | null = null;
    for (let attempt = 0; attempt < 2 && text === null; attempt++) {
      try {
        const res = await fetch(url);
        if (res.status === 200) {
          text = new TextDecoder("latin1").decode(await res.arrayBuffer());
        }
      } catch (err) {
        if (attempt === 1) throw err;
      }
    }
    if (text === null || text.trimStart().startsWith("<")) return null;

    const lines = text.split(/\r?\n/);
    const headerIdx = lines.findIndex((l) => l.toLowerCase().includes("digo mes"));
    if (headerIdx === -1) return null;
    const header = lines[headerIdx]!.split(";").map((h) => h.trim().toLowerCase());
    const codeCol = header.findIndex((h) => h.includes("codigo") && h.includes("municipio"));
    const monthCol = header.findIndex((h) => h.includes("digo mes"));
    const valueCols = columns.map((terms) =>
      header.findIndex((h) => terms.every((t) => h.includes(t))),
    );
    if (codeCol === -1 || monthCol === -1 || valueCols.includes(-1)) return null;

    const needle = `;${ineCode};`;
    const rows: ParsedRow[] = [];
    for (const line of lines.slice(headerIdx + 1)) {
      /* Cheap prefilter; the column check below settles ambiguous hits */
      if (!line.includes(needle)) continue;
      const cells = line.split(";").map((c) => c.trim());
      if (cells[codeCol] !== ineCode) continue;
      const ym = cells[monthCol] ?? "";
      rows.push({
        year: parseInt(ym.slice(0, 4), 10),
        month: parseInt(ym.slice(4, 6), 10),
        values: valueCols.map((col) => toCount(cells[col])),
      });
    }
    return rows.sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
  } catch (err) {
    console.error(`Error fetching SEPE ${file} ${year}:`, err);
    return null;
  }
}

const UNEMPLOYMENT_COLUMNS = [
  ["total"],
  ["hombre", "< 25"],
  ["hombre", "25 -45"],
  ["hombre", ">=45"],
  ["mujer", "< 25"],
  ["mujer", "25 -45"],
  ["mujer", ">=45"],
  ["agricultura"],
  ["industria"],
  ["construcci"],
  ["servicios"],
  ["sin empleo"],
];

const CONTRACT_COLUMNS = [
  ["total"],
  ["iniciales indefinidos hombres"],
  ["convertidos en indefinidos hombres"],
  ["iniciales indefinidos mujeres"],
  ["convertidos en indefinidos mujeres"],
];

const monthKey = (r: { year: number; month: number }) => r.year * 100 + r.month;

export async function fetchEmployment(m: Municipality): Promise<MunicipalEmployment | null> {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

  try {
    const [paroYears, contractYears] = await Promise.all([
      Promise.all(years.map((y) => fetchYearRows("Paro", y, m.ineCode, UNEMPLOYMENT_COLUMNS))),
      /* Contracts only feed the recent picture: two files are enough */
      Promise.all(
        [currentYear - 1, currentYear].map((y) =>
          fetchYearRows("Contratos", y, m.ineCode, CONTRACT_COLUMNS),
        ),
      ),
    ]);

    const paroRows = paroYears.flatMap((rows) => rows ?? []);
    const months: EmploymentMonth[] = paroRows
      .filter((r) => r.values[0] !== null)
      .map((r) => ({ year: r.year, month: r.month, unemployed: r.values[0]! }));
    const latest = months[months.length - 1];
    if (!latest) return null;

    const latestRow = paroRows.find((r) => monthKey(r) === monthKey(latest))!;
    const v = latestRow.values;
    const bySexAge: SexAgeGroup[] = [
      { group: "Menos de 25 años", men: v[1] ?? null, women: v[4] ?? null },
      { group: "De 25 a 44 años", men: v[2] ?? null, women: v[5] ?? null },
      { group: "45 años o más", men: v[3] ?? null, women: v[6] ?? null },
    ];
    const bySector: SectorGroup[] = [
      { sector: "Servicios", value: v[10] ?? null },
      { sector: "Construcción", value: v[9] ?? null },
      { sector: "Industria", value: v[8] ?? null },
      { sector: "Agricultura", value: v[7] ?? null },
      { sector: "Sin empleo anterior", value: v[11] ?? null },
    ];

    const contractRows = contractYears.flatMap((rows) => rows ?? []);
    const contractMonths: ContractsMonth[] = contractRows
      .filter((r) => r.values[0] !== null)
      .map((r) => ({
        year: r.year,
        month: r.month,
        total: r.values[0]!,
        permanent: addCounts(r.values[1], r.values[2], r.values[3], r.values[4]),
      }));
    const latestContracts = contractMonths[contractMonths.length - 1];

    return {
      months,
      latest,
      previous: months[months.length - 2],
      yearAgo: months.find((x) => x.year === latest.year - 1 && x.month === latest.month),
      peak: months.reduce((max, x) => (x.unemployed > max.unemployed ? x : max)),
      bySexAge,
      bySector,
      contracts: latestContracts
        ? {
            months: contractMonths,
            latest: latestContracts,
            yearAgo: contractMonths.find(
              (x) => x.year === latestContracts.year - 1 && x.month === latestContracts.month,
            ),
          }
        : null,
      sourceUrl: SEPE_CATALOG_URL,
    };
  } catch (err) {
    console.error("Error fetching SEPE employment:", err);
    return null;
  }
}
