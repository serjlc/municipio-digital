import * as XLSX from "xlsx";
import type { CkanDataset } from "./ckan";
import { fetchWorkbook } from "./sheets";
import type { Street, StreetsParser } from "./streets";

/*
 * Adapter for Chiclana's official street gazetteer ("Callejero oficial del
 * municipio por distritos y secciones"): one row per street stretch with a
 * "DISTRITO 01/SECCION 001" zone column and names in the town hall's own
 * shorthand, e.g. "ALBINAS (LAS) (CALLE)" or "NOVO SANCTI PETRI (URB)".
 */

const TYPE_LABELS: Record<string, string> = {
  CALLE: "Calle",
  CMNO: "Camino",
  URB: "Urbanización",
  BARDA: "Barriada",
  AVDA: "Avenida",
  PLAZA: "Plaza",
  CTRA: "Carretera",
  CLLON: "Callejón",
  PAGO: "Pago",
  GTA: "Glorieta",
  CÑADA: "Cañada",
  TRVA: "Travesía",
  LUGAR: "Lugar",
  PLZLA: "Plazoleta",
  PQUE: "Parque",
  PSAJE: "Pasaje",
  PASEO: "Paseo",
  RONDA: "Ronda",
};

/** Zone-like street types used to describe what each district contains */
const ZONE_TYPES = new Set(["URB", "BARDA", "PAGO", "LUGAR"]);

/* Single buildings and residential complexes are zone-typed in the
   gazetteer but nobody would recognize a district by them */
const NOT_A_ZONE = /^(edificio|apartamentos|aparthotel|hotel|c\.?\s?r\.?\s|residencial|conjunto|bloque)/i;

const MINOR_WORDS = new Set(["de", "del", "la", "las", "los", "el", "y"]);

function titleCase(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => (i > 0 && MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

/** "ALBINAS (LAS) (CALLE)" -> { display: "Calle Las Albinas", type: "CALLE" } */
function parseName(raw: string): { display: string; type: string | null } {
  const groups = [...raw.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]!.trim());
  const base = raw.replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  const type = groups.find((g) => TYPE_LABELS[g]) ?? null;
  const article = groups.find((g) => !TYPE_LABELS[g]);

  const name = titleCase(article ? `${article} ${base}` : base);
  const display = type ? `${TYPE_LABELS[type]} ${name}` : name;
  return { display, type };
}

export const chiclanaStreets: StreetsParser = async (dataset: CkanDataset) => {
  const resource = dataset.resources.find(
    (r) => r.format === "XLSX" && r.name.toLowerCase().includes("distrito"),
  );
  if (!resource) return null;

  const wb = await fetchWorkbook(resource.url);
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return null;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName]!, { header: 1 });

  const seen = new Map<string, Street>();
  const zoneSections = new Map<number, Map<string, Set<number>>>();

  for (const row of rows) {
    if (!row) continue;
    const zone = String(row[0] ?? "").match(/DISTRITO\s*(\d+)\s*\/\s*SECCION\s*(\d+)/i);
    const rawName = String(row[2] ?? "").trim();
    if (!zone || !rawName) continue;
    const district = parseInt(zone[1]!, 10);
    const section = parseInt(zone[2]!, 10);
    const { display, type } = parseName(rawName);

    const key = `${display}|${district}|${section}`;
    if (!seen.has(key)) seen.set(key, { name: display, district, section });

    if (type && ZONE_TYPES.has(type)) {
      const bare = display.replace(`${TYPE_LABELS[type]} `, "");
      if (NOT_A_ZONE.test(bare)) continue;
      const zones = zoneSections.get(district) ?? new Map<string, Set<number>>();
      const sections = zones.get(bare) ?? new Set<number>();
      sections.add(section);
      zones.set(bare, sections);
      zoneSections.set(district, zones);
    }
  }
  if (seen.size === 0) return null;

  /* Every zone, alphabetically: any ranking of "recognizable" would be
     editorial. The UI shows a few and offers the rest on demand. */
  const zonesByDistrict: Record<number, string[]> = {};
  for (const [district, zones] of zoneSections) {
    zonesByDistrict[district] = [...zones.keys()].sort((a, b) => a.localeCompare(b, "es"));
  }

  return {
    streets: [...seen.values()].sort((a, b) => a.name.localeCompare(b.name, "es")),
    zonesByDistrict,
    datasetUrl: dataset.datasetUrl,
    license: dataset.license,
  };
};
