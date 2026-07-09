import type { ReactNode } from "react";
import { cn } from "./cn";

export function StatGroup({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <dl className={cn("grid grid-cols-1 gap-x-6 gap-y-8 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4", className)}>
      {children}
    </dl>
  );
}

/* dt before dd keeps screen reader order label-then-value; CSS order flips it visually */
export function Stat({
  label,
  value,
  context,
  className,
}: {
  label: string;
  value: string;
  context?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="order-2 text-sm text-ink-muted">{label}</dt>
      <dd className="order-1 text-3xl font-semibold tabular-nums tracking-tight text-ink break-words sm:text-4xl">
        {value}
      </dd>
      {context ? <dd className="order-3 text-sm text-ink-faint">{context}</dd> : null}
    </div>
  );
}
