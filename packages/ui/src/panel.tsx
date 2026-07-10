import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/**
 * Raised surface without opinions about padding: the shell of tables,
 * finders and figures. `Card` builds on the same look for linkable
 * content; use `panelClasses` when the element cannot be a div.
 */
export const panelClasses = "rounded-card border border-line bg-surface-raised shadow-card";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(panelClasses, className)} {...props} />;
}
