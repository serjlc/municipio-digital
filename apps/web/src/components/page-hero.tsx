import { Container } from "@municipio/ui";
import type { ReactNode } from "react";

/**
 * The hero every data page opens with: eyebrow, question-led title (with
 * its emphasized word) and whatever lead or notice comes below.
 */
export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Container className="pt-16 pb-6 sm:pt-20 sm:pb-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">{title}</h1>
      {children}
    </Container>
  );
}
