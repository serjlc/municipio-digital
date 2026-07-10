import { municipality } from "@municipio/config";
import { fetchWeather } from "@municipio/datos";
import { NextResponse } from "next/server";

export const revalidate = 1800;

/** Minimal payload for the header weather pill */
export async function GET() {
  const weather = await fetchWeather(municipality);
  if (!weather) {
    return NextResponse.json({}, { status: 503 });
  }
  return NextResponse.json({
    temperature: weather.now?.temperature ?? null,
    sky: weather.days[0]?.sky ?? null,
    max: weather.days[0]?.max ?? null,
  });
}
