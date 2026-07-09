import { municipality } from "@municipio/config";
import { fetchHotelTourism, fetchLocalTourism } from "@municipio/datos";
import {
  Alert,
  BarList,
  Container,
  Section,
  SourceNote,
  Stat,
  StatGroup,
  TrendChart,
} from "@municipio/ui";
import type { Metadata } from "next";

export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");
const decimalFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });

const MONTH_LABELS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export const metadata: Metadata = {
  title: `¿Cuánto turismo recibe ${municipality.shortName}?`,
  description: `Viajeros y pernoctaciones hoteleras en ${municipality.name} según el INE, la ocupación hotelera mes a mes y los visitantes atendidos en las oficinas de turismo.`,
};

export default async function TurismoPage() {
  const [hotels, local] = await Promise.all([
    fetchHotelTourism(municipality),
    fetchLocalTourism(municipality),
  ]);

  const latest = hotels?.latest;
  const avgStay = latest ? latest.nights / latest.travelers : null;
  const foreignShare = latest ? (latest.foreignNights / latest.nights) * 100 : null;

  const occupancyPoints =
    local?.occupancy?.years.flatMap((y) =>
      y.months.flatMap((value, month) =>
        value === null
          ? []
          : [{ label: `${MONTH_LABELS[month]} ${String(y.year).slice(2)}`, value }],
      ),
    ) ?? [];

  const jsonLd = hotels
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Turismo hotelero en ${municipality.name}`,
        description: `Viajeros y pernoctaciones hoteleras anuales en ${municipality.name}, según la Encuesta de Ocupación Hotelera del INE.`,
        creator: { "@type": "Organization", name: "Instituto Nacional de Estadística" },
        license: "https://creativecommons.org/licenses/by/4.0/",
        url: hotels.tableUrl,
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
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Turismo</p>
        <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
          ¿Cuánto turismo recibe {municipality.shortName}?
        </h1>
        {latest ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            En {latest.year} los hoteles de {municipality.shortName} alojaron a{" "}
            <strong className="text-ink">{numberFormat.format(latest.travelers)} viajeros</strong>{" "}
            que sumaron{" "}
            <strong className="text-ink">
              {numberFormat.format(latest.nights)} pernoctaciones
            </strong>
            , según la Encuesta de Ocupación Hotelera del INE.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar la Encuesta de Ocupación Hotelera del INE. Suele ser algo
            temporal: vuelve a intentarlo en un rato.
          </Alert>
        )}
      </Container>

      {hotels && latest ? (
        <>
          <Section
            id="cifras"
            title="Las cifras de un vistazo"
            description={`Turismo hotelero de ${latest.year}, el último año completo publicado por el INE.`}
          >
            <StatGroup>
              <Stat
                label="Viajeros alojados"
                value={numberFormat.format(latest.travelers)}
                context={`Año ${latest.year}`}
              />
              <Stat
                label="Pernoctaciones"
                value={numberFormat.format(latest.nights)}
                context={`Año ${latest.year}`}
              />
              {avgStay ? (
                <Stat
                  label="Estancia media"
                  value={`${decimalFormat.format(avgStay)} noches`}
                  context="Pernoctaciones por viajero"
                />
              ) : null}
              {foreignShare !== null ? (
                <Stat
                  label="Pernoctaciones extranjeras"
                  value={`${decimalFormat.format(foreignShare)} %`}
                  context={`Del total de ${latest.year}`}
                />
              ) : null}
            </StatGroup>
            <SourceNote
              className="mt-8"
              sources={[
                {
                  name: "INE, Encuesta de Ocupación Hotelera",
                  href: hotels.tableUrl,
                  license: "CC BY 4.0",
                },
              ]}
            />
          </Section>

          <Section
            id="evolucion"
            title="El turismo hotelero, mes a mes"
            description="Pernoctaciones y viajeros de cada mes según el INE. La encuesta cambió de base en 2024, así que la serie municipal comparable empieza ahí. Los meses de invierno no aparecen: buena parte de la planta hotelera cierra y el INE no publica dato."
            className="bg-surface-sunken"
          >
            <div className="grid gap-8 xl:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-ink-muted mb-4 text-center">
                  Pernoctaciones por mes
                </h3>
                <TrendChart
                  points={hotels.months.map((m) => ({
                    label: `${MONTH_LABELS[m.month - 1]} ${String(m.year).slice(2)}`,
                    value: m.nights,
                  }))}
                  title="Pernoctaciones hoteleras por mes"
                  labelHeader="Mes"
                  valueHeader="Pernoctaciones"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink-muted mb-4 text-center">
                  Viajeros alojados por mes
                </h3>
                <TrendChart
                  points={hotels.months.map((m) => ({
                    label: `${MONTH_LABELS[m.month - 1]} ${String(m.year).slice(2)}`,
                    value: m.travelers,
                  }))}
                  title="Viajeros alojados por mes"
                  labelHeader="Mes"
                  valueHeader="Viajeros"
                />
              </div>
            </div>
            <SourceNote
              className="mt-8"
              sources={[
                {
                  name: "INE, Encuesta de Ocupación Hotelera",
                  href: hotels.tableUrl,
                  license: "CC BY 4.0",
                },
              ]}
            />
          </Section>
        </>
      ) : null}

      {local?.occupancy && occupancyPoints.length > 1 ? (
        <Section
          id="temporada"
          title="La temporada, mes a mes"
          description={`Porcentaje de ocupación media mensual que recopila el Ayuntamiento (${local.occupancy.scope?.toLowerCase()}), de ${local.occupancy.years[0]?.year} a ${local.occupancy.years[local.occupancy.years.length - 1]?.year}.`}
        >
          <TrendChart
            points={occupancyPoints}
            title="Ocupación hotelera media mensual"
            labelHeader="Mes"
            valueHeader="Ocupación media (%)"
          />
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                href: local.occupancy.datasetUrl,
                license: local.occupancy.license,
              },
            ]}
          />
        </Section>
      ) : null}

      {local?.visitors ? (
        <Section
          id="oficinas"
          title="Quién pregunta en las oficinas de turismo"
          description={`Las oficinas de turismo atendieron a ${numberFormat.format(local.visitors.total)} personas en ${local.visitors.year}, según el registro del propio Ayuntamiento. De dónde venían:`}
          className="bg-surface-sunken"
        >
          <div className="max-w-3xl">
            <BarList
              items={local.visitors.origins.map((o) => ({ label: o.label, value: o.count }))}
              total={local.visitors.total}
            />
          </div>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
                href: local.visitors.datasetUrl,
                license: local.visitors.license,
              },
            ]}
          />
        </Section>
      ) : null}
    </>
  );
}
