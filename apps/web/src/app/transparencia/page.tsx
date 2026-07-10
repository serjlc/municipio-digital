import { municipality } from "@municipio/config";
import { Container } from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";
import { PageList } from "../../components/page-list";
import { transparenciaPages } from "../../lib/site-pages";

export const metadata: Metadata = {
  title: "Transparencia",
  description: `Qué hacen las administraciones con ${municipality.name}: presupuestos, deuda, contratos menores y lo que publica el BOJA, con las fuentes oficiales citadas.`,
};

export default function TransparenciaPage() {
  return (
    <>
      <PageHero
        eyebrow="Transparencia"
        title={
          <>
            Qué hacen las administraciones,{" "}
            <em className="not-italic text-brand">con cifras delante</em>
          </>
        }
      >
        <p className="mt-6 max-w-2xl text-lead text-ink-muted">
          El dinero municipal y el boletín oficial, presentados para poder vigilarlos sin ser
          técnico de administración: en qué se gasta, cuánto se debe, a quién se contrata y qué
          publica la Junta.
        </p>
      </PageHero>
      <Container className="pb-16 sm:pb-20">
        <PageList pages={transparenciaPages} />
      </Container>
    </>
  );
}
