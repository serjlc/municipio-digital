import { municipality } from "@municipio/config";
import { fetchMunicipalBudget, fetchPopulation } from "@municipio/datos";
import { Alert, BarList, Section, SourceNote, Stat, StatGroup } from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const millionsFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

const inMillions = (euros: number) => millionsFormat.format(euros / 1_000_000);

export const metadata: Metadata = {
  title: `¿En qué se gasta el dinero el Ayuntamiento de ${municipality.shortName}?`,
  description: `El presupuesto municipal de ${municipality.name} explicado: cuánto dinero entra, en qué se gasta capítulo a capítulo y cuánto supone por habitante.`,
};

export default async function PresupuestosPage() {
  const [budget, population] = await Promise.all([
    fetchMunicipalBudget(municipality),
    fetchPopulation(municipality),
  ]);

  const populationForYear = budget
    ? (population?.years.find((y) => y.year === budget.year) ?? population?.latest)
    : undefined;
  const perCapita =
    budget && populationForYear ? Math.round(budget.totalExpenses / populationForYear.total) : null;
  const topExpense = budget
    ? budget.expenses.reduce((max, c) => (c.amount > max.amount ? c : max))
    : null;

  const jsonLd = budget
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Presupuesto municipal de ${municipality.name} (${budget.year})`,
        description: `Presupuesto inicial de gastos e ingresos del Ayuntamiento de ${municipality.name} por capítulos.`,
        creator: { "@type": "Organization", name: `Ayuntamiento de ${municipality.name}` },
        license: budget.license,
        url: budget.datasetUrl,
      }
    : null;

  const sources = budget
    ? [
        {
          name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
          href: budget.datasetUrl,
          license: budget.license,
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

      <PageHero
        eyebrow="Transparencia"
        title={
          <>
          ¿En qué se <em className="not-italic text-brand">gasta</em> el dinero el Ayuntamiento?
          </>
        }
      >
        {budget ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            El presupuesto municipal de {budget.year} asciende a{" "}
            <strong className="text-ink">{inMillions(budget.totalExpenses)} millones de euros</strong>{" "}
            en gastos
            {perCapita ? (
              <>
                , unos <strong className="text-ink">{numberFormat.format(perCapita)} € por
                habitante</strong>
              </>
            ) : null}
            , frente a {inMillions(budget.totalIncome)} millones de ingresos previstos.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar el presupuesto desde el portal de datos abiertos del
            Ayuntamiento. Suele ser algo temporal: vuelve a intentarlo en un rato.
          </Alert>
        )}
      </PageHero>

      {budget ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              <Stat
                label="Gastos presupuestados"
                value={`${inMillions(budget.totalExpenses)} M€`}
                context={`Presupuesto inicial de ${budget.year}`}
              />
              <Stat
                label="Ingresos previstos"
                value={`${inMillions(budget.totalIncome)} M€`}
                context={`Presupuesto inicial de ${budget.year}`}
              />
              {perCapita && populationForYear ? (
                <Stat
                  label="Gasto por habitante"
                  value={`${numberFormat.format(perCapita)} €`}
                  context={`Con la población oficial de ${populationForYear.year}`}
                />
              ) : null}
              {topExpense ? (
                <Stat
                  label="Mayor partida"
                  value={`${inMillions(topExpense.amount)} M€`}
                  context={topExpense.label}
                />
              ) : null}
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="gastos"
            title="En qué se gasta"
            description={`Los ${inMillions(budget.totalExpenses)} millones de gasto previsto para ${budget.year}, repartidos por capítulos de la clasificación económica. Importes en euros.`}
          >
            <div className="max-w-3xl">
              <BarList
                items={budget.expenses.map((c) => ({
                  label: `${c.chapter}. ${c.label}`,
                  value: Math.round(c.amount),
                }))}
                total={budget.totalExpenses}
              />
            </div>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="ingresos"
            title="De dónde sale el dinero"
            description={`Los ingresos previstos para ${budget.year} por capítulos: impuestos directos e indirectos, tasas, transferencias de otras administraciones y el resto. Importes en euros.`}
            className="bg-surface-sunken"
          >
            <div className="max-w-3xl">
              <BarList
                items={budget.income.map((c) => ({
                  label: `${c.chapter}. ${c.label}`,
                  value: Math.round(c.amount),
                }))}
                total={budget.totalIncome}
              />
            </div>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="limitaciones"
            title={`Por qué estos datos son de ${budget.year}`}
            description={`Dos motivos, y ninguno es nuestro. El portal de datos abiertos del Ayuntamiento publicó sus tablas de presupuestos por última vez para ${budget.year}, y el Ministerio de Hacienda, que sí recopila la liquidación de cada municipio, solo la ofrece a través de una aplicación con sesión (CONPREL), sin un formato que un programa pueda leer. En cuanto cualquiera de las dos fuentes publique datos más frescos en formato reutilizable, esta página se actualizará sola.`}
          >
            <SourceNote
              sources={[
                ...sources,
                {
                  name: "CONPREL, la consulta interactiva del Ministerio de Hacienda",
                  href: "https://serviciostelematicosext.hacienda.gob.es/SGFAL/CONPREL",
                },
              ]}
            />
          </Section>
        </>
      ) : null}
    </>
  );
}
