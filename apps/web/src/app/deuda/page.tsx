import { municipality } from "@municipio/config";
import { fetchMunicipalDebt, fetchPopulation } from "@municipio/datos";
import { Alert, Container, Section, SourceNote, Stat, StatGroup, TrendChart } from "@municipio/ui";
import type { Metadata } from "next";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const millionsFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
const signedPercentFormat = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 1,
  signDisplay: "always",
});

const inMillions = (euros: number) => millionsFormat.format(euros / 1_000_000);

export const metadata: Metadata = {
  title: `¿Cuánto debe el Ayuntamiento de ${municipality.shortName}?`,
  description: `Deuda viva del Ayuntamiento de ${municipality.name} año a año según el Ministerio de Hacienda: cuánto debe, cuánto es por habitante y cómo ha evolucionado desde 2010.`,
};

export default async function DeudaPage() {
  const [debt, population] = await Promise.all([
    fetchMunicipalDebt(municipality),
    fetchPopulation(municipality),
  ]);

  const latest = debt?.latest;
  const populationForYear = latest
    ? (population?.years.find((y) => y.year === latest.year) ?? population?.latest)
    : undefined;
  const perCapita =
    latest && populationForYear ? Math.round(latest.debt / populationForYear.total) : null;
  const yearlyChange =
    latest && debt?.previous
      ? signedPercentFormat.format(((latest.debt - debt.previous.debt) / debt.previous.debt) * 100)
      : null;

  const jsonLd = debt
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Deuda viva del Ayuntamiento de ${municipality.name}`,
        description: `Deuda viva del Ayuntamiento de ${municipality.name} a 31 de diciembre de cada año, publicada por el Ministerio de Hacienda.`,
        creator: { "@type": "Organization", name: "Ministerio de Hacienda" },
        url: debt.sourceUrl,
      }
    : null;

  const sources = debt
    ? [
        {
          name: "Ministerio de Hacienda, deuda viva de las Entidades Locales",
          href: debt.sourceUrl,
          license: "Ley 37/2007",
        },
      ]
    : [];

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      <Container className="pt-16 pb-6 sm:pt-20 sm:pb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Transparencia</p>
        <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
          ¿Cuánto debe el Ayuntamiento?
        </h1>
        {latest ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            El Ayuntamiento de {municipality.shortName} debía{" "}
            <strong className="text-ink">{inMillions(latest.debt)} millones de euros</strong> a 31
            de diciembre de {latest.year}
            {perCapita ? (
              <>
                , unos <strong className="text-ink">{numberFormat.format(perCapita)} € por
                habitante</strong>
              </>
            ) : null}
            , según el Ministerio de Hacienda.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar los datos de deuda del Ministerio de Hacienda. Suele ser algo
            temporal: vuelve a intentarlo en un rato.
          </Alert>
        )}
      </Container>

      {debt && latest ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              <Stat
                label="Deuda viva"
                value={`${inMillions(latest.debt)} M€`}
                context={`A 31 de diciembre de ${latest.year}`}
              />
              {perCapita && populationForYear ? (
                <Stat
                  label="Por habitante"
                  value={`${numberFormat.format(perCapita)} €`}
                  context={`Con la población oficial de ${populationForYear.year}`}
                />
              ) : null}
              {yearlyChange && debt.previous ? (
                <Stat
                  label="Variación anual"
                  value={`${yearlyChange} %`}
                  context={`${inMillions(latest.debt - debt.previous.debt)} M€ respecto a ${debt.previous.year}`}
                />
              ) : null}
              <Stat
                label="Máximo de la serie"
                value={`${inMillions(debt.peak.debt)} M€`}
                context={`Se alcanzó en ${debt.peak.year}`}
              />
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="evolucion"
            title={`La deuda municipal desde ${debt.years[0]?.year}`}
            description={`La deuda viva es lo que el Ayuntamiento debe a bancos y entidades de crédito a cierre de cada año, según el criterio que fija el protocolo de déficit excesivo. No incluye, por ejemplo, las facturas pendientes con proveedores. Del máximo de ${debt.peak.year} (${inMillions(debt.peak.debt)} M€) se pasó a ${inMillions(debt.years.find((y) => y.year === 2023)?.debt ?? latest.debt)} M€ en 2023; los dos últimos ejercicios vuelve a subir.`}
          >
            <TrendChart
              points={debt.years.map((y) => ({
                label: String(y.year),
                value: Math.round(y.debt / 100_000) / 10,
              }))}
              title="Deuda viva municipal por año"
              labelHeader="Año"
              valueHeader="Deuda viva (millones de euros)"
            />
            <SourceNote className="mt-8" sources={sources} />
          </Section>
        </>
      ) : null}
    </>
  );
}
