import type { Municipality } from "@municipio/config";
import { unzipSync, strFromU8 } from "fflate";

/*
 * Public transport lines serving the municipality, read from a standard
 * GTFS feed declared in the municipality config (Spain concentrates them
 * in nap.transportes.gob.es; Andalusia's consortia also publish openly).
 * The feed covers a whole region, so stops are filtered to the town: by
 * point-in-polygon against the census section outlines when the config
 * has them, by distance to the town centre otherwise.
 */

export interface TransitLine {
  shortName: string;
  longName: string;
  /** Departures from stops inside the town on a typical weekday */
  weekdayDepartures: number;
  first?: string;
  last?: string;
  /** Official page of the line (route_url), when the feed provides it */
  url?: string;
}

export interface TransitStop {
  name: string;
  lat: number;
  lon: number;
}

export interface TransitData {
  lines: TransitLine[];
  stops: TransitStop[];
  feed: { url: string; name: string; href: string; license?: string };
}

/** Minimal CSV split that honours double quotes (GTFS allows them) */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else cell += ch;
  }
  cells.push(cell);
  return cells;
}

function parseTable(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = splitCsvLine(lines[0]!.replace(/^﻿/, ""));
  return { header, rows: lines.slice(1).map(splitCsvLine) };
}

function pointInRing(lon: number, lat: number, ring: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[j]!;
    if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

/** "07:05:00" (or "25:10:00", GTFS allows past-midnight) to minutes */
function toMinutes(time: string): number | null {
  const match = time.match(/^(\d+):(\d\d)/);
  return match ? parseInt(match[1]!, 10) * 60 + parseInt(match[2]!, 10) : null;
}

function toLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

const NEARBY_KM = 5;

export async function fetchTransit(m: Municipality): Promise<TransitData | null> {
  const feed = m.sources.gtfsFeed;
  if (!feed) return null;

  try {
    const res = await fetch(feed.url);
    if (!res.ok) return null;
    const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
    const table = (name: string) => {
      const file = files[name];
      return file ? parseTable(strFromU8(file)) : null;
    };

    const stopsTable = table("stops.txt");
    const routesTable = table("routes.txt");
    const tripsTable = table("trips.txt");
    const timesTable = table("stop_times.txt");
    if (!stopsTable || !routesTable || !tripsTable || !timesTable) return null;

    const col = (t: { header: string[] }, name: string) => t.header.indexOf(name);

    /* Stops inside the town */
    const insideTown = m.sectionBoundaries?.length
      ? (lon: number, lat: number) =>
          m.sectionBoundaries!.some((s) => s.rings.some((ring) => pointInRing(lon, lat, ring)))
      : (lon: number, lat: number) => {
          const dLat = (lat - m.coordinates.lat) * 111;
          const dLon =
            (lon - m.coordinates.lon) * 111 * Math.cos((m.coordinates.lat * Math.PI) / 180);
          return Math.hypot(dLat, dLon) <= NEARBY_KM;
        };

    const sId = col(stopsTable, "stop_id");
    const sName = col(stopsTable, "stop_name");
    const sLat = col(stopsTable, "stop_lat");
    const sLon = col(stopsTable, "stop_lon");
    const townStops = new Map<string, TransitStop>();
    for (const row of stopsTable.rows) {
      const lat = parseFloat(row[sLat] ?? "");
      const lon = parseFloat(row[sLon] ?? "");
      if (!isNaN(lat) && !isNaN(lon) && insideTown(lon, lat)) {
        townStops.set(row[sId]!, { name: row[sName] ?? "", lat, lon });
      }
    }
    if (townStops.size === 0) return null;

    /* Weekday services; without calendar.txt every service counts */
    const calendarTable = table("calendar.txt");
    let weekdayServices: Set<string> | null = null;
    if (calendarTable) {
      const cId = col(calendarTable, "service_id");
      const cMonday = col(calendarTable, "monday");
      weekdayServices = new Set(
        calendarTable.rows.filter((r) => r[cMonday] === "1").map((r) => r[cId]!),
      );
    }

    const tId = col(tripsTable, "trip_id");
    const tRoute = col(tripsTable, "route_id");
    const tService = col(tripsTable, "service_id");
    const trips = new Map(tripsTable.rows.map((r) => [r[tId]!, r]));

    /* Earliest town-stop departure of each weekday trip, grouped by route */
    const stId = col(timesTable, "stop_id");
    const stTrip = col(timesTable, "trip_id");
    const stDeparture = col(timesTable, "departure_time");
    const seenTrips = new Set<string>();
    const departuresByRoute = new Map<string, number[]>();
    for (const row of timesTable.rows) {
      if (!townStops.has(row[stId] ?? "")) continue;
      const tripId = row[stTrip]!;
      if (seenTrips.has(tripId)) continue;
      seenTrips.add(tripId);
      const trip = trips.get(tripId);
      if (!trip || (weekdayServices && !weekdayServices.has(trip[tService]!))) continue;
      const minutes = toMinutes(row[stDeparture] ?? "");
      if (minutes === null) continue;
      const routeId = trip[tRoute]!;
      const list = departuresByRoute.get(routeId);
      if (list) list.push(minutes);
      else departuresByRoute.set(routeId, [minutes]);
    }

    const rId = col(routesTable, "route_id");
    const rShort = col(routesTable, "route_short_name");
    const rLong = col(routesTable, "route_long_name");
    const rUrl = col(routesTable, "route_url");
    const lines: TransitLine[] = [];
    for (const row of routesTable.rows) {
      const departures = departuresByRoute.get(row[rId] ?? "");
      if (!departures || departures.length === 0) continue;
      lines.push({
        shortName: row[rShort] ?? "",
        longName: row[rLong] ?? "",
        weekdayDepartures: departures.length,
        first: toLabel(Math.min(...departures)),
        last: toLabel(Math.max(...departures)),
        url: rUrl >= 0 ? row[rUrl] || undefined : undefined,
      });
    }
    lines.sort((a, b) => b.weekdayDepartures - a.weekdayDepartures);

    return { lines, stops: [...townStops.values()], feed };
  } catch (err) {
    console.error("Error fetching GTFS transit data:", err);
    return null;
  }
}
