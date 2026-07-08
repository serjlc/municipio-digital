import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({
  className,
  children,
  interactive,
}: {
  className?: string;
  children: ReactNode;
  /** Hover elevation for cards that contain a CardLink */
  interactive?: boolean;
}) {
  return (
    <article
      className={cn(
        "relative flex flex-col gap-3 rounded-card border border-line bg-surface-raised p-6 shadow-card",
        interactive &&
          "transition-[box-shadow,border-color] hover:border-brand/50 hover:shadow-card-hover focus-within:border-brand",
        className,
      )}
    >
      {children}
    </article>
  );
}

/**
 * Makes the whole parent Card clickable while keeping a single, correctly
 * labelled link for assistive tech. Use inside a Card with `interactive`.
 */
export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-ink no-underline outline-none after:absolute after:inset-0 after:rounded-card"
    >
      {children}
    </Link>
  );
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h3 className={cn("text-subtitle font-semibold text-ink text-balance", className)}>
      {children}
    </h3>
  );
}

export function CardText({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn("text-ink-muted", className)}>{children}</p>;
}
