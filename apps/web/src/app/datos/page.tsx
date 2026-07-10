import { municipality } from "@municipio/config";
import { Container } from "@municipio/ui";
import type { Metadata } from "next";
import { PageList } from "../../components/page-list";
import { municipioPages } from "../../lib/site-pages";

export const metadata: Metadata = {
  title: "Datos del municipio",
  description: `Cómo es ${municipality.name} en datos: población, turismo y lo que vaya llegando, siempre con la fuente oficial citada.`,
};

export default function DatosPage() {
  return (
    <Container className="py-16 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">
        Datos del municipio
      </p>
      <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
        Cómo es {municipality.shortName}, <em className="not-italic text-brand">en datos</em>
      </h1>
      <p className="mt-6 max-w-2xl text-lead text-ink-muted">
        Las páginas que cuentan el municipio: quiénes lo habitan y de qué vive. Cada dato lleva
        su fuente oficial al lado.
      </p>
      <div className="mt-12">
        <PageList pages={municipioPages} />
      </div>
    </Container>
  );
}
