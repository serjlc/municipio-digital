import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * Selectable chip, the small button used by every selector in the portal:
 * districts, quarters, map layers. Green when active, quiet when not.
 */
export function Chip({
  selected = false,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 pointer-coarse:min-h-11 text-sm font-medium rounded-field border transition-all duration-200 cursor-pointer",
        selected
          ? "bg-brand border-brand text-on-brand shadow-sm font-semibold"
          : "bg-surface-raised border-line text-ink-muted hover:text-ink hover:border-ink-faint",
        className,
      )}
      {...props}
    />
  );
}
