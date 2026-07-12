import { municipality } from "@municipio/config";
import type { HeatSection } from "@municipio/config";
import {
  Badge,
  DataTable,
  DataTableCell,
  DataTableRow,
  DataTableRowHeader,
  Section,
  SectionChoropleth,
  SourceNote,
  Stat,
  StatGroup,
  TextLink,
} from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../../components/page-hero";

const degrees = (value: number) =>
  `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value)} °C`;

export const metadata: Metadata = {
  title: `¿Qué zonas de ${municipality.shortName} se calientan más?`,
  description: `Temperatura superficial de ${municipality.name} en verano medida por satélite, sección a sección, cruzada con el año de construcción de sus edificios según el Catastro. Primera fase del proyecto ciudadano de termografía.`,
};

const sources = [
  {
    name: "USGS/NASA, Landsat Collection 2 Level-2 (temperatura superficial)",
    href: "https://www.usgs.gov/landsat-missions/landsat-collection-2-level-2-science-products",
    license: "Dominio público",
  },
  {
    name: "Dirección General del Catastro, edificios INSPIRE (año de construcción)",
    href: "https://www.catastro.hacienda.gob.es/webinspire/index.html",
    license: "Reutilización con atribución",
  },
];

export default function TermografiaPage() {
  const heat = municipality.heatData;
  if (!heat) return null;

  const withTemp = heat.sections.filter(
    (s): s is HeatSection & { tempC: number } => s.tempC !== null,
  );
  const hottest = withTemp.reduce((max, s) => (s.tempC > max.tempC ? s : max));
  const coolest = withTemp.reduce((min, s) => (s.tempC < min.tempC ? s : min));
  const gap = hottest.tempC - coolest.tempC;

  const decades = decadeRows(heat.sections);
  const boundariesSource = municipality.sectionBoundariesSource;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Calor urbano en ${municipality.name}: temperatura superficial y edad de la edificación por sección censal`,
    description: `Temperatura superficial media del verano de ${heat.summer} (Landsat) y año mediano de construcción (Catastro) para cada sección censal de ${municipality.name}.`,
    creator: { "@type": "Organization", name: "USGS/NASA y Dirección General del Catastro" },
    license: "https://opendatacommons.org/licenses/by/1-0/",
    url: "https://github.com/serjlc/municipio-digital/blob/main/packages/municipio/src/chiclana-heat.json",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="Proyecto ciudadano"
        title={
          <>
            ¿Qué zonas de {municipality.shortName}{" "}
            <em className="not-italic text-brand">se calientan más</em>?
          </>
        }
      >
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="brand">Primera fase publicada</Badge>
          <Badge>Verano de {heat.summer}</Badge>
        </div>
        <p className="mt-6 max-w-2xl text-lead text-ink-muted">
          El satélite Landsat mide la temperatura de la superficie terrestre. Este proyecto toma
          sus pasadas del verano de {heat.summer} sobre {municipality.shortName}, calcula la
          media de cada sección censal y la cruza con la edad de sus edificios según el Catastro.
          Entre la zona más caliente y la más fresca del municipio hay{" "}
          <strong className="text-ink">{degrees(gap)} de diferencia</strong>.
        </p>
      </PageHero>

      <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
        <StatGroup>
          {heat.municipality.tempC !== null ? (
            <Stat
              label="Temperatura superficial media"
              value={degrees(heat.municipality.tempC)}
              context={`Media de las secciones, verano de ${heat.summer} a mediodía`}
            />
          ) : null}
          <Stat
            label="La sección más caliente"
            value={degrees(hottest.tempC)}
            context={`Distrito ${hottest.district}, sección ${hottest.section}`}
          />
          <Stat
            label="La más fresca"
            value={degrees(coolest.tempC)}
            context={`Distrito ${coolest.district}, sección ${coolest.section}`}
          />
          {heat.municipality.medianYear !== null ? (
            <Stat
              label="Año mediano de construcción"
              value={String(heat.municipality.medianYear)}
              context={`${new Intl.NumberFormat("es-ES").format(heat.municipality.buildings)} edificios con fecha en el Catastro`}
            />
          ) : null}
        </StatGroup>
        <SourceNote className="mt-8" sources={sources} />
      </Section>

      <Section
        id="mapa"
        title="El calor, sección a sección"
        description={`Temperatura superficial media de cada sección censal durante el verano de ${heat.summer}, a partir de ${heat.scenes.length} pasadas de Landsat a mediodía con el cielo despejado. Es la temperatura del suelo, los tejados y el asfalto, no la del aire: por eso supera a la que marca el termómetro.`}
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {municipality.sectionBoundaries ? (
            <SectionChoropleth
              boundaries={municipality.sectionBoundaries}
              values={withTemp.map((s) => ({
                district: s.district,
                section: s.section,
                value: s.tempC,
              }))}
              formatValue={degrees}
              caption={`Temperatura superficial media en verano de ${heat.summer}. Cuanto más oscuro, más calor. La tabla de al lado lleva el detalle completo, con el año de construcción.`}
            />
          ) : null}
          <DataTable
            caption={`Temperatura superficial media (verano de ${heat.summer}) y año mediano de construcción, por distrito y sección censal`}
            columns={[
              { label: "Zona" },
              { label: "Temperatura", align: "right" },
              { label: "Año mediano", align: "right" },
              { label: "Edificios", align: "right" },
            ]}
          >
            {[...new Set(heat.sections.map((s) => s.district))].map((district) => (
              <DistrictRows
                key={district}
                district={district}
                sections={heat.sections.filter((s) => s.district === district)}
              />
            ))}
          </DataTable>
        </div>
        <SourceNote
          className="mt-8"
          sources={boundariesSource ? [...sources, boundariesSource] : sources}
        />
      </Section>

      <Section
        id="edad"
        title="El calor y la edad de los edificios"
        description="Cada sección censal, agrupada por la década en la que se construyó la mitad de sus edificios. La diferencia entre décadas mezcla dos efectos que este dato por sí solo no separa: la edad de la edificación y la geografía, porque las zonas junto al mar son también las de urbanización más reciente."
        className="bg-surface-sunken"
      >
        <DataTable
          caption="Temperatura superficial media de las secciones según su década mediana de construcción"
          columns={[
            { label: "Década de construcción" },
            { label: "Secciones", align: "right" },
            { label: "Temperatura media", align: "right" },
          ]}
        >
          {decades.map((row) => (
            <DataTableRow key={row.label}>
              <DataTableRowHeader>{row.label}</DataTableRowHeader>
              <DataTableCell align="right">{row.count}</DataTableCell>
              <DataTableCell align="right">{degrees(row.meanTemp)}</DataTableCell>
            </DataTableRow>
          ))}
        </DataTable>
        <SourceNote className="mt-8" sources={sources} />
      </Section>

      <Section
        id="metodologia"
        title="Cómo está hecho"
        description="Todo el proceso es reproducible con un script del repositorio, para este municipio o para cualquier otro."
      >
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4 text-ink-muted">
            <p>
              La temperatura sale de las {heat.scenes.length} pasadas de los satélites Landsat 8
              y 9 sobre el municipio entre junio y agosto de {heat.summer} con menos de un 10 %
              de nubes, todas alrededor de las 13:00 hora local. Cada píxel mide 30 metros; los
              píxeles marcados como nube o sombra por la máscara de calidad se descartan, el
              resto se asigna a su sección censal y se promedia.
            </p>
            <p>
              El año de construcción viene de los edificios INSPIRE del Catastro: para cada
              sección se toma el año mediano de sus edificios en estado funcional con fecha
              declarada. Los contornos de las secciones son los del callejero municipal, los
              mismos de las páginas de demografía y renta.
            </p>
            <p>
              La resolución del satélite marca el límite de lo que este mapa puede decir:
              distingue zonas, no edificios. La temperatura de una fachada concreta solo puede
              medirse a pie de calle, y eso es la extensión de este proyecto.
            </p>
          </div>
          <div className="flex flex-col gap-4 text-ink-muted">
            <p>
              El dataset completo, con las {heat.sections.length} secciones y las escenas
              usadas, está en{" "}
              <TextLink href="https://github.com/serjlc/municipio-digital/blob/main/packages/municipio/src/chiclana-heat.json">
                el repositorio
              </TextLink>
              , generado con el script universal{" "}
              <TextLink href="https://github.com/serjlc/municipio-digital/blob/main/packages/datos/scripts/extract-heat.mjs">
                extract-heat.mjs
              </TextLink>
              : cualquier municipio con contornos de secciones obtiene el suyo ejecutándolo con
              su código INE.
            </p>
            <p>
              Maneras de extenderlo, en orden de exigencia: repetir la extracción cada verano
              para construir la serie; cruzar estas secciones con el índice de vegetación
              (NDVI), que conecta con la propuesta del inventario del arbolado; y la extensión
              con cámara térmica, que baja del mapa por zonas a la fachada concreta con la{" "}
              <TextLink href="https://github.com/serjlc/municipio-digital/blob/main/PROPOSALS/termografia-fachadas.md">
                metodología ya escrita
              </TextLink>
              .
            </p>
          </div>
        </div>
        <SourceNote className="mt-8" sources={sources} />
      </Section>
    </>
  );
}

function DistrictRows({ district, sections }: { district: number; sections: HeatSection[] }) {
  return (
    <>
      <DataTableRow emphasis>
        <DataTableRowHeader className="font-semibold">Distrito {district}</DataTableRowHeader>
        <DataTableCell align="right">{""}</DataTableCell>
        <DataTableCell align="right">{""}</DataTableCell>
        <DataTableCell align="right">{""}</DataTableCell>
      </DataTableRow>
      {sections.map((s) => (
        <DataTableRow key={`${s.district}-${s.section}`}>
          <DataTableRowHeader indent className="text-ink-muted">
            Sección {s.section}
          </DataTableRowHeader>
          <DataTableCell align="right">
            {s.tempC === null ? "sin dato" : degrees(s.tempC)}
          </DataTableCell>
          <DataTableCell align="right">{s.medianYear ?? "sin dato"}</DataTableCell>
          <DataTableCell align="right">
            {new Intl.NumberFormat("es-ES").format(s.buildings)}
          </DataTableCell>
        </DataTableRow>
      ))}
    </>
  );
}

function decadeRows(sections: HeatSection[]) {
  const groups = new Map<number, number[]>();
  for (const s of sections) {
    if (s.tempC === null || s.medianYear === null) continue;
    const decade = Math.floor(s.medianYear / 10) * 10;
    const list = groups.get(decade) ?? [];
    list.push(s.tempC);
    groups.set(decade, list);
  }
  return [...groups]
    .sort(([a], [b]) => a - b)
    .map(([decade, temps]) => ({
      label: `Década de ${decade}`,
      count: temps.length,
      meanTemp: temps.reduce((t, v) => t + v, 0) / temps.length,
    }));
}
