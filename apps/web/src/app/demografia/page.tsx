import { municipality } from "@municipio/config";
import {
  fetchCensusPyramid,
  fetchCkanDataset,
  fetchDemographicIndicators,
  fetchEducationLevels,
  fetchMigrationBalances,
  fetchPadronData,
  fetchPopulation,
  fetchStreetGazetteer,
} from "@municipio/datos";
import {
  AgePyramid,
  Alert,
  BarList,
  Container,
  DistrictStats,
  Section,
  SourceNote,
  Stat,
  StatGroup,
  TrendChart,
} from "@municipio/ui";
import type { Metadata } from "next";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const percentFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 1,
  signDisplay: "always",
});
const decimalFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const signedFormat = new Intl.NumberFormat("es-ES", {
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
  const [population, padron, padronData, indicators, pyramid, education, migrations, gazetteer] =
    await Promise.all([
      fetchPopulation(municipality),
      getPadron(),
      fetchPadronData(municipality),
      fetchDemographicIndicators(municipality),
      fetchCensusPyramid(municipality),
      fetchEducationLevels(municipality),
      fetchMigrationBalances(municipality),
      fetchStreetGazetteer(municipality),
    ]);

  const latest = population?.latest;
  const first = population?.years[0];
  const previous = population?.years[population.years.length - 2];

  const yearlyChange =
    latest && previous
      ? percentFormat.format(((latest.total - previous.total) / previous.total) * 100)
      : null;

  /* Some INE indicators lag a year behind the rest of the table */
  const lastDeathRate = indicators
    ? [...indicators.rates].reverse().find((r) => r.deathRate !== undefined)
    : undefined;
  const lastGrowthRate = indicators
    ? [...indicators.rates].reverse().find((r) => r.naturalGrowthRate !== undefined)
    : undefined;
  const ratePoints = (key: "birthRate" | "deathRate" | "marriageRate") =>
    (indicators?.rates ?? [])
      .filter((r) => r[key] !== undefined)
      .map((r) => ({ label: String(r.year), value: r[key]! }));

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
        <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
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

      {pyramid ? (
        <Section
          id="piramide"
          title="Pirámide de población"
          description={`Población por sexo y tramos de edad a 1 de enero de ${pyramid.year}, según el Censo Anual de Población del INE.`}
          className="bg-surface-sunken"
        >
          <div className="max-w-3xl mx-auto">
            <AgePyramid data={pyramid.groups} title="Pirámide de población" />
          </div>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: "INE, Censo Anual de Población",
                href: pyramid.tableUrl,
                license: "CC BY 4.0",
              },
            ]}
          />
        </Section>
      ) : null}

      {indicators ? (
        <Section
          id="movimiento-natural"
          title="Nacimientos, defunciones y matrimonios"
          description={`Tasas por cada mil habitantes según los Indicadores Demográficos Básicos del INE, con datos hasta ${indicators.latest.year}.`}
        >
          <StatGroup>
            {indicators.lifeExpectancy ? (
              <Stat
                label="Esperanza de vida al nacer"
                value={`${decimalFormat.format(indicators.lifeExpectancy.total)} años`}
                context={
                  indicators.lifeExpectancy.men && indicators.lifeExpectancy.women
                    ? `Hombres ${decimalFormat.format(indicators.lifeExpectancy.men)}, mujeres ${decimalFormat.format(indicators.lifeExpectancy.women)} (${indicators.lifeExpectancy.year})`
                    : `Año ${indicators.lifeExpectancy.year}`
                }
              />
            ) : null}
            {indicators.latest.birthRate !== undefined ? (
              <Stat
                label="Natalidad"
                value={`${decimalFormat.format(indicators.latest.birthRate)} ‰`}
                context={`Nacimientos por mil habitantes en ${indicators.latest.year}`}
              />
            ) : null}
            {lastDeathRate ? (
              <Stat
                label="Mortalidad"
                value={`${decimalFormat.format(lastDeathRate.deathRate!)} ‰`}
                context={`Defunciones por mil habitantes en ${lastDeathRate.year}`}
              />
            ) : null}
            {lastGrowthRate ? (
              <Stat
                label="Saldo vegetativo"
                value={`${signedFormat.format(lastGrowthRate.naturalGrowthRate!)} ‰`}
                context={`Nacimientos menos defunciones por mil habitantes en ${lastGrowthRate.year}`}
              />
            ) : null}
          </StatGroup>

          <div className="mt-12 grid gap-8 xl:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-muted mb-4 text-center">
                Tasa de natalidad (nacimientos por mil habitantes)
              </h3>
              <TrendChart
                points={ratePoints("birthRate")}
                title="Tasa bruta de natalidad"
                labelHeader="Año"
                valueHeader="Nacimientos por mil habitantes"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-muted mb-4 text-center">
                Tasa de mortalidad (defunciones por mil habitantes)
              </h3>
              <TrendChart
                points={ratePoints("deathRate")}
                title="Tasa bruta de mortalidad"
                labelHeader="Año"
                valueHeader="Defunciones por mil habitantes"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-muted mb-4 text-center">
                Tasa de nupcialidad (matrimonios por mil habitantes)
              </h3>
              <TrendChart
                points={ratePoints("marriageRate")}
                title="Tasa bruta de nupcialidad"
                labelHeader="Año"
                valueHeader="Matrimonios por mil habitantes"
              />
            </div>
          </div>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: "INE, Indicadores Demográficos Básicos",
                href: indicators.tableUrls.birthRate,
                license: "CC BY 4.0",
              },
            ]}
          />
        </Section>
      ) : null}

      {migrations ? (
        <Section
          id="migraciones"
          title="Quién llega y quién se va"
          description={`Saldo migratorio: personas que fijan su residencia aquí menos las que se marchan, según la Estadística de Migraciones y Cambios de Residencia del INE. Datos hasta ${migrations.latest.year}.`}
          className="bg-surface-sunken"
        >
          <StatGroup>
            <Stat
              label="Saldo migratorio"
              value={`${signedFormat.format(migrations.latest.total)} personas`}
              context={`Año ${migrations.latest.year}`}
            />
            {migrations.latest.internal !== undefined ? (
              <Stat
                label="Con el resto de España"
                value={`${signedFormat.format(migrations.latest.internal)}`}
                context={`Saldo interior en ${migrations.latest.year}`}
              />
            ) : null}
            {migrations.latest.external !== undefined ? (
              <Stat
                label="Con el extranjero"
                value={`${signedFormat.format(migrations.latest.external)}`}
                context={`Saldo exterior en ${migrations.latest.year}`}
              />
            ) : null}
          </StatGroup>
          <div className="mt-12 max-w-3xl">
            <h3 className="text-sm font-semibold text-ink-muted mb-4 text-center">
              Saldo migratorio total por año
            </h3>
            <TrendChart
              points={migrations.years.map((y) => ({ label: String(y.year), value: y.total }))}
              title="Saldo migratorio total"
              labelHeader="Año"
              valueHeader="Saldo (personas)"
            />
          </div>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: "INE, Estadística de Migraciones y Cambios de Residencia",
                href: migrations.tableUrl,
                license: "CC BY 4.0",
              },
            ]}
          />
        </Section>
      ) : null}

      {education ? (
        <Section
          id="estudios"
          title="Nivel de estudios"
          description={`Qué estudios ha completado la población de 15 y más años (${numberFormat.format(education.population)} personas), según el Censo Anual de Población del INE. Datos de ${education.year}.`}
        >
          <div className="max-w-3xl">
            <BarList
              items={education.levels.map((l) => ({ label: l.label, value: l.count }))}
              total={education.population}
            />
          </div>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: "INE, Censo Anual de Población (nivel de estudios)",
                href: education.tableUrl,
                license: "CC BY 4.0",
              },
            ]}
          />
        </Section>
      ) : null}

      {padronData ? (
        <Section
          id="distritos"
          title="Distribución por distritos y secciones"
          description={`El único detalle que no publica el INE: población empadronada en cada distrito y sección electoral. Sale del portal de datos abiertos del Ayuntamiento y llega hasta ${padronData.year}, su último año publicado.`}
          className="bg-surface-sunken"
        >
          <DistrictStats
            districts={padronData.districts}
            boundaries={municipality.sectionBoundaries}
            zonesByDistrict={gazetteer?.zonesByDistrict}
            streetsEndpoint="/api/callejero"
          />
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                href: padron?.datasetUrl ?? municipality.sources.ckan,
                license: padron?.license,
              },
              ...(municipality.sectionBoundariesSource ? [municipality.sectionBoundariesSource] : []),
              ...(gazetteer
                ? [
                    {
                      name: "Callejero oficial por distritos y secciones",
                      href: gazetteer.datasetUrl,
                      license: gazetteer.license,
                    },
                  ]
                : []),
            ]}
          />
        </Section>
      ) : null}
    </>
  );
}
