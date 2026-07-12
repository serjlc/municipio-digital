import { municipality } from "@municipio/config";
import { fetchEmployment } from "@municipio/datos";
import { Alert, BarList, Section, SourceNote, Stat, StatGroup, TrendChart } from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";

export const maxDuration = 60;
export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const signedFormat = new Intl.NumberFormat("es-ES", { signDisplay: "always" });
const percentFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const monthName = (m: { year: number; month: number }) =>
  `${MONTH_NAMES[m.month - 1]} de ${m.year}`;
const shortLabel = (m: { year: number; month: number }) =>
  `${MONTH_LABELS[m.month - 1]} ${String(m.year).slice(2)}`;

export const metadata: Metadata = {
  title: `¿Cuánto paro hay en ${municipality.shortName}?`,
  description: `Personas registradas como paradas en ${municipality.name} mes a mes desde 2006 según el SEPE: quiénes son por sexo y edad, de qué sectores vienen y cuántos contratos se firman.`,
};

export default async function ParoPage() {
  const employment = await fetchEmployment(municipality);
  const latest = employment?.latest;

  const yearlyChange =
    employment?.yearAgo && latest ? latest.unemployed - employment.yearAgo.unemployed : null;
  const monthlyChange =
    employment?.previous && latest ? latest.unemployed - employment.previous.unemployed : null;

  const sexAgeItems =
    employment?.bySexAge.flatMap((g) => [
      ...(g.women !== null ? [{ label: `Mujeres, ${g.group.toLowerCase()}`, value: g.women }] : []),
      ...(g.men !== null ? [{ label: `Hombres, ${g.group.toLowerCase()}`, value: g.men }] : []),
    ]) ?? [];
  sexAgeItems.sort((a, b) => b.value - a.value);

  const sectorItems =
    employment?.bySector.flatMap((s) =>
      s.value === null ? [] : [{ label: s.sector, value: s.value }],
    ) ?? [];

  const contracts = employment?.contracts;
  const permanentShare =
    contracts && contracts.latest.permanent !== null
      ? (contracts.latest.permanent / contracts.latest.total) * 100
      : null;
  const contractsYearlyChange = contracts?.yearAgo
    ? contracts.latest.total - contracts.yearAgo.total
    : null;

  const sources = [
    {
      name: "SEPE, paro registrado y contratos por municipios",
      href: employment?.sourceUrl ?? "https://datos.gob.es/es/catalogo/ea0041513-paro-registrado-por-municipio",
      license: "CC BY 4.0",
    },
  ];

  const jsonLd = employment
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Paro registrado en ${municipality.name}`,
        description: `Personas registradas como demandantes de empleo paradas en ${municipality.name}, mes a mes, según el Servicio Público de Empleo Estatal.`,
        creator: { "@type": "Organization", name: "Servicio Público de Empleo Estatal (SEPE)" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        url: employment.sourceUrl,
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

      <PageHero
        eyebrow="Empleo"
        title={
          <>
            ¿Cuánto <em className="not-italic text-brand">paro</em> hay en{" "}
            {municipality.shortName}?
          </>
        }
      >
        {employment && latest ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            En {monthName(latest)} había{" "}
            <strong className="text-ink">
              {numberFormat.format(latest.unemployed)} personas registradas como paradas
            </strong>{" "}
            en las oficinas de empleo de {municipality.shortName}
            {yearlyChange !== null ? (
              <>
                , <strong className="text-ink">{numberFormat.format(Math.abs(yearlyChange))}{" "}
                {yearlyChange <= 0 ? "menos" : "más"} que un año antes</strong>
              </>
            ) : null}
            , según el SEPE.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar los datos de paro registrado del SEPE. Suele ser algo temporal:
            vuelve a intentarlo en un rato.
          </Alert>
        )}
      </PageHero>

      {employment && latest ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              <Stat
                label="Personas en paro"
                value={numberFormat.format(latest.unemployed)}
                context={`En ${monthName(latest)}`}
              />
              {monthlyChange !== null && employment.previous ? (
                <Stat
                  label="Variación mensual"
                  value={signedFormat.format(monthlyChange)}
                  context={`Respecto a ${monthName(employment.previous)}`}
                />
              ) : null}
              {yearlyChange !== null && employment.yearAgo ? (
                <Stat
                  label="Variación anual"
                  value={signedFormat.format(yearlyChange)}
                  context={`Respecto a ${monthName(employment.yearAgo)}`}
                />
              ) : null}
              <Stat
                label="Máximo de la serie"
                value={numberFormat.format(employment.peak.unemployed)}
                context={`Se alcanzó en ${monthName(employment.peak)}`}
              />
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="evolucion"
            title={`El paro registrado desde ${employment.months[0]?.year}`}
            description={`Personas apuntadas como paradas al cierre de cada mes. La serie cuenta dos décadas: la crisis que llevó al máximo de ${monthName(employment.peak)} (${numberFormat.format(employment.peak.unemployed)} personas), la recuperación, el golpe de la pandemia y la bajada posterior. El paro registrado cuenta a quienes están apuntados en las oficinas del SEPE; no es lo mismo que la tasa de paro de la EPA, que sale de una encuesta. En los archivos del SEPE faltan algunos meses (de mayo a diciembre de 2013 y diciembre de 2020): la gráfica une los publicados.`}
          >
            <TrendChart
              points={employment.months.map((m) => ({
                label: shortLabel(m),
                value: m.unemployed,
              }))}
              title="Paro registrado por mes"
              labelHeader="Mes"
              valueHeader="Personas en paro"
            />
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          {sexAgeItems.length > 0 ? (
            <Section
              id="quien"
              title="El paro, por sexo y edad"
              description={`Las ${numberFormat.format(latest.unemployed)} personas en paro en ${monthName(latest)}, grupo a grupo. El más numeroso: ${sexAgeItems[0]!.label.toLowerCase()}.`}
              className="bg-surface-sunken"
            >
              <div className="max-w-3xl">
                <BarList items={sexAgeItems} total={latest.unemployed} />
              </div>
              <SourceNote className="mt-8" sources={sources} />
            </Section>
          ) : null}

          {sectorItems.length > 0 ? (
            <Section
              id="sectores"
              title="De qué sectores viene"
              description={`El sector del último empleo de cada persona en paro, en ${monthName(latest)}. "Sin empleo anterior" agrupa a quienes buscan su primer trabajo.`}
            >
              <div className="max-w-3xl">
                <BarList items={sectorItems} total={latest.unemployed} />
              </div>
              <SourceNote className="mt-8" sources={sources} />
            </Section>
          ) : null}

          {contracts ? (
            <Section
              id="contratos"
              title="Y cuántos contratos se firman"
              description={`En ${monthName(contracts.latest)} se registraron ${numberFormat.format(contracts.latest.total)} contratos en ${municipality.shortName}${permanentShare !== null ? `, un ${percentFormat.format(permanentShare)} % de ellos indefinidos (contando las conversiones de temporal a indefinido)` : ""}${contractsYearlyChange !== null && contracts.yearAgo ? `. Son ${numberFormat.format(Math.abs(contractsYearlyChange))} ${contractsYearlyChange <= 0 ? "menos" : "más"} que en ${monthName(contracts.yearAgo)}` : ""}.`}
              className="bg-surface-sunken"
            >
              <TrendChart
                points={contracts.months.map((m) => ({
                  label: shortLabel(m),
                  value: m.total,
                }))}
                title="Contratos registrados por mes"
                labelHeader="Mes"
                valueHeader="Contratos"
              />
              <SourceNote className="mt-8" sources={sources} />
            </Section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
