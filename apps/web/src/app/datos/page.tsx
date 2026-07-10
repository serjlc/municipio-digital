import { municipality } from "@municipio/config";
import { Container } from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";
import { PageList } from "../../components/page-list";
import { municipioPages } from "../../lib/site-pages";

export const metadata: Metadata = {
  title: "Datos del municipio",
  description: `Cómo es ${municipality.name} en datos: población, turismo y lo que vaya llegando, siempre con la fuente oficial citada.`,
};

export default function DatosPage() {
  return (
    <>
    <PageHero
      eyebrow="Datos del municipio"
      title={
        <>
        Cómo es {municipality.shortName}, <em className="not-italic text-brand">en datos</em>
        </>
      }
    >
      <p className="mt-6 max-w-2xl text-lead text-ink-muted">
        Las páginas que cuentan el municipio: quiénes lo habitan y de qué vive. Cada dato lleva
        su fuente oficial al lado.
      </p>
    </PageHero>
    <Container className="pb-16 sm:pb-20">
      <PageList pages={municipioPages} />
    </Container>
    </>
  );
}
