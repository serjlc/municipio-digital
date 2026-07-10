import { municipality } from "@municipio/config";
import { Container } from "@municipio/ui";
import type { Metadata } from "next";
import { PageList } from "../../components/page-list";
import { transparenciaPages } from "../../lib/site-pages";

export const metadata: Metadata = {
  title: "Transparencia",
  description: `Qué hacen las administraciones con ${municipality.name}: presupuestos, deuda, contratos menores y lo que publica el BOJA, con las fuentes oficiales citadas.`,
};

export default function TransparenciaPage() {
  return (
    <Container className="py-16 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Transparencia</p>
      <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
        Qué hacen las administraciones,{" "}
        <em className="not-italic text-brand">con cifras delante</em>
      </h1>
      <p className="mt-6 max-w-2xl text-lead text-ink-muted">
        El dinero municipal y el boletín oficial, presentados para poder vigilarlos sin ser
        técnico de administración: en qué se gasta, cuánto se debe, a quién se contrata y qué
        publica la Junta.
      </p>
      <div className="mt-12">
        <PageList pages={transparenciaPages} />
      </div>
    </Container>
  );
}
