"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { cn } from "./cn";
import { Chip } from "./chip";
import { SearchInput } from "./search-input";
import type { SectionBoundary } from "./district-stats";

export interface MapPoint {
  name: string;
  lat: number;
  lon: number;
}

export interface MapCategory {
  id: string;
  label: string;
  points: MapPoint[];
}

/* Fixed colors: MapLibre paints on canvas, outside the CSS token system.
   Chosen to read on the light basemap in both site themes. */
const CATEGORY_COLORS: Record<string, string> = {
  salud: "#c0503a",
  educacion: "#3b6fb6",
  deporte: "#3a7d44",
  cultura: "#c08a2d",
};
const FALLBACK_COLOR = "#666666";
const DISTRICT_FILLS = ["#3a7d44", "#c08a2d", "#3b6fb6", "#c0503a", "#7b5cb8"];

const categoryColor = (id: string) => CATEGORY_COLORS[id] ?? FALLBACK_COLOR;

function boundariesToGeoJSON(boundaries: SectionBoundary[]) {
  return {
    type: "FeatureCollection" as const,
    features: boundaries.map((b) => ({
      type: "Feature" as const,
      properties: { district: b.district, section: b.section },
      geometry: { type: "Polygon" as const, coordinates: b.rings },
    })),
  };
}

function pointsToGeoJSON(category: MapCategory) {
  return {
    type: "FeatureCollection" as const,
    features: category.points.map((p) => ({
      type: "Feature" as const,
      properties: { name: p.name },
      geometry: { type: "Point" as const, coordinates: [p.lon, p.lat] },
    })),
  };
}

export interface SectionPopulationInfo {
  district: number;
  section: number;
  total: number;
}

