import { municipality } from "@municipio/config";
import { fetchTransit } from "@municipio/datos";
import {
  Alert,
  DataTable,
  DataTableCell,
  DataTableRow,
  DataTableRowHeader,
  Section,
  SourceNote,
  Stat,
  StatGroup,
  TextLink,
} from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";

export const maxDuration = 60;
export const revalidate = 86400;

const numberFormat = new Intl.NumberFormat("es-ES");

export const metadata: Metadata = {
  title: `¿Qué autobuses pasan por ${municipality.shortName}?`,
  description: `Las líneas de autobús que paran en ${municipality.name}, con sus salidas en día laborable, la primera y la última, según los datos abiertos del transporte público.`,
};

export default async function TransportePage() {
  const transit = await fetchTransit(municipality);
  const busiest = transit?.lines[0];
  const totalDepartures = transit?.lines.reduce((sum, l) => sum + l.weekdayDepartures, 0) ?? 0;

  const sources = transit
    ? [{ name: transit.feed.name, href: transit.feed.href, license: transit.feed.license }]
    : [];

  const jsonLd = transit
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `Autobuses que paran en ${municipality.name}`,
        description: `Líneas de autobús con parada en ${municipality.name} y sus salidas en día laborable, a partir del formato estándar GTFS.`,
        creator: { "@type": "Organization", name: transit.feed.name },
        url: transit.feed.href,
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
        eyebrow="Transporte"
        title={
          <>
            ¿Qué <em className="not-italic text-brand">autobuses</em> pasan por{" "}
            {municipality.shortName}?
          </>
        }
      >
        {transit && busiest ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            <strong className="text-ink">{transit.lines.length} líneas de autobús</strong> paran en
            las {numberFormat.format(transit.stops.length)} paradas del municipio. La más
            frecuente, la {busiest.shortName} ({busiest.longName}), sale{" "}
            <strong className="text-ink">
              {numberFormat.format(busiest.weekdayDepartures)} veces
            </strong>{" "}
            cada día laborable.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido cargar el fichero de horarios del transporte público. Suele ser algo
            temporal: vuelve a intentarlo en un rato.
          </Alert>
        )}
      </PageHero>

      {transit && busiest ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              <Stat
                label="Líneas con parada"
                value={String(transit.lines.length)}
                context="En día laborable"
              />
              <Stat
                label="Paradas en el municipio"
                value={numberFormat.format(transit.stops.length)}
                context="Dentro del término municipal"
              />
              <Stat
                label="Salidas diarias"
                value={numberFormat.format(totalDepartures)}
                context="Desde paradas del municipio, día laborable"
              />
              <Stat
                label="Línea más frecuente"
                value={busiest.shortName}
                context={`${numberFormat.format(busiest.weekdayDepartures)} salidas al día`}
              />
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="lineas"
            title="Las líneas, una a una"
            description="Salidas desde paradas del municipio en un día laborable tipo; los fines de semana y festivos cambian, así que para planificar un viaje consulta el horario oficial de cada línea (el enlace del nombre). Si echas de menos una línea, por ejemplo el autobús urbano, es que su operador todavía no publica los horarios en formato abierto."
          >
            <DataTable
              caption={`Líneas de autobús con parada en ${municipality.shortName}: salidas en día laborable, primera y última`}
              columns={[
                { label: "Línea" },
                { label: "Salidas", align: "right" },
                { label: "Primera", align: "right" },
                { label: "Última", align: "right" },
              ]}
            >
              {transit.lines.map((line) => (
                <DataTableRow key={`${line.shortName}-${line.longName}`}>
                  <DataTableRowHeader className="min-w-48">
                    <span className="block font-semibold text-ink">
                      {line.url ? (
                        <TextLink href={line.url}>{line.shortName}</TextLink>
                      ) : (
                        line.shortName
                      )}
                    </span>
                    <span className="block text-ink-muted">{line.longName}</span>
                  </DataTableRowHeader>
                  <DataTableCell align="right" className="text-ink">
                    {numberFormat.format(line.weekdayDepartures)}
                  </DataTableCell>
                  <DataTableCell align="right">{line.first}</DataTableCell>
                  <DataTableCell align="right">{line.last}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTable>
            <SourceNote className="mt-8" sources={sources} />
          </Section>
        </>
      ) : null}
    </>
  );
}
