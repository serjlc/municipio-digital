import { municipality } from "@municipio/config";
import { fetchEquipment, fetchPadronData } from "@municipio/datos";
import { Alert, Container, MunicipalMap, Section, SourceNote } from "@municipio/ui";
import type { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `El mapa de ${municipality.shortName}`,
  description: `${municipality.name} en el mapa: los cinco distritos con sus secciones y los equipamientos públicos (salud, educación, deporte y cultura) según OpenStreetMap.`,
};

export default async function MapaPage() {
  const [equipment, padron] = await Promise.all([
    fetchEquipment(municipality),
    fetchPadronData(municipality),
  ]);
  const totalPoints = equipment?.reduce((sum, c) => sum + c.points.length, 0) ?? 0;
  const populations = padron?.districts.flatMap((d) => {
    const district = parseInt(d.name.replace(/\D/g, ""), 10);
    return d.sections.map((s) => ({ district, section: s.section, total: s.total }));
  });

  return (
    <>
      <Container className="pt-16 pb-6 sm:pt-20 sm:pb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">
          Datos del municipio
        </p>
        <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
          El municipio, <em className="not-italic text-brand">en el mapa</em>
        </h1>
        <p className="mt-6 max-w-2xl text-lead text-ink-muted">
          Los distritos con sus secciones y{" "}
          {totalPoints > 0 ? (
            <>
              <strong className="text-ink">{totalPoints} equipamientos públicos</strong>{" "}
              (centros de salud y farmacias, colegios, instalaciones deportivas y culturales)
            </>
          ) : (
            "los equipamientos públicos"
          )}{" "}
          sobre el callejero. Toca cualquier cosa para ver qué es.
        </p>
      </Container>

      <Section id="mapa" title="Mapa del municipio" hideTitle>
        {!equipment ? (
          <Alert tone="warning" className="mb-6" title="Los equipamientos no se han podido cargar">
            OpenStreetMap no ha respondido al generar esta página, así que de momento el mapa
            muestra solo los distritos. Se reintenta solo; vuelve en un rato.
          </Alert>
        ) : null}
        <MunicipalMap
          center={municipality.coordinates}
          boundaries={municipality.sectionBoundaries}
          categories={equipment ?? []}
          populations={populations}
        />
        <SourceNote
          className="mt-6"
          sources={[
            {
              name: "OpenStreetMap y su comunidad (equipamientos)",
              href: "https://www.openstreetmap.org/copyright",
              license: "ODbL",
            },
            { name: "OpenFreeMap (mapa base)", href: "https://openfreemap.org" },
            ...(municipality.sectionBoundariesSource ? [municipality.sectionBoundariesSource] : []),
          ]}
        />
      </Section>

      {equipment ? (
        <Section
          id="listado"
          title="Los equipamientos, en lista"
          description="Lo mismo que muestra el mapa, para consultarlo sin mapa. Los datos son de OpenStreetMap, el mapa libre que edita la comunidad: si falta algo o algo sobra, cualquiera puede corregirlo allí y esta página lo recogerá."
          className="bg-surface-sunken"
        >
          <div className="grid gap-8 sm:grid-cols-2">
            {equipment.map((category) => (
              <details key={category.id} className="rounded-card border border-line bg-surface-raised p-5 shadow-card">
                <summary className="cursor-pointer font-semibold text-ink">
                  {category.label} ({category.points.length})
                </summary>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-muted" role="list">
                  {category.points.map((point) => (
                    <li key={`${point.name}-${point.lat}`}>{point.name}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
          <SourceNote
            className="mt-8"
            sources={[
              {
                name: "OpenStreetMap y su comunidad",
                href: "https://www.openstreetmap.org/copyright",
                license: "ODbL",
              },
            ]}
          />
        </Section>
      ) : null}
    </>
  );
}
