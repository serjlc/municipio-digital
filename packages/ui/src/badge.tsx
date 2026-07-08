import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "brand" | "sand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-muted border border-line",
  brand: "bg-brand-soft text-brand-strong",
  sand: "bg-accent-soft text-accent-strong",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
