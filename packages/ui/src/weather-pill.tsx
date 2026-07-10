"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface WeatherSummary {
  temperature: number | null;
  sky: string | null;
  max: number | null;
}

function skyIcon(sky: string | null) {
  const s = (sky ?? "").toLowerCase();
  const common = {
    "aria-hidden": true,
    width: 16,
    height: 16,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  if (/lluvia|chubasco|tormenta/.test(s)) {
    return (
      <svg {...common}>
        <path d="M5.5 12.5a3.5 3.5 0 1 1 .6-6.95 4.5 4.5 0 0 1 8.8 1.2A3 3 0 0 1 14 12.5z" />
        <path d="M7 15l-1 2.5M11 15l-1 2.5M15 15l-1 2.5" />
      </svg>
    );
  }
  if (/nubos|nube|cubierto|niebla|bruma/.test(s)) {
    return (
      <svg {...common}>
        <path d="M5.5 14.5a3.5 3.5 0 1 1 .6-6.95 4.5 4.5 0 0 1 8.8 1.2 3 3 0 0 1-.9 5.75z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.5v1.8M10 15.7v1.8M17.5 10h-1.8M4.3 10H2.5M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1L4.8 4.8" />
    </svg>
  );
}

/**
 * Small header link showing the current temperature. Loads from a cached
 * endpoint after hydration and renders nothing until (and unless) there
 * is real data, so a missing key or a downed API leaves no trace.
 */
export function WeatherPill({ endpoint, href }: { endpoint: string; href: string }) {
  const [weather, setWeather] = useState<WeatherSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WeatherSummary | null) => {
        if (!cancelled && data && (data.temperature ?? data.max) !== null) setWeather(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  if (!weather) return null;
  const degrees = weather.temperature ?? weather.max;
  const detail = weather.temperature !== null
    ? "Temperatura actual en la estación AEMET más cercana"
    : "Máxima prevista hoy por AEMET";

  return (
    <Link
      href={href}
      title={`${detail} · Ver el clima`}
      aria-label={`${degrees} grados ahora. Ver la página del clima`}
      className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium tabular-nums text-ink-muted transition-colors hover:bg-surface-sunken hover:text-ink md:h-9"
    >
      {skyIcon(weather.sky)}
      {degrees}°
    </Link>
  );
}
