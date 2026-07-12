import { municipality } from "@municipio/config";
import { fetchIncomeDistribution, type IncomeUnit } from "@municipio/datos";
import {
  Alert,
  DataTable,
  DataTableCell,
  DataTableRow,
  DataTableRowHeader,
  Section,
  SectionChoropleth,
  SourceNote,
  Stat,
  StatGroup,
  TrendChart,
} from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";

export const maxDuration = 60;
export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const percentFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

const euros = (value: number) => `${numberFormat.format(value)} €`;

export const metadata: Metadata = {
  title: `¿Cuál es la renta media en ${municipality.shortName}?`,
  description: `Renta neta media por persona y por hogar en ${municipality.name} según el Atlas de Renta del INE, su evolución desde 2015 y el detalle barrio a barrio, sección a sección.`,
};

export default async function RentaPage() {
  const income = await fetchIncomeDistribution(municipality);
  const latestYear = income?.latestYear;
  const latest = income?.municipality.years.find((y) => y.year === latestYear);
  const first = income?.municipality.years.find((y) => y.perPerson !== null);

  const growth =
    latest?.perPerson && first?.perPerson
      ? ((latest.perPerson - first.perPerson) / first.perPerson) * 100
      : null;

  const latestOf = (unit: IncomeUnit) => unit.years.find((y) => y.year === latestYear);

  const sectionValues =
    income?.sections.flatMap((s) => {
      const value = latestOf(s)?.perPerson;
      return s.district && s.section && value != null
        ? [{ district: s.district, section: s.section, value }]
        : [];
    }) ?? [];
  const richest = sectionValues.length
    ? sectionValues.reduce((max, s) => (s.value > max.value ? s : max))
    : null;
  const poorest = sectionValues.length
    ? sectionValues.reduce((min, s) => (s.value < min.value ? s : min))
    : null;

  const sources = income
    ? [
        {
          name: "INE, Atlas de Distribución de Renta de los Hogares",
          href: income.tableUrl,
          license: "CC BY 4.0",
        },
      ]
    : [];

  const jsonLd = income
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Renta media en ${municipality.name}`,
        description: `Renta neta media por persona y por hogar en ${municipality.name}, por distritos y secciones censales, según el Atlas de Distribución de Renta de los Hogares del INE.`,
        creator: { "@type": "Organization", name: "Instituto Nacional de Estadística" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        url: income.tableUrl,
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
        eyebrow="Renta"
        title={
          <>
            ¿Cuál es la <em className="not-italic text-brand">renta media</em> en{" "}
            {municipality.shortName}?
          </>
        }
      >
        {income && latest ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            En {latestYear}, la renta neta media en {municipality.shortName} fue de{" "}
            {latest.perPerson !== null ? (
              <strong className="text-ink">{euros(latest.perPerson)} por persona</strong>
            ) : null}
            {latest.perPerson !== null && latest.perHousehold !== null ? " y " : ""}
            {latest.perHousehold !== null ? (
              <strong className="text-ink">{euros(latest.perHousehold)} por hogar</strong>
            ) : null}
            , según el Atlas de Renta del INE. Es la media de todo el municipio: el detalle por
            barrios está más abajo.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar el Atlas de Renta del INE. Suele ser algo temporal: vuelve a
            intentarlo en un rato.
          </Alert>
        )}
      </PageHero>

      {income && latest && latestYear ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              {latest.perPerson !== null ? (
                <Stat
                  label="Renta neta por persona"
                  value={euros(latest.perPerson)}
                  context={`Media anual de ${latestYear}`}
                />
              ) : null}
              {latest.perHousehold !== null ? (
                <Stat
                  label="Renta neta por hogar"
                  value={euros(latest.perHousehold)}
                  context={`Media anual de ${latestYear}`}
                />
              ) : null}
              {latest.medianPerUnit !== null ? (
                <Stat
                  label="Mediana por unidad de consumo"
                  value={euros(latest.medianPerUnit)}
                  context="La mitad de los hogares queda por debajo"
                />
              ) : null}
              {growth !== null && first ? (
                <Stat
                  label={`Desde ${first.year}`}
                  value={`+${percentFormat.format(growth)} %`}
                  context="Crecimiento de la renta por persona, sin descontar inflación"
                />
              ) : null}
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="evolucion"
            title={`La renta desde ${first?.year ?? 2015}`}
            description={`Renta neta media anual según las declaraciones fiscales, que el INE cruza con datos censales. El Atlas llega con unos dos años de decalaje: el último dato disponible es de ${latestYear}. Las cifras son corrientes, sin descontar la inflación.`}
          >
            <div className="grid gap-8 xl:grid-cols-2">
              <div className="min-w-0">
                <TrendChart
                  caption="Renta neta media por persona"
                  points={income.municipality.years.flatMap((y) =>
                    y.perPerson === null ? [] : [{ label: String(y.year), value: y.perPerson }],
                  )}
                  title="Renta neta media por persona y año"
                  labelHeader="Año"
                  valueHeader="Renta neta media por persona (euros)"
                />
              </div>
              <div className="min-w-0">
                <TrendChart
                  caption="Renta neta media por hogar"
                  points={income.municipality.years.flatMap((y) =>
                    y.perHousehold === null
                      ? []
                      : [{ label: String(y.year), value: y.perHousehold }],
                  )}
                  title="Renta neta media por hogar y año"
                  labelHeader="Año"
                  valueHeader="Renta neta media por hogar (euros)"
                />
              </div>
            </div>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="barrios"
            title="La renta, barrio a barrio"
            description={`La media municipal esconde diferencias grandes. ${
              richest && poorest
                ? `En ${latestYear}, la sección con más renta (distrito ${richest.district}, sección ${richest.section}) llegó a ${euros(richest.value)} por persona; la de menos (distrito ${poorest.district}, sección ${poorest.section}) se quedó en ${euros(poorest.value)}.`
                : ""
            } Cada sección censal agrupa unas pocas manzanas; puedes ver cuál es la tuya buscando tu calle en la página de demografía.`}
            className="bg-surface-sunken"
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              {municipality.sectionBoundaries && sectionValues.length > 0 ? (
                <SectionChoropleth
                  boundaries={municipality.sectionBoundaries}
                  values={sectionValues}
                  formatValue={euros}
                  caption={`Renta neta media por persona en ${latestYear}. Cuanto más oscuro, más renta; en gris, sin dato o sin contorno en el callejero municipal. La tabla de al lado lleva el detalle completo.`}
                />
              ) : null}
              <DataTable
                caption={`Renta neta media por persona y por hogar en ${latestYear}, por distrito y sección censal`}
                columns={[
                  { label: "Zona" },
                  { label: "Por persona", align: "right" },
                  { label: "Por hogar", align: "right" },
                ]}
              >
                {income.districts.map((district) => (
                  <DistrictRows
                    key={district.code}
                    district={district}
                    sections={income.sections.filter((s) => s.district === district.district)}
                    latestYear={latestYear}
                  />
                ))}
              </DataTable>
            </div>
            <SourceNote className="mt-8" sources={sources} />
          </Section>
        </>
      ) : null}
    </>
  );
}

function DistrictRows({
  district,
  sections,
  latestYear,
}: {
  district: IncomeUnit;
  sections: IncomeUnit[];
  latestYear: number;
}) {
  const value = (unit: IncomeUnit, key: "perPerson" | "perHousehold") => {
    const v = unit.years.find((y) => y.year === latestYear)?.[key];
    return v == null ? "sin dato" : euros(v);
  };
  return (
    <>
      <DataTableRow emphasis>
        <DataTableRowHeader className="font-semibold">
          Distrito {district.district}
        </DataTableRowHeader>
        <DataTableCell align="right" className="font-semibold text-ink">
          {value(district, "perPerson")}
        </DataTableCell>
        <DataTableCell align="right" className="font-semibold text-ink">
          {value(district, "perHousehold")}
        </DataTableCell>
      </DataTableRow>
      {sections.map((s) => (
        <DataTableRow key={s.code}>
          <DataTableRowHeader indent className="text-ink-muted">
            Sección {s.section}
          </DataTableRowHeader>
          <DataTableCell align="right">{value(s, "perPerson")}</DataTableCell>
          <DataTableCell align="right">{value(s, "perHousehold")}</DataTableCell>
        </DataTableRow>
      ))}
    </>
  );
}
