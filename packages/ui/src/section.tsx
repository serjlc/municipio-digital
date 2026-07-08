import type { ReactNode } from "react";
import { cn } from "./cn";
import { Container } from "./container";

export function Section({
  id,
  eyebrow,
  title,
  description,
  className,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("py-14 sm:py-20", className)}>
      <Container>
        {eyebrow ? (
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h2 id={headingId} className="text-title font-semibold text-ink text-balance">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-lead text-ink-muted">{description}</p>
        ) : null}
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}
