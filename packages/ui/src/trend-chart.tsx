"use client";

import { useId, useRef, useState } from "react";
import { cn } from "./cn";

export interface TrendPoint {
  label: string;
  value: number;
}

const W = 800;
const H = 320;
const PAD = { top: 48, right: 24, bottom: 40, left: 68 };

const numberFormat = new Intl.NumberFormat("es-ES");

function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min;
  if (span <= 0) return [min];
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((f) => f * magnitude).find((s) => s >= rawStep) ?? magnitude * 10;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return ticks;
}

/**
 * Interactive SVG area chart. Pointer, touch and arrow keys reveal exact
 * values; the full series is also exposed as a visually hidden table.
 */
export function TrendChart({
  points,
  title,
  valueHeader,
  labelHeader,
  className,
}: {
  points: TrendPoint[];
  title: string;
  valueHeader: string;
  labelHeader: string;
  className?: string;
}) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState<number | null>(null);
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yMin = Math.max(0, minValue - (maxValue - minValue) * 0.12);
  const yMax = maxValue + (maxValue - minValue) * 0.08;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)},${H - PAD.bottom}L${PAD.left},${H - PAD.bottom}Z`;

  const yTicks = niceTicks(yMin, yMax);
  const xEvery = Math.max(1, Math.round(points.length / 6));
  const last = points[points.length - 1]!;
  const activePoint = active !== null ? points[active] : undefined;

  const indexFromPointer = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const viewX = ((clientX - rect.left) / rect.width) * W;
    const ratio = (viewX - PAD.left) / (W - PAD.left - PAD.right);
    return Math.min(points.length - 1, Math.max(0, Math.round(ratio * (points.length - 1))));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const move = (next: number) => {
      event.preventDefault();
      setActive(Math.min(points.length - 1, Math.max(0, next)));
    };
    if (event.key === "ArrowRight") move((active ?? -1) + 1);
    else if (event.key === "ArrowLeft") move((active ?? points.length) - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(points.length - 1);
    else if (event.key === "Escape") setActive(null);
  };

  return (
    <figure className={className}>
      <div className="overflow-x-auto">
        <div
          className="relative min-w-[450px]"
          tabIndex={0}
          role="img"
          aria-label={`${title}. Gráfico interactivo: usa las flechas izquierda y derecha para recorrer los valores.`}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            aria-hidden="true"
            onPointerMove={(e) => setActive(indexFromPointer(e.clientX))}
            onPointerDown={(e) => setActive(indexFromPointer(e.clientX))}
            onPointerLeave={() => setActive(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--color-line)"
                  strokeDasharray="2 4"
                />
                <text
                  x={PAD.left - 10}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="13"
                  fill="var(--color-ink-faint)"
                >
                  {numberFormat.format(tick)}
                </text>
              </g>
            ))}
            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="var(--color-brand)"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {points.map((p, i) =>
              i % xEvery === 0 || i === points.length - 1 ? (
                <text
                  key={p.label}
                  x={x(i)}
                  y={H - PAD.bottom + 24}
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--color-ink-faint)"
                >
                  {p.label}
                </text>
              ) : null,
            )}
            {active !== null && activePoint ? (
              <g>
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={PAD.top}
                  y2={H - PAD.bottom}
                  stroke="var(--color-ink-faint)"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x(active)}
                  cy={y(activePoint.value)}
                  r="6"
                  fill="var(--color-brand)"
                  stroke="var(--color-surface-raised)"
                  strokeWidth="2"
                />
              </g>
            ) : (
              <circle cx={x(points.length - 1)} cy={y(last.value)} r="5" fill="var(--color-brand)" />
            )}
          </svg>
          {active !== null && activePoint ? (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-field border border-line bg-surface-raised px-3 py-1.5 text-sm shadow-card"
              style={{
                left: `${Math.min(90, Math.max(10, (x(active) / W) * 100))}%`,
                top: `${(y(activePoint.value) / H) * 100 - 3}%`,
              }}
            >
              <span className="font-semibold tabular-nums text-ink">
                {numberFormat.format(activePoint.value)}
              </span>
              <span className="text-ink-muted"> · {activePoint.label}</span>
            </div>
          ) : null}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {activePoint ? `${activePoint.label}: ${numberFormat.format(activePoint.value)}` : ""}
      </p>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">{labelHeader}</th>
              <th scope="col">{valueHeader}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.label}>
                <th scope="row">{p.label}</th>
                <td>{numberFormat.format(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
