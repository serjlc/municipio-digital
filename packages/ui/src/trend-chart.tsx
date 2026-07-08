import { useId } from "react";
import { cn } from "./cn";

export interface TrendPoint {
  label: string;
  value: number;
}

const W = 800;
const H = 320;
const PAD = { top: 20, right: 24, bottom: 40, left: 68 };

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
 * Server-rendered SVG area chart, no client JS. The graphic is decorative
 * for assistive tech; the full series is exposed as a visually hidden table.
 */
export function TrendChart({
  points,
  title,
  valueHeader,
  labelHeader,
  formatValue = (v) => v.toLocaleString("es-ES"),
  className,
}: {
  points: TrendPoint[];
  title: string;
  valueHeader: string;
  labelHeader: string;
  formatValue?: (value: number) => string;
  className?: string;
}) {
  const gradientId = useId();
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const yMin = Math.max(0, minValue - (maxValue - minValue) * 0.12);
  const yMax = maxValue + (maxValue - minValue) * 0.08;

  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)},${H - PAD.bottom}L${PAD.left},${H - PAD.bottom}Z`;

  const yTicks = niceTicks(yMin, yMax);
  const xEvery = Math.max(1, Math.round(points.length / 6));
  const last = points[points.length - 1]!;

  return (
    <figure className={className}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[560px]"
          aria-hidden="true"
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
                {formatValue(tick)}
              </text>
            </g>
          ))}
          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" strokeLinejoin="round" />
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
          <circle cx={x(points.length - 1)} cy={y(last.value)} r="5" fill="var(--color-brand)" />
        </svg>
      </div>
      <figcaption className="sr-only">{title}</figcaption>
      <table className="sr-only">
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
              <td>{formatValue(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
