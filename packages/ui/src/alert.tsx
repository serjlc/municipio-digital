import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "info" | "warning";

const tones: Record<Tone, string> = {
  info: "border-brand/30 bg-brand-soft",
  warning: "border-accent/50 bg-accent-soft",
};

export function Alert({
  tone = "info",
  title,
  className,
  children,
}: {
  tone?: Tone;
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="note" className={cn("rounded-field border px-4 py-3 text-sm", tones[tone], className)}>
      {title ? <p className="font-semibold text-ink">{title}</p> : null}
      <div className={cn("text-ink-muted", title && "mt-1")}>{children}</div>
    </div>
  );
}
