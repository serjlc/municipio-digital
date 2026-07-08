"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "./cn";

export interface AgeGroup {
  label: string;
  men: number;
  women: number;
}

const numberFormat = new Intl.NumberFormat("es-ES");
const percentFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 1,
});

export function AgePyramid({
  data,
  title = "Pirámide de población",
  className,
}: {
  data: AgeGroup[];
  title?: string;
  className?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (!data || data.length === 0) return null;

  const totalMen = data.reduce((sum, d) => sum + d.men, 0);
  const totalWomen = data.reduce((sum, d) => sum + d.women, 0);

  // Maximum value for scaling the bars (either men or women in any bracket)
  const maxVal = Math.max(...data.map((d) => Math.max(d.men, d.women)));

  const hasActive = activeIdx !== null;
  const activeItem = hasActive ? data[activeIdx!] : null;
  const shownMen = activeItem ? activeItem.men : totalMen;
  const shownWomen = activeItem ? activeItem.women : totalWomen;
  const shownTotal = shownMen + shownWomen;
  const percentOf = (value: number) =>
    shownTotal > 0 ? percentFormat.format((value / shownTotal) * 100) : "0";

  const handleMouseEnter = (idx: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Debounce hover updates to prevent flashing when moving mouse quickly
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveIdx(idx);
    }, 70);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setActiveIdx(null);
  };

  /* Bars render oldest at the top, so ArrowUp moves towards older groups */
  const onKeyDown = (event: React.KeyboardEvent) => {
    const move = (next: number) => {
      event.preventDefault();
      setActiveIdx(Math.min(data.length - 1, Math.max(0, next)));
    };
    if (event.key === "ArrowUp") move((activeIdx ?? -1) + 1);
    else if (event.key === "ArrowDown") move((activeIdx ?? data.length) - 1);
    else if (event.key === "Home") move(data.length - 1);
    else if (event.key === "End") move(0);
    else if (event.key === "Escape") setActiveIdx(null);
  };

  return (
    <figure className={cn("flex flex-col gap-6", className)}>
      <div className="rounded-card border border-line bg-surface-raised p-6 shadow-card">
        {/* Summary header: one fixed layout, only the values change on hover */}
        <div className="mb-6 max-w-xl mx-auto border-b border-line pb-5 text-center">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-widest",
              hasActive ? "text-brand" : "text-ink-muted",
            )}
          >
            {activeItem ? `Tramo de ${activeItem.label} años` : "Población total empadronada"}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-ink tabular-nums">
            {numberFormat.format(shownTotal)}
            <span className="ml-1.5 text-sm font-medium text-ink-muted">habitantes</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm tabular-nums">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
              <span className="text-ink-muted">Hombres</span>
              <span className="font-semibold text-ink">{numberFormat.format(shownMen)}</span>
              <span className="text-xs text-ink-muted">({percentOf(shownMen)}%)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-ink-muted">Mujeres</span>
              <span className="font-semibold text-ink">{numberFormat.format(shownWomen)}</span>
              <span className="text-xs text-ink-muted">({percentOf(shownWomen)}%)</span>
            </span>
          </div>
        </div>

        <p className="text-xs text-center text-ink-faint mb-4">
          Pasa el cursor, toca una barra o usa las flechas del teclado para ver el detalle de
          cada tramo de edad.
        </p>

        <div
          className="flex flex-col gap-1.5 select-none relative max-w-2xl mx-auto"
          tabIndex={0}
          role="img"
          aria-label={`${title}. Gráfico interactivo: usa las flechas arriba y abajo para recorrer los tramos de edad.`}
          onKeyDown={onKeyDown}
          onBlur={() => setActiveIdx(null)}
        >
          {data
            .map((item, idx) => {
              const menWidth = (item.men / maxVal) * 100;
              const womenWidth = (item.women / maxVal) * 100;
              const isActive = activeIdx === idx;

              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 group transition-colors rounded-sm px-1 py-0.5 pointer-coarse:py-2.5 cursor-pointer",
                    isActive ? "bg-surface-sunken" : "hover:bg-surface-sunken/45",
                  )}
                  onMouseEnter={() => handleMouseEnter(idx)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setActiveIdx(activeIdx === idx ? null : idx)}
                >
                  {/* Left Side: Men (align right) */}
                  <div className="flex-1 flex justify-end items-center h-6">
                    <div
                      className={cn(
                        "h-full rounded-l-sm transition-all duration-300 origin-right bg-brand",
                        isActive ? "brightness-105 saturate-110" : "opacity-85 group-hover:opacity-100",
                      )}
                      style={{ width: `${menWidth}%` }}
                    />
                    {isActive && (
                      <span className="text-xs font-semibold text-ink-muted mr-2 tabular-nums">
                        {numberFormat.format(item.men)}
                      </span>
                    )}
                  </div>

                  {/* Middle: Age Label */}
                  <div className="w-16 text-center text-xs font-medium text-ink-muted shrink-0 tabular-nums">
                    {item.label}
                  </div>

                  {/* Right Side: Women (align left) */}
                  <div className="flex-1 flex justify-start items-center h-6">
                    <div
                      className={cn(
                        "h-full rounded-r-sm transition-all duration-300 origin-left bg-accent",
                        isActive ? "brightness-105 saturate-110" : "opacity-85 group-hover:opacity-100",
                      )}
                      style={{ width: `${womenWidth}%` }}
                    />
                    {isActive && (
                      <span className="text-xs font-semibold text-ink-muted ml-2 tabular-nums">
                        {numberFormat.format(item.women)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
            .reverse() /* Oldest at the top */}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {activeItem
          ? `${activeItem.label} años: ${numberFormat.format(activeItem.men)} hombres, ${numberFormat.format(activeItem.women)} mujeres`
          : ""}
      </p>

      {/* Screen Reader Table */}
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Rango de edad</th>
              <th scope="col">Hombres</th>
              <th scope="col">Mujeres</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.label}>
                <th scope="row">{item.label}</th>
                <td>{numberFormat.format(item.men)}</td>
                <td>{numberFormat.format(item.women)}</td>
                <td>{numberFormat.format(item.men + item.women)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
