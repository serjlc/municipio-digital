import { municipality } from "@municipio/config";
import { fetchCkanDataset, fetchPopulation, fetchPadronData } from "@municipio/datos";
import {
  Alert,
  Badge,
  Card,
  CardText,
  CardTitle,
  Container,
  Section,
  SourceNote,
  Stat,
  StatGroup,
  TrendChart,
  AgePyramid,
  DistrictStats,
} from "@municipio/ui";
import type { Metadata } from "next";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const percentFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 1,
  signDisplay: "always",
});

async function getPadron() {
  if (!municipality.sources.ckan || !municipality.datasets?.padron) return null;
  return fetchCkanDataset(municipality.sources.ckan, municipality.datasets.padron);
}

export async function generateMetadata(): Promise<Metadata> {
  const population = await fetchPopulation(municipality);
  const description = population
    ? `${municipality.name} tiene ${numberFormat.format(population.latest.total)} habitantes según la cifra oficial del INE de ${population.latest.year}. Evolución de la población desde ${population.years[0]?.year}, reparto por sexo y padrón municipal.`
    : `Población de ${municipality.name}: cifras oficiales del INE y padrón municipal, presentadas de forma clara.`;
  return {
    title: `¿Cuántos habitantes tiene ${municipality.shortName}?`,
    description,
  };
}

