import { municipality } from "@municipio/config";
import { fetchPopulation } from "@municipio/datos";
import {
  ButtonLink,
  Card,
  CardText,
  CardTitle,
  Container,
  Section,
  SourceNote,
  Stat,
  StatGroup,
  Badge,
} from "@municipio/ui";
import Link from "next/link";
import { PageList } from "../components/page-list";
import { sitePages } from "../lib/site-pages";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");

const sections = sitePages;

export default async function Home() {
  const population = await fetchPopulation(municipality);
  const latest = population?.latest;
  const first = population?.years[0];
  const previous = population?.years[population.years.length - 2];

  return (
    <>
      <Container className="pt-16 pb-10 sm:pt-24 sm:pb-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          Un proyecto de vecinos de {municipality.name}
        </p>
        <h1 className="mt-5 max-w-4xl text-display font-bold text-ink text-balance">
          Los datos públicos de {municipality.shortName}, <em className="not-italic text-brand">reunidos y explicados</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lead text-ink-muted">
          Lo que las administraciones ya publican sobre {municipality.shortName}, reunido y
          explicado para que cualquiera lo entienda. Sin esperar a nadie, con el código abierto y
          cada dato con su fuente.
        </p>
      </Container>

      {latest ? (
        <div className="border-y border-line bg-surface-sunken">
          <Container className="py-10 sm:py-12">
            <StatGroup>
              <Stat
                label="Habitantes"
                value={numberFormat.format(latest.total)}
                context={`INE, ${latest.year}`}
              />
              {previous ? (
                <Stat
                  label="Más que hace un año"
                  value={numberFormat.format(latest.total - previous.total)}
                />
              ) : null}
              {first ? (
                <Stat
                  label={`Crecimiento desde ${first.year}`}
                  value={`${numberFormat.format(Math.round(((latest.total - first.total) / first.total) * 100))} %`}
                />
              ) : null}
            </StatGroup>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Link
                href="/demografia"
                className="font-medium text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
              >
                Ver la demografía completa
              </Link>
              <SourceNote
                sources={[
                  {
                    name: "INE, cifras oficiales de población municipal",
                    href: population?.tableUrl,
                    license: "CC BY 4.0",
                  },
                ]}
              />
            </div>
          </Container>
        </div>
      ) : null}

      <Section
        id="datos"
        title="Las secciones"
        description="Cada una consume APIs públicas (municipales, andaluzas y estatales), cita su fuente y se actualiza sola."
      >
        <PageList pages={sections} />
      </Section>

      <Section
        id="proyectos"
        eyebrow="Proyectos ciudadanos"
        title="Un hogar para proyectos de vecinos"
        description="Aquí no se consumen datos y ya está: también se generan. Cualquiera puede proponer un proyecto que aporte información nueva sobre el municipio. Se revisa, se publica y su dataset se libera con la metodología documentada."
        className="bg-surface-sunken"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <Badge tone="sand">Busca impulso</Badge>
            <CardTitle>Termografía de fachadas</CardTitle>
            <CardText>
              Medir con cámara térmica el calor que alcanzan las fachadas en verano, cruzarlo con
              la temperatura oficial de AEMET y el año de construcción del Catastro, y publicar el
              dataset completo. La metodología ya está escrita; falta quien la lleve a la calle.
            </CardText>
          </Card>
          <Card>
            <Badge tone="sand">Busca impulso</Badge>
            <CardTitle>Inventario del arbolado</CardTitle>
            <CardText>
              Censar a pie los árboles del municipio: especie, tamaño, estado y alcorques
              vacíos. Cada árbol se publica en abierto y se devuelve a OpenStreetMap, donde
              queda vivo para siempre. Basta un móvil, una cinta métrica y mañanas sueltas.
            </CardText>
          </Card>
          <Card className="justify-between gap-5">
            <div className="flex flex-col gap-3">
              <CardTitle>¿Tienes una idea?</CardTitle>
              <CardText>
                Las dos propuestas de arriba son también la plantilla: copia su formato, cuenta
                qué datos usa y genera tu idea y quién la mantiene, y abre un pull request.
              </CardText>
            </div>
            <ButtonLink
              href="https://github.com/serjlc/municipio-digital/tree/main/PROPOSALS"
              variant="secondary"
              external
            >
              Ver las propuestas
            </ButtonLink>
          </Card>
        </div>
      </Section>

      <Section
        id="reutilizar"
        eyebrow="Para otros municipios"
        title="Llévalo a tu municipio"
        description={`Nada de ${municipality.shortName} está incrustado en el código. Con un archivo de configuración (código INE, coordenadas y portal de datos local) el mismo proyecto funciona para cualquier municipio español. Las fuentes estatales funcionan solas y las autonómicas se activan por comunidad.`}
      >
        <ButtonLink href="https://github.com/serjlc/municipio-digital" external>
          Empieza con el código
        </ButtonLink>
      </Section>
    </>
  );
}