const numberFormat = new Intl.NumberFormat("es-ES");

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function MunicipalMap({
  center,
  boundaries,
  categories = [],
  populations,
  className,
}: {
  center: { lat: number; lon: number };
  boundaries?: SectionBoundary[];
  categories?: MapCategory[];
  /** Population per section, shown inside the section popups */
  populations?: SectionPopulationInfo[];
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const showPopup = useRef<((lngLat: [number, number], content: string, asHtml?: boolean) => void) | null>(null);
  const populationsRef = useRef(populations);
  populationsRef.current = populations;
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, true])),
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let removeDocListener: (() => void) | null = null;

    (async () => {
      try {
        const maplibre = (await import("maplibre-gl")).default;
        if (cancelled || !container.current) return;

        /* Match the site theme at init; OpenFreeMap serves both looks */
        const dark =
          document.documentElement.dataset.theme === "dark" ||
          (!document.documentElement.dataset.theme &&
            window.matchMedia("(prefers-color-scheme: dark)").matches);
        const map = new maplibre.Map({
          container: container.current,
          style: `https://tiles.openfreemap.org/styles/${dark ? "dark" : "liberty"}`,
          center: [center.lon, center.lat],
          zoom: 12,
          attributionControl: { compact: false },
        });
        mapRef.current = map;
        map.addControl(new maplibre.NavigationControl({ showCompass: false }));
        map.scrollZoom.disable();
        map.touchZoomRotate.enable();
        let activePopup: import("maplibre-gl").Popup | null = null;
        const closePopup = () => {
          activePopup?.remove();
          activePopup = null;
        };
        showPopup.current = (lngLat, content, asHtml = false) => {
          closePopup();
          activePopup = new maplibre.Popup({ closeButton: false }).setLngLat(lngLat);
          if (asHtml) activePopup.setHTML(content);
          else activePopup.setText(content);
          activePopup.addTo(map);
        };

        /* Click on an empty spot of the map closes the open popup */
        map.on("click", (e) => {
          const layers = [...categories.map((c) => c.id), "secciones-fill"].filter((id) =>
            map.getLayer(id),
          );
          if (map.queryRenderedFeatures(e.point, { layers }).length === 0) closePopup();
        });

        /* And so does interacting with the rest of the page */
        const onPointerDown = (event: PointerEvent) => {
          if (!container.current?.contains(event.target as Node)) closePopup();
        };
        document.addEventListener("pointerdown", onPointerDown);
        removeDocListener = () => document.removeEventListener("pointerdown", onPointerDown);

        /* The OpenFreeMap sprite lacks a few POI icons the style mentions;
           a transparent pixel keeps the console quiet */
        map.on("styleimagemissing", (e) => {
          if (!map.hasImage(e.id)) {
            map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
          }
        });

        map.on("load", () => {
          if (boundaries?.length) {
            map.addSource("secciones", { type: "geojson", data: boundariesToGeoJSON(boundaries) });
            map.addLayer({
              id: "secciones-fill",
              type: "fill",
              source: "secciones",
              paint: {
                "fill-color": [
                  "match",
                  ["%", ["-", ["get", "district"], 1], DISTRICT_FILLS.length],
                  ...DISTRICT_FILLS.flatMap((color, i) => [i, color]),
                  FALLBACK_COLOR,
                ] as never,
                "fill-opacity": 0.08,
              },
            });
            map.addLayer({
              id: "secciones-line",
              type: "line",
              source: "secciones",
              paint: { "line-color": "#3a7d44", "line-opacity": 0.35, "line-width": 1 },
            });
            map.on("click", "secciones-fill", (e) => {
              /* A tap on an equipment dot also reaches this layer below
                 it; the dot wins and opens its own popup */
              const pointsOnTop = map.queryRenderedFeatures(e.point, {
                layers: categories.map((c) => c.id).filter((id) => map.getLayer(id)),
              });
              if (pointsOnTop.length > 0) return;
              const props = e.features?.[0]?.properties;
              if (!props) return;
              const info = populationsRef.current?.find(
                (p) => p.district === props.district && p.section === props.section,
              );
              const vecinos = info ? ` · ${numberFormat.format(info.total)} vecinos` : "";
              showPopup.current?.(
                [e.lngLat.lng, e.lngLat.lat],
                `<strong>Distrito ${props.district}, sección ${props.section}</strong>${vecinos}` +
                  ` · <a href="/demografia#distritos">más detalle</a>`,
                true,
              );
            });
          }

          for (const category of categories) {
            map.addSource(category.id, { type: "geojson", data: pointsToGeoJSON(category) });
            map.addLayer({
              id: category.id,
              type: "circle",
              source: category.id,
              paint: {
                "circle-radius": 6,
                "circle-color": categoryColor(category.id),
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1.5,
              },
            });
            map.on("click", category.id, (e) => {
              const name = e.features?.[0]?.properties?.name;
              if (!name) return;
              showPopup.current?.([e.lngLat.lng, e.lngLat.lat], String(name));
            });
            map.on("mouseenter", category.id, () => (map.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", category.id, () => (map.getCanvas().style.cursor = ""));
          }
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      removeDocListener?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    /* The map initializes once; its data props never change after render */
  }, []);

  const toggle = (id: string) => {
    const next = { ...visible, [id]: !visible[id] };
    setVisible(next);
    mapRef.current?.setLayoutProperty(id, "visibility", next[id] ? "visible" : "none");
  };

  const matches = (() => {
    const q = normalize(query.trim());
    if (q.length < 2) return [];
    return categories
      .flatMap((c) => c.points.map((p) => ({ ...p, categoryId: c.id })))
      .filter((p) => normalize(p.name).includes(q))
      .slice(0, 8);
  })();

  const goTo = (point: MapPoint & { categoryId: string }) => {
    const map = mapRef.current;
    if (!map) return;
    if (!visible[point.categoryId]) toggle(point.categoryId);
    map.flyTo({ center: [point.lon, point.lat], zoom: 16.2 });
    showPopup.current?.([point.lon, point.lat], point.name);
    setQuery("");
  };

  if (failed) {
    return (
      <p className={cn("text-sm text-ink-muted", className)}>
        No se ha podido cargar el mapa. Vuelve a intentarlo en un rato.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {categories.length > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Capas del mapa">
            {categories.map((category) => (
              <Chip
                key={category.id}
                selected={visible[category.id]}
                aria-pressed={visible[category.id]}
                onClick={() => toggle(category.id)}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: visible[category.id] ? "#ffffff" : categoryColor(category.id),
                  }}
                />
                {category.label} ({category.points.length})
              </Chip>
            ))}
          </div>
          <div className="relative sm:w-80 sm:shrink-0">
          <SearchInput
            aria-label="Buscar un equipamiento en el mapa"
            placeholder="Busca un colegio, centro de salud, biblioteca..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full"
          />
          {matches.length > 0 ? (
            <ul
              className="absolute z-10 mt-1 w-full divide-y divide-line overflow-hidden rounded-field border border-line bg-surface-raised shadow-card"
              role="list"
            >
              {matches.map((point) => (
                <li key={`${point.name}-${point.lat}`}>
                  <button
                    onClick={() => goTo(point)}
                    className="flex w-full items-center gap-2 px-3 py-2 pointer-coarse:min-h-11 text-left text-sm text-ink cursor-pointer hover:bg-surface-sunken"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: categoryColor(point.categoryId) }}
                    />
                    <span className="min-w-0 break-words">{point.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          </div>
        </div>
      ) : null}
      <div
        ref={container}
        className="h-[65vh] min-h-[420px] w-full overflow-hidden rounded-card border border-line shadow-card pointer-coarse:[&_.maplibregl-ctrl_button]:h-11 pointer-coarse:[&_.maplibregl-ctrl_button]:w-11"
        aria-label="Mapa del municipio con distritos y equipamientos"
      />
    </div>
  );
}
