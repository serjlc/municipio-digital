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

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  if (!data || data.length === 0) return null;

  // Calculate totals and percentages
  const totalMen = data.reduce((sum, d) => sum + d.men, 0);
  const totalWomen = data.reduce((sum, d) => sum + d.women, 0);
  const totalPop = totalMen + totalWomen;

  // Maximum value for scaling the bars (either men or women in any bracket)
  const maxVal = Math.max(...data.map((d) => Math.max(d.men, d.women)));

  const hasActive = activeIdx !== null;
  const activeItem = hasActive ? data[activeIdx!] : null;
  const activeTotal = activeItem ? activeItem.men + activeItem.women : 0;

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

  return (
    <figure className={cn("flex flex-col gap-6", className)}>
      <div className="rounded-card border border-line bg-surface-raised p-6 shadow-card">
        {/* Dynamic Summary Panel (Overall Stats vs Hovered Age Stats) */}
        <div
          className={cn(
            "mb-8 p-5 rounded-field text-center transition-colors duration-300 max-w-xl mx-auto min-h-28 flex flex-col justify-center",
            hasActive ? "bg-brand-soft" : "bg-surface-sunken",
          )}
        >
          {activeItem ? (
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-brand text-on-brand mb-2 shadow-sm">
                Rango: {activeItem.label} años
              </span>
              <p className="text-lg font-bold text-ink mb-2">
                Población: {numberFormat.format(activeTotal)} hab.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2 pt-2 border-t border-brand/10">
                <div>
                  <span className="text-ink-muted block text-xs flex items-center justify-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-brand" />
                    Hombres
                  </span>
                  <span className="font-semibold text-ink">
                    {numberFormat.format(activeItem.men)}{" "}
                    <span className="text-xs text-ink-muted">
                      ({percentFormat.format((activeItem.men / activeTotal) * 100)}%)
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-xs flex items-center justify-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                    Mujeres
                  </span>
                  <span className="font-semibold text-ink">
                    {numberFormat.format(activeItem.women)}{" "}
                    <span className="text-xs text-ink-muted">
                      ({percentFormat.format((activeItem.women / activeTotal) * 100)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <span className="inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-line text-ink-muted mb-2">
                Población total empadronada
              </span>
              <p className="text-lg font-bold text-ink mb-2">
                Total padrón: {numberFormat.format(totalPop)} hab.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mt-2 pt-2 border-t border-line/40">
                <div>
                  <span className="text-ink-muted block text-xs flex items-center justify-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-brand" />
                    Hombres
                  </span>
                  <span className="font-semibold text-ink">
                    {numberFormat.format(totalMen)}{" "}
                    <span className="text-xs text-ink-muted">
                      ({percentFormat.format((totalMen / totalPop) * 100)}%)
                    </span>
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-xs flex items-center justify-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-accent" />
                    Mujeres
                  </span>
                  <span className="font-semibold text-ink">
                    {numberFormat.format(totalWomen)}{" "}
                    <span className="text-xs text-ink-muted">
                      ({percentFormat.format((totalWomen / totalPop) * 100)}%)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info label for interactions */}
        <p className="text-xs text-center text-ink-faint mb-4">
          Pasa el cursor (o toca) sobre las barras de población para ver el detalle de cada edad.
        </p>

        {/* The Pyramid */}
        <div className="flex flex-col gap-1.5 select-none relative max-w-2xl mx-auto">
          {data
            .map((item, idx) => {
              const menWidth = (item.men / maxVal) * 100;
              const womenWidth = (item.women / maxVal) * 100;
              const isActive = activeIdx === idx;

              return (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 group transition-colors rounded-sm px-1 py-0.5 cursor-pointer",
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
