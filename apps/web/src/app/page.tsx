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
} from "@municipio/ui";
import Link from "next/link";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");

const sections = [
  {
    title: "Demografía",
    href: "/demografia",
    state: "Disponible",
    text: "Cuántos somos, cómo ha crecido la población desde 1996 y cómo se reparte, con las cifras oficiales del INE y el padrón municipal.",
  },
  {
    title: "Contratos menores",
    href: "/contratos-menores",
    state: "Disponible",
    text: "A quién contrata el Ayuntamiento sin licitación, trimestre a trimestre: adjudicatarios, objeto e importe de cada contrato, con buscador.",
  },
  {
    title: "Turismo",
    href: "/turismo",
    state: "Disponible",
    text: "Cuántos viajeros y pernoctaciones registran los hoteles desde 2005 según el INE, la ocupación mes a mes y quién visita las oficinas de turismo.",
  },
  {
    title: "Clima y costa",
    state: "En preparación",
    text: "Temperaturas, avisos y estado del tiempo con datos oficiales de AEMET, para consultar en dos segundos.",
  },
  {
    title: "Deuda municipal",
    href: "/deuda",
    state: "Disponible",
    text: "Cuánto debe el Ayuntamiento, cuánto sale por habitante y cómo ha evolucionado desde 2010, con los datos del Ministerio de Hacienda.",
  },
  {
    title: "Presupuestos",
    href: "/presupuestos",
    state: "Disponible",
    text: "En qué se gasta el dinero del municipio y de dónde sale, capítulo a capítulo, sin necesidad de saber contabilidad pública.",
  },
  {
    title: "Agenda y BOJA",
    state: "En preparación",
    text: "Lo que publica la Junta de Andalucía y afecta al municipio: subvenciones, normativa y eventos.",
  },
];

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
        <ul className="border-y border-line" role="list">
          {sections.map((section) => (
            <li
              key={section.title}
              className="grid gap-2 border-b border-line py-6 last:border-b-0 sm:grid-cols-[14rem_1fr_auto] sm:gap-6"
            >
              <h3 className="text-subtitle font-semibold text-ink">
                {section.href ? (
                  <Link
                    href={section.href}
                    className="underline decoration-line underline-offset-4 hover:text-brand hover:decoration-brand"
                  >
                    {section.title}
                  </Link>
                ) : (
                  section.title
                )}
              </h3>
              <p className="max-w-xl text-ink-muted">{section.text}</p>
              <p
                className={
                  section.href
                    ? "text-sm font-semibold text-accent-strong"
                    : "text-sm text-ink-faint"
                }
              >
                {section.state}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="proyectos"
        eyebrow="Proyectos ciudadanos"
        title="Un hogar para proyectos de vecinos"
        description="Aquí no se consumen datos y ya está: también se generan. Cualquiera puede proponer un proyecto que aporte información nueva sobre el municipio. Se revisa, se publica y su dataset se libera con la metodología documentada."
        className="bg-surface-sunken"
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-widest text-accent-strong">
              Piloto
            </p>
            <CardTitle>Termografía de fachadas</CardTitle>
            <CardText>
              Medir con cámara térmica el calor que alcanzan las fachadas del municipio en verano,
              cruzarlo con la temperatura oficial de AEMET y el año de construcción del Catastro, y
              publicar el dataset completo. Una forma seria de mostrar lo poco preparados que están
              nuestros edificios para el calor que viene.
            </CardText>
          </Card>
          <Card className="justify-between gap-5">
            <div className="flex flex-col gap-3">
              <CardTitle>¿Tienes una idea?</CardTitle>
              <CardText>
                Escribe una propuesta corta: qué es, qué datos usa o genera y quién la mantiene. Si
                encaja con los criterios del proyecto, se incuba y se publica aquí.
              </CardText>
            </div>
            <ButtonLink
              href="https://github.com/serjlc/municipio-digital"
              variant="secondary"
              external
            >
              Proponer un proyecto
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
