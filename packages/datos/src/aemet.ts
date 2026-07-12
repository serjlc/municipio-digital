import type { Municipality } from "@municipio/config";

/*
 * AEMET OpenData: municipal 7-day forecast for any Spanish municipality,
 * plus the current readings of the reference station and the beach
 * forecast when the config declares them. Requires the free AEMET_API_KEY
 * (see .env.example); without it every call returns null and the page
 * shows a notice instead.
 *
 * The API answers in two steps (a envelope with a `datos` URL that serves
 * the payload), the payload endpoint fails randomly (plain Tomcat error
 * pages), and everything is encoded in latin-1. All handled here.
 */
const API = "https://opendata.aemet.es/opendata/api";

async function aemetJson<T>(path: string): Promise<T | null> {
  const key = process.env.AEMET_API_KEY;
  if (!key) return null;

  /* Both steps fail randomly (Tomcat error pages, dropped sockets), so
     the whole two-step dance retries together */
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      const envelopeRes = await fetch(`${API}${path}`, { headers: { api_key: key } });
      if (!envelopeRes.ok) continue;
      const envelope = (await envelopeRes.json()) as { estado?: number; datos?: string };
      if (envelope.estado !== 200 || !envelope.datos) continue;

      const dataRes = await fetch(envelope.datos);
      if (!dataRes.ok) continue;
      const text = new TextDecoder("latin1").decode(await dataRes.arrayBuffer());
      const first = text.trimStart().charAt(0);
      if (first === "[" || first === "{") return JSON.parse(text) as T;
    } catch (err) {
      if (attempt === 2) console.error(`Error fetching AEMET ${path}:`, err);
    }
  }
  return null;
}

export interface WeatherNow {
  /** ISO timestamp of the reading */
  time: string;
  temperature: number;
  windKmh?: number;
  humidity?: number;
  stationName: string;
}

export interface ForecastDay {
  /** ISO date */
  date: string;
  min: number;
  max: number;
  sky?: string;
  rainChance?: number;
  uvMax?: number;
}

export interface BeachDay {
  date: string;
  sky?: string;
  wind?: string;
  waves?: string;
  waterTemperature?: number;
  maxTemperature?: number;
}

export interface Weather {
  now?: WeatherNow;
  days: ForecastDay[];
  beach?: { name: string; days: BeachDay[] };
}

interface ForecastPeriod<T> {
  value: T;
  periodo?: string;
  descripcion?: string;
}

type MunicipalForecast = {
  prediccion: {
    dia: {
      fecha: string;
      temperatura: { maxima: number; minima: number };
      estadoCielo: ForecastPeriod<string>[];
      probPrecipitacion: ForecastPeriod<number>[];
      uvMax?: number;
    }[];
  };
}[];

type StationReadings = { fint: string; ta?: number; vv?: number; hr?: number; ubi: string }[];

type BeachForecast = {
  nombre: string;
  prediccion: {
    dia: {
      fecha: number;
      estadoCielo?: { descripcion1?: string };
      viento?: { descripcion1?: string };
      oleaje?: { descripcion1?: string };
      tAgua?: { valor1?: number };
      tMaxima?: { valor1?: number };
    }[];
  };
}[];

const wholeDay = <T,>(periods: ForecastPeriod<T>[] | undefined) =>
  periods?.find((p) => !p.periodo || p.periodo === "00-24");

/* AEMET leaves today's whole-day description empty as the day advances */
const firstDescription = (periods: ForecastPeriod<string>[] | undefined) =>
  wholeDay(periods)?.descripcion?.trim() ||
  periods?.map((p) => p.descripcion?.trim()).find(Boolean);

function toTitleSentence(raw: string | undefined): string | undefined {
  const clean = raw?.trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : undefined;
}

function toTitleWords(raw: string): string {
  return raw
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function fetchWeather(m: Municipality): Promise<Weather | null> {
  const [forecast, readings, beach] = await Promise.all([
    aemetJson<MunicipalForecast>(`/prediccion/especifica/municipio/diaria/${m.ineCode}`),
    m.sources.aemetStation
      ? aemetJson<StationReadings>(
          `/observacion/convencional/datos/estacion/${m.sources.aemetStation}`,
        )
      : null,
    m.sources.aemetBeach
      ? aemetJson<BeachForecast>(`/prediccion/especifica/playa/${m.sources.aemetBeach}`)
      : null,
  ]);
  if (!forecast?.[0]) return null;

  const days: ForecastDay[] = forecast[0].prediccion.dia.map((day) => ({
    date: day.fecha,
    min: day.temperatura.minima,
    max: day.temperatura.maxima,
    sky: toTitleSentence(firstDescription(day.estadoCielo)),
    rainChance: wholeDay(day.probPrecipitacion)?.value,
    uvMax: day.uvMax,
  }));

  const lastReading = readings?.filter((r) => r.ta !== undefined).at(-1);
  const now: WeatherNow | undefined = lastReading
    ? {
        time: lastReading.fint,
        temperature: lastReading.ta!,
        windKmh: lastReading.vv !== undefined ? Math.round(lastReading.vv * 3.6) : undefined,
        humidity: lastReading.hr,
        stationName: toTitleWords(lastReading.ubi),
      }
    : undefined;

  const beachDays: BeachDay[] | undefined = beach?.[0]?.prediccion.dia.map((day) => ({
    date: String(day.fecha).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
    sky: toTitleSentence(day.estadoCielo?.descripcion1),
    wind: day.viento?.descripcion1,
    waves: day.oleaje?.descripcion1,
    waterTemperature: day.tAgua?.valor1,
    maxTemperature: day.tMaxima?.valor1,
  }));

  return {
    now,
    days,
    beach:
      beach?.[0] && beachDays
        ? { name: toTitleWords(beach[0].nombre), days: beachDays }
        : undefined,
  };
}
