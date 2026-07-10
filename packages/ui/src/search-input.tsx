import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

/** The one search input of the portal; every finder shares this look. */
export function SearchInput({
  className,
  type = "search",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "px-3 py-2 pointer-coarse:min-h-11 text-sm rounded-field border border-line bg-surface-raised text-ink placeholder:text-ink-faint focus:border-brand",
        className,
      )}
      {...props}
    />
  );
}
