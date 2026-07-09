import { municipality } from "@municipio/config";
import { fetchStreetGazetteer } from "@municipio/datos";
import { NextResponse } from "next/server";

export const revalidate = 86400;

/*
 * Slim street list for the "which district do I live in" finder. Served
 * from its own cached endpoint so the demographics page only downloads
 * the ~3.000 streets when someone actually uses the search box.
 */
export async function GET() {
  const gazetteer = await fetchStreetGazetteer(municipality);
  if (!gazetteer) {
    return NextResponse.json({ streets: [] }, { status: 503 });
  }
  return NextResponse.json({
    streets: gazetteer.streets.map((s) => [s.name, s.district, s.section]),
  });
}
