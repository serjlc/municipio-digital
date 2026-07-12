import type { ReactNode } from "react";
import { cn } from "./cn";
import { Container } from "./container";

export function Section({
  id,
  eyebrow,
  title,
  hideTitle = false,
  description,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  /**
   * Render the heading only for screen readers. For bands that follow the
   * hero directly, where a visible heading would just repeat it.
   */
  hideTitle?: boolean;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        hideTitle ? "py-10 sm:py-14" : "py-14 sm:py-20",
        id && "scroll-mt-20",
        className,
      )}
    >
      <Container>
        {eyebrow && !hideTitle ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2
          id={headingId}
          className={cn("text-title font-semibold text-ink text-balance", hideTitle && "sr-only")}
        >
          {title}
        </h2>
        {description && !hideTitle ? (
          <p className="mt-4 max-w-2xl text-lead text-ink-muted">{description}</p>
        ) : null}
        <div className={hideTitle ? undefined : "mt-10"}>{children}</div>
      </Container>
    </section>
  );
}
