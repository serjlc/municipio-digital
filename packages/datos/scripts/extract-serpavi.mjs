/*
 * Extracts one municipality's rental prices from the SERPAVI database
 * (Sistema Estatal de Referencia del Precio del Alquiler de Vivienda).
 *
 * The ministry publishes SERPAVI as a single ~70MB XLSX covering every
 * municipality and census section in Spain, behind a CDN that rejects
 * non-browser user agents, under a URL that drifts with each yearly
 * edition. Parsing it needs ~2GB of memory. All of that rules out a live
 * connector, so the portal ships a small per-municipality JSON extracted
 * once per edition with this script (same approach as the section
 * boundaries): the data is universal, only the extraction is offline.
 *
 * Usage:
 *   1. Download the current "bd_SERPAVI" XLSX from
 *      https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi
 *   2. node --max-old-space-size=3000 packages/datos/scripts/extract-serpavi.mjs \
 *        <file.xlsx> <ine-code> <edition-label> > packages/municipio/src/<town>-rent.json
 *      e.g. ... serpavi.xlsx 11015 "marzo de 2026 (datos 2011-2024)"
 *   3. Declare it in the municipality config as `rentPrices`.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const [, , file, ineCode, edition] = process.argv;
if (!file || !ineCode) {
  console.error("Usage: extract-serpavi.mjs <file.xlsx> <ine-code> [edition-label]");
  process.exit(1);
}

const wb = XLSX.read(readFileSync(file), { dense: true });

/** Column indexes per year for one indicator prefix, e.g. "ALQTBID12_M_VC" */
function yearColumns(header, prefix) {
  const byYear = new Map();
  header.forEach((name, idx) => {
    const match = typeof name === "string" && name.match(new RegExp(`^${prefix}_(\\d{2})$`));
    if (match) byYear.set(2000 + parseInt(match[1], 10), idx);
  });
  return byYear;
}

const round = (v, digits) =>
  typeof v === "number" ? Math.round(v * 10 ** digits) / 10 ** digits : null;

/** { "2024": { rent, rentM2, count } } for one sheet row */
function valuesByYear(header, row, typology, withCount) {
  const rent = yearColumns(header, `ALQTBID12_M_${typology}`);
  const rentM2 = yearColumns(header, `ALQM2_LV_M_${typology}`);
  const count = yearColumns(header, `BI_ALVHEPCO_T${typology}`);
  const out = {};
  for (const [year, idx] of rent) {
    const value = {
      rent: round(row[idx], 1),
      rentM2: round(row[rentM2.get(year) ?? -1], 2),
    };
    if (withCount) value.count = row[count.get(year) ?? -1] ?? null;
    if (value.rent !== null || value.rentM2 !== null) out[year] = value;
  }
  return out;
}

const municipios = XLSX.utils.sheet_to_json(wb.Sheets["Municipios"], { header: 1 });
const townRow = municipios.find((r) => String(r[2]).padStart(5, "0") === ineCode);
if (!townRow) {
  console.error(`Municipality ${ineCode} not found`);
  process.exit(1);
}

const secciones = XLSX.utils.sheet_to_json(wb.Sheets["Secciones censales"], { header: 1 });
const sectionRows = secciones.filter((r) => String(r[2]).padStart(5, "0") === ineCode);

const years = [...yearColumns(municipios[0], "ALQTBID12_M_VC").keys()].sort();
const result = {
  edition: edition ?? "",
  years,
  municipality: {
    flats: valuesByYear(municipios[0], townRow, "VC", true),
    houses: valuesByYear(municipios[0], townRow, "VU", true),
  },
  sections: sectionRows
    .map((r) => {
      const code = String(r[4]).padStart(10, "0");
      return {
        district: parseInt(code.slice(5, 7), 10),
        section: parseInt(code.slice(7), 10),
        flats: valuesByYear(secciones[0], r, "VC", false),
      };
    })
    .filter((s) => Object.keys(s.flats).length > 0),
};

console.log(JSON.stringify(result, null, 2));
