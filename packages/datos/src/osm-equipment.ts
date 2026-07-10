import type { Municipality } from "@municipio/config";
import { z } from "zod";

/*
 * Public equipment inside the municipality from OpenStreetMap, through the
 * Overpass API. Universal: Spanish municipalities carry their INE code in
 * the `ine:municipio` tag, so the same query works everywhere. Data is
 * ODbL and the map credits it; unnamed elements are skipped (mostly noise
 * like private pitches).
 */
/* Main instance plus a public mirror: Overpass rate-limits generously
   but a daily build should never lose the layer to one bad minute */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export interface EquipmentCategory {
  id: string;
  label: string;
  points: { name: string; lat: number; lon: number }[];
}

const CATEGORIES: { id: string; label: string; filter: string; tags: string[] }[] = [
  {
    id: "salud",
    label: "Salud y farmacias",
    filter: '["amenity"~"^(hospital|clinic|doctors|pharmacy)$"]',
    tags: ["hospital", "clinic", "doctors", "pharmacy"],
  },
  {
    id: "educacion",
    label: "Educación",
    filter: '["amenity"~"^(school|kindergarten|university)$"]',
    tags: ["school", "kindergarten", "university"],
  },
  {
    id: "deporte",
    label: "Deporte",
    filter: '["leisure"~"^(sports_centre|stadium)$"]',
    tags: ["sports_centre", "stadium"],
  },
  {
    id: "cultura",
    label: "Cultura y social",
    filter: '["amenity"~"^(library|theatre|arts_centre|community_centre|social_facility)$"]',
    tags: ["library", "theatre", "arts_centre", "community_centre", "social_facility"],
  },
];

const responseSchema = z.object({
  elements: z.array(
    z.object({
      lat: z.number().optional(),
      lon: z.number().optional(),
      center: z.object({ lat: z.number(), lon: z.number() }).optional(),
      tags: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

export async function fetchEquipment(m: Municipality): Promise<EquipmentCategory[] | null> {
  const filters = CATEGORIES.map((c) => `  nwr${c.filter}(area.a);`).join("\n");
  const query = `[out:json][timeout:40];\narea["ine:municipio"="${m.ineCode}"]->.a;\n(\n${filters}\n);\nout tags center 600;`;

  try {
    let elements: z.infer<typeof responseSchema>["elements"] | null = null;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            /* Overpass rejects anonymous user agents (406) */
            "User-Agent": "municipio-digital/0.1 (https://github.com/serjlc/municipio-digital)",
          },
          body: `data=${encodeURIComponent(query)}`,
        });
        if (!res.ok) continue;
        elements = responseSchema.parse(await res.json()).elements;
        break;
      } catch (err) {
        console.error(`Overpass ${endpoint} failed:`, err);
      }
    }
    if (!elements) return null;

    const categories: EquipmentCategory[] = CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      points: [],
    }));
    for (const el of elements) {
      const name = el.tags?.name?.trim();
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (!name || lat === undefined || lon === undefined) continue;
      const kind = el.tags?.amenity ?? el.tags?.leisure ?? "";
      const idx = CATEGORIES.findIndex((cat) => cat.tags.includes(kind));
      categories[idx]?.points.push({ name, lat, lon });
    }
    for (const c of categories) c.points.sort((a, b) => a.name.localeCompare(b.name, "es"));

    return categories.some((c) => c.points.length > 0) ? categories : null;
  } catch (err) {
    console.error("Error fetching OSM equipment:", err);
    return null;
  }
}
