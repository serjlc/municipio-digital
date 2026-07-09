import type { Municipality } from "@municipio/config";
import { fetchTempusTable, metaValue, municipalityFilter, tableUrl, type TempusSeries } from "./tempus";

/*
 * INE "Encuesta de Ocupación Hotelera", monthly hotel travelers and
 * overnight stays per "punto turístico". One national table covers every
 * point, so this works for any municipality the INE surveys (mostly
 * touristic ones); everywhere else it returns null.
 *
 * The survey was re-based in 2024 and the INE no longer serves the older
 * municipal series, so data starts there.
 */
const EOH_TABLE = "2078";

export interface TourismMonth {
  year: number;
  month: number;
  travelers: number;
  nights: number;
}

export interface TourismYear {
  year: number;
  travelers: number;
  nights: number;
  domesticNights: number;
  foreignNights: number;
}

export interface HotelTourism {
  months: TourismMonth[];
  /** Complete years only (12 months of data) */
  years: TourismYear[];
  latest: TourismYear;
  tableUrl: string;
}

type MonthKey = string; // "2025-07"

/*
 * Seasonal destinations report null for the closed-season months (the INE
 * publishes the period but no value), so null months are excluded from the
 * series while still counting towards a year being fully published.
 */
function monthlyValues(series: TempusSeries | undefined): Map<MonthKey, number> {
  const byMonth = new Map<MonthKey, number>();
  for (const point of series?.Data ?? []) {
    const month = parseInt(point.T3_Periodo?.replace(/\D/g, "") ?? "", 10);
    if (point.Valor === null || isNaN(month)) continue;
    byMonth.set(`${point.Anyo}-${String(month).padStart(2, "0")}`, point.Valor);
  }
  return byMonth;
}

function publishedMonthsPerYear(series: TempusSeries | undefined): Map<number, number> {
  const byYear = new Map<number, number>();
  for (const point of series?.Data ?? []) {
    byYear.set(point.Anyo, (byYear.get(point.Anyo) ?? 0) + 1);
  }
  return byYear;
}

function sumBoth(a: Map<MonthKey, number>, b: Map<MonthKey, number>): Map<MonthKey, number> {
  const keys = new Set([...a.keys(), ...b.keys()]);
  return new Map([...keys].sort().map((k) => [k, (a.get(k) ?? 0) + (b.get(k) ?? 0)]));
}

export async function fetchHotelTourism(m: Municipality): Promise<HotelTourism | null> {
  const filter = await municipalityFilter(EOH_TABLE, m.ineCode);
  if (!filter) return null;
  const table = await fetchTempusTable(EOH_TABLE, { filter, lastPeriods: 300 });
  if (!table) return null;

  const seriesFor = (concept: string, residence: string) =>
    table.find(
      (s) =>
        metaValue(s, "Concepto turístico") === concept &&
        metaValue(s, "RESIDENCIA/ORIGEN") === residence,
    );

  const nightsDomesticSeries = seriesFor("Pernoctaciones", "Residentes en España");
  const travelers = sumBoth(
    monthlyValues(seriesFor("Viajero", "Residentes en España")),
    monthlyValues(seriesFor("Viajero", "Residentes en el Extranjero")),
  );
  const nightsDomestic = monthlyValues(nightsDomesticSeries);
  const nightsForeign = monthlyValues(seriesFor("Pernoctaciones", "Residentes en el Extranjero"));
  const nights = sumBoth(nightsDomestic, nightsForeign);
  if (nights.size === 0) return null;

  const published = publishedMonthsPerYear(nightsDomesticSeries);

  const months: TourismMonth[] = [...nights.keys()].map((key) => {
    const [year, month] = key.split("-").map(Number);
    return {
      year: year!,
      month: month!,
      travelers: travelers.get(key) ?? 0,
      nights: nights.get(key) ?? 0,
    };
  });

  const byYear = new Map<number, TourismMonth[]>();
  for (const entry of months) {
    byYear.set(entry.year, [...(byYear.get(entry.year) ?? []), entry]);
  }
  const years: TourismYear[] = [...byYear.entries()]
    .filter(([year]) => published.get(year) === 12)
    .map(([year, list]) => ({
      year,
      travelers: list.reduce((sum, e) => sum + e.travelers, 0),
      nights: list.reduce((sum, e) => sum + e.nights, 0),
      domesticNights: [...nightsDomestic.entries()]
        .filter(([k]) => k.startsWith(`${year}-`))
        .reduce((sum, [, v]) => sum + v, 0),
      foreignNights: [...nightsForeign.entries()]
        .filter(([k]) => k.startsWith(`${year}-`))
        .reduce((sum, [, v]) => sum + v, 0),
    }))
    .sort((a, b) => a.year - b.year);

  const latest = years[years.length - 1];
  if (!latest) return null;

  return { months, years, latest, tableUrl: tableUrl(EOH_TABLE) };
}
