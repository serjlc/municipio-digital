export interface SectionBoundary {
  district: number;
  section: number;
  rings: [number, number][][];
}

/*
 * Equirectangular projection is plenty for a single town: latitude
 * flipped (SVG grows downwards) and longitude corrected by cos(latitude)
 * so shapes keep their aspect.
 */
export function projectSections(boundaries: SectionBoundary[]) {
  const lats = boundaries.flatMap((b) => b.rings.flat().map(([, lat]) => lat));
  const lons = boundaries.flatMap((b) => b.rings.flat().map(([lon]) => lon));
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const stretch = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));

  const width = 100;
  const scale = width / ((maxLon - minLon) * stretch);
  const height = (maxLat - minLat) * scale;
  const x = (lon: number) => (lon - minLon) * stretch * scale;
  const y = (lat: number) => (maxLat - lat) * scale;

  return {
    width,
    height,
    paths: boundaries.map((b) => ({
      district: b.district,
      section: b.section,
      d: b.rings
        .map(
          (ring) =>
            ring
              .map(([lon, lat], i) => `${i === 0 ? "M" : "L"}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`)
              .join("") + "Z",
        )
        .join(""),
    })),
  };
}
