import { cn } from "./cn";

export interface BarListItem {
  label: string;
  value: number;
}

const numberFormat = new Intl.NumberFormat("es-ES");
const percentFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

/**
 * Horizontal bar list rendered on the server: one row per category with the
 * value, its share of the total and a proportional bar. No client JS.
 */
export function BarList({
  items,
  total,
  className,
}: {
  items: BarListItem[];
  /** Denominator for the percentages; defaults to the sum of the items */
  total?: number;
  className?: string;
}) {
  if (items.length === 0) return null;
  const denominator = total ?? items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map((item) => item.value));

  return (
    <ul className={cn("flex flex-col gap-3", className)} role="list">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-4">
            <span className="min-w-0 break-words text-sm text-ink">{item.label}</span>
            <span className="shrink-0 text-sm tabular-nums text-ink-muted">
              <strong className="font-semibold text-ink">{numberFormat.format(item.value)}</strong>
              {denominator > 0 ? (
                <span className="ml-1.5 text-xs">
                  ({percentFormat.format((item.value / denominator) * 100)} %)
                </span>
              ) : null}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
