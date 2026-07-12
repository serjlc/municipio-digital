/*
 * Extracts one municipality's urban heat dataset: summer land surface
 * temperature per census section (Landsat) crossed with the construction
 * year of its buildings (Catastro INSPIRE).
 *
 * Sources, both open and keyless:
 *  - Landsat Collection 2 Level-2 surface temperature (USGS/NASA, public
 *    domain), read as cloud-optimized GeoTIFFs from Microsoft Planetary
 *    Computer, whose SAS signing endpoint works anonymously.
 *  - Catastro INSPIRE buildings (ATOM download per municipality), which
 *    carry the construction date of every building. Outside the common
 *    territory (Basque Country, Navarre) there is no INSPIRE download and
 *    the construction half is skipped.
 *
 * A Landsat scene is a ~200MB raster and the buildings GML above ~100MB,
 * so this runs offline once per season and the portal commits the small
 * JSON result (same approach as extract-serpavi.mjs).
 *
 * Usage:
 *   node packages/datos/scripts/extract-heat.mjs \
 *     packages/municipio/src/<town>-sections.json <ine-code> <summer-year> \
 *     > packages/municipio/src/<town>-heat.json
 *   e.g. ... chiclana-sections.json 11015 2025 > chiclana-heat.json
 *
 * Then declare the JSON in the municipality config as `heatData`.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { unzipSync } = require("fflate");

const [, , sectionsFile, ineCode, summerArg] = process.argv;
if (!sectionsFile || !ineCode || !summerArg) {
  console.error("Usage: extract-heat.mjs <sections.json> <ine-code> <summer-year>");
  process.exit(1);
}
const summer = parseInt(summerArg, 10);
const MAX_CLOUD = 10;
const STAC = "https://planetarycomputer.microsoft.com/api/stac/v1";
const SAS = "https://planetarycomputer.microsoft.com/api/sas/v1/sign";
const CATASTRO_ATOM = "https://www.catastro.hacienda.gob.es/INSPIRE/buildings";

/* ---------- geometry helpers ---------- */

/** WGS84/GRS80 transverse Mercator, standard UTM parameters */
const A = 6378137;
const F = 1 / 298.257223563;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);
const K0 = 0.9996;

function lonLatToUtm(lon, lat, zone) {
  const phi = (lat * Math.PI) / 180;
  const lam = ((lon - (zone * 6 - 183)) * Math.PI) / 180;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const N = A / Math.sqrt(1 - E2 * sin * sin);
  const T = (sin / cos) ** 2;
  const C = EP2 * cos * cos;
  const Aa = cos * lam;
  const M =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * phi -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi));
  const x =
    K0 * N * (Aa + ((1 - T + C) * Aa ** 3) / 6 + ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Aa ** 5) / 120) +
    500000;
  const y =
    K0 *
    (M +
      N *
        (sin / cos) *
        ((Aa * Aa) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Aa ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Aa ** 6) / 720));
  return [x, y];
}

function utmToLonLat(x, y, zone) {
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const M = y / K0;
  const mu = M / (A * (1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 * e1) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = sin1 / cos1;
  const C1 = EP2 * cos1 * cos1;
  const T1 = tan1 * tan1;
  const N1 = A / Math.sqrt(1 - E2 * sin1 * sin1);
  const R1 = (A * (1 - E2)) / (1 - E2 * sin1 * sin1) ** 1.5;
  const D = (x - 500000) / (N1 * K0);
  const lat =
    phi1 -
    ((N1 * tan1) / R1) *
      ((D * D) / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * EP2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * EP2 - 3 * C1 * C1) * D ** 6) / 720);
  const lon =
    (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * EP2 + 24 * T1 * T1) * D ** 5) / 120) /
    cos1;
  return [(zone * 6 - 183) + (lon * 180) / Math.PI, (lat * 180) / Math.PI];
}

/** Even-odd ray casting over every ring of a section */
function contains(rings, lon, lat) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

