import { municipality, type RentYearValue } from "@municipio/config";
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

const numberFormat = new Intl.NumberFormat("es-ES");
const decimalFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

const euros = (value: number) => `${numberFormat.format(value)} €`;

export const metadata: Metadata = {
  title: `¿Cuánto cuesta alquilar en ${municipality.shortName}?`,
  description: `Alquiler mediano de pisos y casas en ${municipality.name} según las rentas declaradas a Hacienda (SERPAVI), su evolución desde 2011 y el detalle por secciones censales.`,
};

export default function ViviendaPage() {
  const rent = municipality.rentPrices;
  const source = municipality.rentPricesSource;
  const latestYear = rent ? rent.years[rent.years.length - 1] : undefined;
  const flats = latestYear ? rent?.municipality.flats[latestYear] : undefined;
  const houses = latestYear ? rent?.municipality.houses[latestYear] : undefined;

  const seriesOf = (values: Record<string, RentYearValue> | undefined) =>
    rent && values
      ? rent.years.flatMap((year) => {
          const v = values[year]?.rent;
          return v == null ? [] : [{ label: String(year), value: v }];
        })
      : [];

  const sectionValues =
    rent && latestYear
      ? rent.sections.flatMap((s) => {
          const value = s.flats[latestYear]?.rentM2;
          return value == null ? [] : [{ district: s.district, section: s.section, value }];
        })
      : [];

  const sampleSize = (flats?.count ?? 0) + (houses?.count ?? 0);

  const sources = source ? [source] : [];

  const jsonLd =
    rent && source
      ? {
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Precio del alquiler en ${municipality.name}`,
          description: `Alquiler mensual mediano de viviendas en ${municipality.name} según las rentas declaradas a Hacienda, recopiladas por el sistema estatal SERPAVI.`,
          creator: { "@type": "Organization", name: "Ministerio de Vivienda y Agenda Urbana" },
          url: source.href,
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
        eyebrow="Vivienda"
        title={
          <>
            ¿Cuánto cuesta <em className="not-italic text-brand">alquilar</em> en{" "}
            {municipality.shortName}?
          </>
        }
      >
        {rent && latestYear && flats?.rent != null ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            En {latestYear}, el alquiler mediano de un piso en {municipality.shortName} fue de{" "}
            <strong className="text-ink">{euros(flats.rent)} al mes</strong>
            {houses?.rent != null ? (
              <>
                {" "}
                (el de una casa, <strong className="text-ink">{euros(houses.rent)}</strong>)
              </>
            ) : null}
            , según las rentas declaradas a Hacienda que recopila el sistema estatal SERPAVI.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Sin datos de alquiler">
            Este municipio aún no tiene extracto de SERPAVI declarado en su configuración. El
            script del repositorio explica cómo generarlo en un par de minutos.
          </Alert>
        )}
      </PageHero>

      {rent && latestYear ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              {flats?.rent != null ? (
                <Stat
                  label="Alquiler mediano, piso"
                  value={`${euros(flats.rent)}/mes`}
                  context={`Mediana de ${latestYear}`}
                />
              ) : null}
              {houses?.rent != null ? (
                <Stat
                  label="Alquiler mediano, casa"
                  value={`${euros(houses.rent)}/mes`}
                  context={`Mediana de ${latestYear}`}
                />
              ) : null}
              {flats?.rentM2 != null ? (
                <Stat
                  label="Por metro cuadrado"
                  value={`${decimalFormat.format(flats.rentM2)} €/m²`}
                  context={`Pisos, mediana de ${latestYear}`}
                />
              ) : null}
              {sampleSize > 0 ? (
                <Stat
                  label="Alquileres declarados"
                  value={numberFormat.format(sampleSize)}
                  context={`Viviendas con renta declarada en ${latestYear}`}
                />
              ) : null}
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="que-mide"
            title="Qué mide este dato (y qué no)"
            description={`SERPAVI sale de las declaraciones fiscales de los caseros: es lo que se paga de verdad en los contratos vigentes, incluidos los firmados hace años. Por eso queda por debajo de los precios que ves al buscar piso en los portales, que solo reflejan la oferta nueva. La cifra es la mediana: la mitad de los alquileres de ${municipality.shortName} cuesta menos y la otra mitad más. La última edición publicada llega hasta ${latestYear}.`}
          >
            <div className="grid gap-8 xl:grid-cols-2">
              <div className="min-w-0">
                <TrendChart
                  caption="Alquiler mediano mensual de un piso"
                  points={seriesOf(rent.municipality.flats)}
                  title="Alquiler mediano mensual de pisos por año"
                  labelHeader="Año"
                  valueHeader="Alquiler mediano (euros al mes)"
                />
              </div>
              <div className="min-w-0">
                <TrendChart
                  caption="Alquiler mediano mensual de una casa"
                  points={seriesOf(rent.municipality.houses)}
                  title="Alquiler mediano mensual de casas por año"
                  labelHeader="Año"
                  valueHeader="Alquiler mediano (euros al mes)"
                />
              </div>
            </div>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          {sectionValues.length > 0 ? (
            <Section
              id="zonas"
              title="El alquiler, zona a zona"
              description={`Alquiler mediano por metro cuadrado en cada sección censal con datos suficientes (${sectionValues.length} de ${municipality.sectionBoundaries?.length ?? rent.sections.length} en ${latestYear}). En las zonas con pocos alquileres declarados el ministerio no publica cifra, para no identificar a nadie.`}
              className="bg-surface-sunken"
            >
              <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                {municipality.sectionBoundaries ? (
                  <SectionChoropleth
                    boundaries={municipality.sectionBoundaries}
                    values={sectionValues}
                    formatValue={(v) => `${decimalFormat.format(v)} €/m²`}
                    caption={`Euros por metro cuadrado y mes en ${latestYear}, pisos. Cuanto más oscuro, más caro; en gris, sin dato publicado. La tabla de al lado lleva el detalle.`}
                  />
                ) : null}
                <DataTable
                  caption={`Alquiler mediano por sección censal en ${latestYear}`}
                  columns={[
                    { label: "Sección" },
                    { label: "Piso, al mes", align: "right" },
                    { label: "Por m²", align: "right" },
                  ]}
                >
                  {rent.sections.map((s) => {
                    const v = s.flats[latestYear];
                    if (!v) return null;
                    return (
                      <DataTableRow key={`${s.district}-${s.section}`}>
                        <DataTableRowHeader>
                          Distrito {s.district}, sección {s.section}
                        </DataTableRowHeader>
                        <DataTableCell align="right">
                          {v.rent == null ? "sin dato" : euros(v.rent)}
                        </DataTableCell>
                        <DataTableCell align="right">
                          {v.rentM2 == null ? "sin dato" : `${decimalFormat.format(v.rentM2)} €`}
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTable>
              </div>
              <SourceNote className="mt-8" sources={sources} />
            </Section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
