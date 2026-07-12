import { cn } from "./cn";
import { panelClasses } from "./panel";
import { projectSections, type SectionBoundary } from "./map-projection";

export interface ChoroplethValue {
  district: number;
  section: number;
  value: number;
}

/*
 * Sections shade from 12% of the brand color to 100%: the ramp reads in
 * both themes because the brand token itself adapts. Sections without a
 * published value stay in the neutral line color.
 */
const MIN_OPACITY = 0.12;

/**
 * Server-rendered choropleth of census sections: each section shaded by
 * its value, with a gradient legend. The map is decorative for assistive
 * tech; pair it with a table carrying the same data, like the charts do.
 */
export function SectionChoropleth({
  boundaries,
  values,
  formatValue = (v) => String(v),
  caption,
  className,
}: {
  boundaries: SectionBoundary[];
  values: ChoroplethValue[];
  /** Formats a value for the legend and the hover hints, e.g. "12.681 €" */
  formatValue?: (value: number) => string;
  /** Visible note under the map */
  caption?: string;
  className?: string;
}) {
  if (boundaries.length === 0 || values.length === 0) return null;

  const map = projectSections(boundaries);
  const byKey = new Map(values.map((v) => [`${v.district}-${v.section}`, v.value]));
  const min = Math.min(...values.map((v) => v.value));
  const max = Math.max(...values.map((v) => v.value));
  const opacity = (value: number) =>
    max === min ? 1 : MIN_OPACITY + (1 - MIN_OPACITY) * ((value - min) / (max - min));

  return (
    <figure className={cn(panelClasses, "p-4 sm:p-6", className)}>
      <svg
        viewBox={`-1 -1 ${map.width + 2} ${map.height + 2}`}
        className="mx-auto h-auto w-full max-w-md"
        aria-hidden="true"
      >
        {map.paths.map((path) => {
          const value = byKey.get(`${path.district}-${path.section}`);
          return (
            <path
              key={`${path.district}-${path.section}`}
              d={path.d}
              fill={value === undefined ? "var(--color-line)" : "var(--color-brand)"}
              fillOpacity={value === undefined ? 0.5 : opacity(value)}
              stroke="var(--color-surface-raised)"
              strokeWidth="0.4"
            >
              <title>
                {`Distrito ${path.district}, sección ${path.section}: ${
                  value === undefined ? "sin dato publicado" : formatValue(value)
                }`}
              </title>
            </path>
          );
        })}
      </svg>
      <div className="mx-auto mt-4 flex max-w-md items-center gap-3 text-xs text-ink-muted">
        <span className="shrink-0 tabular-nums">{formatValue(min)}</span>
        <span
          aria-hidden="true"
          className="h-2 min-w-0 flex-1 rounded-full"
          style={{
            background: `linear-gradient(to right, color-mix(in srgb, var(--color-brand) ${MIN_OPACITY * 100}%, transparent), var(--color-brand))`,
          }}
        />
        <span className="shrink-0 tabular-nums">{formatValue(max)}</span>
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs text-ink-faint">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