const sections = JSON.parse(readFileSync(sectionsFile, "utf8"));
const indexed = sections.map((s) => {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  for (const ring of s.rings) {
    for (const [lon, lat] of ring) {
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { ...s, minLon, maxLon, minLat, maxLat };
});
const bbox = [
  Math.min(...indexed.map((s) => s.minLon)),
  Math.min(...indexed.map((s) => s.minLat)),
  Math.max(...indexed.map((s) => s.maxLon)),
  Math.max(...indexed.map((s) => s.maxLat)),
];

function sectionAt(lon, lat) {
  for (const s of indexed) {
    if (lon < s.minLon || lon > s.maxLon || lat < s.minLat || lat > s.maxLat) continue;
    if (contains(s.rings, lon, lat)) return s;
  }
  return null;
}

/* ---------- part 1: Landsat surface temperature ---------- */

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

async function signedCog(href) {
  const { fromUrl } = await import("geotiff");
  const signed = await fetchJson(`${SAS}?href=${encodeURIComponent(href)}`);
  return fromUrl(signed.href);
}

/** QA_PIXEL bits: fill, dilated cloud, cirrus, cloud, cloud shadow */
const QA_MASK = 0b11111;

async function landsatPerSection() {
  const search = await fetchJson(`${STAC}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      collections: ["landsat-c2-l2"],
      bbox,
      datetime: `${summer}-06-01T00:00:00Z/${summer}-08-31T23:59:59Z`,
      query: { "eo:cloud_cover": { lt: MAX_CLOUD }, platform: { in: ["landsat-8", "landsat-9"] } },
      limit: 50,
    }),
  });
  if (search.features.length === 0) {
    throw new Error(`No Landsat scenes with cloud cover under ${MAX_CLOUD}% for summer ${summer}`);
  }

  const perScene = [];
  const scenes = [];
  for (const item of search.features) {
    const zone = (item.properties["proj:epsg"] ?? item.properties["proj:code"]) % 100;
    console.error(`Landsat ${item.id} (${item.properties.datetime.slice(0, 10)})...`);
    const [st, qa] = await Promise.all([
      signedCog(item.assets.lwir11.href),
      signedCog(item.assets.qa_pixel.href),
    ]);
    const image = await st.getImage();
    const qaImage = await qa.getImage();
    const [ox, oy] = image.getOrigin();
    const res = image.getResolution()[0];

    const corners = [
      lonLatToUtm(bbox[0], bbox[1], zone),
      lonLatToUtm(bbox[0], bbox[3], zone),
      lonLatToUtm(bbox[2], bbox[1], zone),
      lonLatToUtm(bbox[2], bbox[3], zone),
    ];
    const left = Math.max(0, Math.floor((Math.min(...corners.map((c) => c[0])) - ox) / res));
    const right = Math.min(image.getWidth(), Math.ceil((Math.max(...corners.map((c) => c[0])) - ox) / res));
    const top = Math.max(0, Math.floor((oy - Math.max(...corners.map((c) => c[1]))) / res));
    const bottom = Math.min(image.getHeight(), Math.ceil((oy - Math.min(...corners.map((c) => c[1]))) / res));
    if (right <= left || bottom <= top) continue;

    const window = [left, top, right, bottom];
    const [stData] = await image.readRasters({ window });
    const [qaData] = await qaImage.readRasters({ window });

    const stats = new Map();
    const width = right - left;
    for (let i = 0; i < stData.length; i++) {
      const dn = stData[i];
      if (dn === 0 || (qaData[i] & QA_MASK) !== 0) continue;
      const px = ox + (left + (i % width) + 0.5) * res;
      const py = oy - (top + Math.floor(i / width) + 0.5) * res;
      const [lon, lat] = utmToLonLat(px, py, zone);
      const section = sectionAt(lon, lat);
      if (!section) continue;
      const key = `${section.district}-${section.section}`;
      const acc = stats.get(key) ?? { sum: 0, count: 0 };
      acc.sum += dn * 0.00341802 + 149 - 273.15;
      acc.count += 1;
      stats.set(key, acc);
    }
    if (stats.size === 0) continue;
    perScene.push(stats);
    scenes.push({
      id: item.id,
      date: item.properties.datetime.slice(0, 10),
      cloudCover: Math.round(item.properties["eo:cloud_cover"] * 10) / 10,
    });
  }

  /*
   * A scene that only clips the edge of a section (swath border, cloud
   * mask) would drag its mean toward one corner, so a scene only counts
   * for a section when it covers at least half of the pixels that the
   * best scene sees there.
   */
  const result = new Map();
  for (const s of indexed) {
    const key = `${s.district}-${s.section}`;
    const seen = perScene.map((m) => m.get(key)).filter(Boolean);
    if (seen.length === 0) continue;
    const fullCount = Math.max(...seen.map((a) => a.count));
    const usable = seen.filter((a) => a.count >= fullCount / 2);
    const mean = usable.reduce((t, a) => t + a.sum / a.count, 0) / usable.length;
    result.set(key, { tempC: Math.round(mean * 10) / 10, samples: fullCount });
  }
  return { scenes, bySection: result };
}

/* ---------- part 2: Catastro construction years ---------- */

async function catastroPerSection() {
  const provinceCode = ineCode.slice(0, 2);
  const atomUrl = `${CATASTRO_ATOM}/${provinceCode}/ES.SDGC.bu.atom_${provinceCode}.xml`;
  const atom = await (await fetch(atomUrl)).text();
  const link = atom.match(new RegExp(`href="([^"]*\\.BU\\.${ineCode}\\.zip)"`, "i"));
  if (!link) throw new Error(`Municipality ${ineCode} not found in ${atomUrl}`);
  const zipUrl = encodeURI(link[1]);

  console.error(`Catastro ${zipUrl}...`);
  const zip = new Uint8Array(await (await fetch(zipUrl)).arrayBuffer());
  const files = unzipSync(zip, { filter: (f) => f.name.endsWith(".building.gml") });
  const gmlName = Object.keys(files)[0];
  if (!gmlName) throw new Error("No building.gml inside the Catastro zip");
  const gml = new TextDecoder("latin1").decode(files[gmlName]);

  const years = new Map();
  let total = 0;
  const all = [];
  for (const block of gml.split("<gml:featureMember>").slice(1)) {
    const condition = block.match(/<bu-core2d:conditionOfConstruction>([^<]*)</);
    if (!condition || condition[1] !== "functional") continue;
    const year = parseInt(
      block.match(/<bu-core2d:end>(\d{4})/)?.[1] ?? block.match(/<bu-core2d:beginning>(\d{4})/)?.[1] ?? "",
      10,
    );
    if (!Number.isFinite(year) || year < 1000 || year > summer + 1) continue;
    const srs = block.match(/srsName="urn:ogc:def:crs:EPSG::258(\d\d)"/);
    const lower = block.match(/<gml:lowerCorner>([\d.]+) ([\d.]+)</);
    const upper = block.match(/<gml:upperCorner>([\d.]+) ([\d.]+)</);
    if (!srs || !lower || !upper) continue;
    const [lon, lat] = utmToLonLat(
      (parseFloat(lower[1]) + parseFloat(upper[1])) / 2,
      (parseFloat(lower[2]) + parseFloat(upper[2])) / 2,
      parseInt(srs[1], 10),
    );
    const section = sectionAt(lon, lat);
    if (!section) continue;
    const key = `${section.district}-${section.section}`;
    (years.get(key) ?? years.set(key, []).get(key)).push(year);
    all.push(year);
    total += 1;
  }

  const median = (list) => {
    const sorted = [...list].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const bySection = new Map(
    [...years].map(([key, list]) => [key, { medianYear: median(list), buildings: list.length }]),
  );
  return { total, municipalityMedian: all.length ? median(all) : null, bySection };
}

/* ---------- assemble ---------- */

const landsat = await landsatPerSection();
const catastro = await catastroPerSection().catch((error) => {
  console.error(`Catastro skipped: ${error.message}`);
  return { total: 0, municipalityMedian: null, bySection: new Map() };
});

const rows = indexed
  .map((s) => {
    const key = `${s.district}-${s.section}`;
    const temp = landsat.bySection.get(key);
    const built = catastro.bySection.get(key);
    return {
      district: s.district,
      section: s.section,
      tempC: temp?.tempC ?? null,
      medianYear: built?.medianYear ?? null,
      buildings: built?.buildings ?? 0,
    };
  })
  .filter((r) => r.tempC !== null || r.medianYear !== null);

const municipalTemp =
  rows.filter((r) => r.tempC !== null).reduce((t, r) => t + r.tempC, 0) /
  rows.filter((r) => r.tempC !== null).length;

console.log(
  JSON.stringify(
    {
      summer,
      generated: new Date().toISOString().slice(0, 10),
      scenes: landsat.scenes,
      municipality: {
        tempC: Math.round(municipalTemp * 10) / 10,
        medianYear: catastro.municipalityMedian,
        buildings: catastro.total,
      },
      sections: rows,
    },
    null,
    2,
  ),
);