export default async function DemografiaPage() {
  const [population, padron, padronData] = await Promise.all([
    fetchPopulation(municipality),
    getPadron(),
    fetchPadronData(municipality),
  ]);

  const latest = population?.latest;
  const first = population?.years[0];
  const previous = population?.years[population.years.length - 2];

  const yearlyChange =
    latest && previous
      ? percentFormat.format(((latest.total - previous.total) / previous.total) * 100)
      : null;

  const jsonLd = population
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Población de ${municipality.name} (${first?.year} a ${latest?.year})`,
        description: `Cifras oficiales de población de ${municipality.name} publicadas por el INE.`,
        creator: { "@type": "Organization", name: "Instituto Nacional de Estadística" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        url: population.tableUrl,
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <Container className="pt-16 pb-6 sm:pt-20 sm:pb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Demografía</p>
        <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
          ¿Cuántos habitantes tiene {municipality.shortName}?
        </h1>
        {latest ? (
          <>
            <p className="mt-6 max-w-2xl text-lead text-ink-muted">
              {municipality.name} tiene{" "}
              <strong className="text-ink">{numberFormat.format(latest.total)} habitantes</strong>{" "}
              según la cifra oficial del INE a 1 de enero de {latest.year}
              {latest.provisional ? " (dato provisional)" : ""}. Desde {first?.year} la población
              ha crecido un{" "}
              {first
                ? numberFormat.format(Math.round(((latest.total - first.total) / first.total) * 100))
                : ""}
              %.
            </p>
            {latest.provisional ? (
              <Alert className="mt-6 max-w-2xl" title="Dato provisional">
                El INE aún no ha publicado la cifra definitiva de {latest.year}. Esta página se
                actualizará sola cuando salga.
              </Alert>
            ) : null}
          </>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar las cifras del INE. Suele ser algo temporal: vuelve a intentarlo
            en un rato.
          </Alert>
        )}
      </Container>

      {latest ? (
        <Section
          id="cifras"
          title="Las cifras de un vistazo"
          description={`Población oficial a 1 de enero de ${latest.year}, con la variación respecto al año anterior y el reparto por sexo.`}
        >
          <StatGroup>
            <Stat
              label="Habitantes"
              value={numberFormat.format(latest.total)}
              context={`Año ${latest.year}`}
            />
            {yearlyChange && previous ? (
              <Stat
                label="Variación anual"
                value={`${yearlyChange} %`}
                context={`${numberFormat.format(latest.total - previous.total)} personas más que en ${previous.year}`}
              />
            ) : null}
            {latest.men ? (
              <Stat
                label="Hombres"
                value={numberFormat.format(latest.men)}
                context={`${numberFormat.format(Math.round((latest.men / latest.total) * 100))} % del total`}
              />
            ) : null}
            {latest.women ? (
              <Stat
                label="Mujeres"
                value={numberFormat.format(latest.women)}
                context={`${numberFormat.format(Math.round((latest.women / latest.total) * 100))} % del total`}
              />
            ) : null}
          </StatGroup>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: "INE, cifras oficiales de población municipal",
                href: population?.tableUrl,
                license: "CC BY 4.0",
              },
            ]}
          />
        </Section>
      ) : null}

      {population && first && latest ? (
        <Section
          id="evolucion"
          title={`Así ha crecido ${municipality.shortName}`}
          description={`De ${numberFormat.format(first.total)} habitantes en ${first.year} a ${numberFormat.format(latest.total)} en ${latest.year}. Cada punto es la cifra oficial a 1 de enero.`}
          className="bg-surface-sunken"
        >
          <TrendChart
            points={population.years.map((y) => ({ label: String(y.year), value: y.total }))}
            title={`Población de ${municipality.name} por año`}
            labelHeader="Año"
            valueHeader="Habitantes"
          />
          <SourceNote
            className="mt-6"
            sources={[
              {
                name: "INE, cifras oficiales de población municipal",
                href: population.tableUrl,
                license: "CC BY 4.0",
              },
            ]}
          />
        </Section>
      ) : null}

      {padronData ? (
        <>
          <Section
            id="piramide"
            title="Pirámide de población"
            description={`Distribución de los vecinos empadronados por sexo y tramos de edad. Datos del padrón municipal de ${padronData.year}.`}
          >
            <div className="max-w-3xl mx-auto">
              <AgePyramid
                data={padronData.agePyramid}
                title="Pirámide de población"
              />
            </div>
            <SourceNote
              className="mt-8"
              sources={[
                {
                  name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                  href: municipality.sources.ckan,
                  license: padron?.license,
                },
              ]}
            />
          </Section>

          <Section
            id="distritos"
            title="Distribución por distritos y secciones"
            description={`Detalle de la población empadronada en cada distrito y sección electoral. Datos de ${padronData.year}.`}
            className="bg-surface-sunken"
          >
            <DistrictStats districts={padronData.districts} />
            <SourceNote
              className="mt-8"
              sources={[
                {
                  name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                  href: municipality.sources.ckan,
                  license: padron?.license,
                },
              ]}
            />
          </Section>

          {padronData.yearlySeries && padronData.yearlySeries.length > 0 ? (
            <Section
              id="movimientos"
              title="Natalidad y mortalidad"
              description="Evolución de los nacimientos y defunciones anuales registrados en el padrón municipal."
            >
              <div className="grid gap-8 xl:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-ink-muted mb-4 text-center">Nacimientos por año</h4>
                  <TrendChart
                    points={padronData.yearlySeries.map((s) => ({
                      label: String(s.year),
                      value: s.births,
                    }))}
                    title="Nacimientos registrados"
                    labelHeader="Año"
                    valueHeader="Nacimientos"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-ink-muted mb-4 text-center">Defunciones por año</h4>
                  <TrendChart
                    points={padronData.yearlySeries.map((s) => ({
                      label: String(s.year),
                      value: s.deaths,
                    }))}
                    title="Defunciones registradas"
                    labelHeader="Año"
                    valueHeader="Defunciones"
                  />
                </div>
              </div>
              <SourceNote
                className="mt-8"
                sources={[
                  {
                    name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                    href: municipality.sources.ckan,
                    license: padron?.license,
                  },
                ]}
              />
            </Section>
          ) : null}
        </>
      ) : null}

      <Section
        id="datos-abiertos"
        title="Descarga de datos en bruto"
        description="Si prefieres trabajar con los archivos originales del padrón municipal o automatizar tus propios análisis, puedes descargarlos directamente."
        className={padronData ? "bg-surface-sunken" : undefined}
      >
        {padron ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <Badge tone="brand">{padron.license ?? "Datos abiertos"}</Badge>
              <CardTitle>{padron.title}</CardTitle>
              <CardText>
                {padron.resources.length} recursos publicados
                {padron.modified
                  ? `, actualizado por última vez el ${new Date(padron.modified).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`
                  : ""}
                . Los archivos se descargan del portal municipal.
              </CardText>
              <a
                href={padron.datasetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
              >
                Ver el dataset completo
              </a>
            </Card>
            <Card>
              <CardTitle>Archivos del dataset</CardTitle>
              <ul className="flex flex-col gap-2" role="list">
                {padron.resources.map((resource) => (
                  <li key={resource.url}>
                    <a
                      href={resource.url}
                      className="inline-flex min-h-8 items-center gap-2 text-ink-muted underline decoration-line underline-offset-4 hover:text-ink"
                    >
                      {resource.name}
                      {resource.format ? <Badge>{resource.format}</Badge> : null}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ) : (
          <Alert tone="warning" title="Portal municipal no disponible">
            No hemos podido conectar con el portal de datos abiertos del Ayuntamiento. Puedes
            intentarlo directamente en{" "}
            <a href={municipality.sources.ckan} className="underline">
              {municipality.sources.ckan}
            </a>
            .
          </Alert>
        )}
        {padron ? (
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                href: municipality.sources.ckan,
                license: padron.license,
              },
            ]}
          />
        ) : null}
      </Section>
    </>
  );
}
