import { municipality } from "@municipio/config";
import { fetchBojaMentions } from "@municipio/datos";
import { Alert, Badge, Section, SourceNote, Stat, StatGroup } from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";

export const revalidate = 43200;

const numberFormat = new Intl.NumberFormat("es-ES");
const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });

export const metadata: Metadata = {
  title: `¿Qué publica la Junta sobre ${municipality.shortName}?`,
  description: `Las disposiciones del BOJA que mencionan a ${municipality.name}: subvenciones, normativa, anuncios y nombramientos, actualizadas cada día desde el boletín oficial.`,
};

export default async function BojaPage() {
  const boja = await fetchBojaMentions(municipality);

  return (
    <>
      <PageHero
        eyebrow="Junta de Andalucía"
        title={
          <>
          ¿Qué <em className="not-italic text-brand">publica la Junta</em> sobre{" "}
          {municipality.shortName}?
          </>
        }
      >
        {boja ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            El BOJA, el boletín oficial de la Junta, ha mencionado a {municipality.name} en{" "}
            <strong className="text-ink">
              {numberFormat.format(boja.totalThisYear)} disposiciones
            </strong>{" "}
            en lo que va de {boja.year}: subvenciones, normativa, anuncios de planeamiento,
            nombramientos. Aquí están las últimas, sin tener que leerse el boletín.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido consultar el BOJA. Suele ser algo temporal: vuelve a intentarlo en un
            rato.
          </Alert>
        )}
      </PageHero>

      {boja ? (
        <>
          <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
            <StatGroup>
              <Stat
                label={`Menciones en ${boja.year}`}
                value={numberFormat.format(boja.totalThisYear)}
                context="Disposiciones que citan al municipio"
              />
              <Stat
                label="Menciones históricas"
                value={numberFormat.format(boja.totalAllTime)}
                context="Desde que el BOJA publica en datos abiertos"
              />
              {boja.items[0]?.date ? (
                <Stat
                  label="Última mención"
                  value={dateFormat.format(new Date(boja.items[0].date))}
                  context={`BOJA número ${boja.items[0].bulletin}`}
                />
              ) : null}
            </StatGroup>
            <SourceNote
              className="mt-8"
              sources={[
                {
                  name: "BOJA, Boletín Oficial de la Junta de Andalucía",
                  href: boja.sourceUrl,
                  license: "CC BY 4.0",
                },
              ]}
            />
          </Section>

          <Section
            id="ultimas"
            title="Últimas disposiciones que mencionan al municipio"
            description={`Las ${boja.items.length} más recientes, de la más nueva a la más antigua. Cada una enlaza al texto completo en el BOJA.`}
          >
            <ul className="flex flex-col divide-y divide-line" role="list">
              {boja.items.map((item) => (
                <li key={item.htmlUrl} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                    {item.date ? <span>{dateFormat.format(new Date(item.date))}</span> : null}
                    {item.type ? <Badge>{item.type}</Badge> : null}
                    <span className="min-w-0 break-words">{item.organisation}</span>
                  </div>
                  <a
                    href={item.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block max-w-3xl font-medium text-ink underline decoration-line underline-offset-4 hover:text-brand hover:decoration-brand"
                  >
                    {item.title}
                  </a>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 text-xs text-ink-faint">
                    <span>
                      BOJA {item.year}, número {item.bulletin}
                    </span>
                    {item.pdfUrl ? (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-ink-muted"
                      >
                        PDF oficial
                      </a>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            <SourceNote
              className="mt-8"
              sources={[
                {
                  name: "BOJA, Boletín Oficial de la Junta de Andalucía",
                  href: boja.sourceUrl,
                  license: "CC BY 4.0",
                },
              ]}
            />
          </Section>
        </>
      ) : null}
    </>
  );
}
