import { municipality } from "@municipio/config";
import { fetchMinorContracts, type MinorContractsData } from "@municipio/datos";
import {
  Alert,
  BarList,
  Container,
  ContractsExplorer,
  Section,
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
const euroFormat = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const quarterLabel = (q: { year: number; quarter: number }) => `${q.quarter}T ${q.year}`;

export const metadata: Metadata = {
  title: `¿A quién contrata el Ayuntamiento de ${municipality.shortName}?`,
  description: `Todos los contratos menores del Ayuntamiento de ${municipality.name}, trimestre a trimestre: adjudicatarios, objeto e importe, con buscador. Datos abiertos oficiales del propio Ayuntamiento.`,
};

function topContractors(data: MinorContractsData, count: number) {
  const totals = new Map<string, number>();
  for (const quarter of data.quarters) {
    for (const contract of quarter.contracts) {
      totals.set(contract.contractor, (totals.get(contract.contractor) ?? 0) + contract.amount);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([label, value]) => ({ label, value: Math.round(value) }));
}

export default async function ContratosMenoresPage() {
  const data = await fetchMinorContracts(municipality);

  if (!data) {
    return (
      <Container className="py-16 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Transparencia</p>
        <h1 className="mt-3 max-w-3xl text-display font-bold text-ink text-balance">
          ¿A quién <em className="not-italic text-brand">contrata</em> el Ayuntamiento?
        </h1>
        <Alert tone="warning" className="mt-8 max-w-2xl" title="Datos no disponibles ahora mismo">
          No hemos podido cargar los contratos menores desde el portal de datos abiertos del
          Ayuntamiento. Suele ser algo temporal: vuelve a intentarlo en un rato.
        </Alert>
      </Container>
    );
  }

  const { latest } = data;
  const contractCount = data.quarters.reduce((sum, q) => sum + q.contracts.length, 0);
  const totalAmount = data.quarters.reduce((sum, q) => sum + q.totalAmount, 0);
  const firstQuarter = data.quarters[0]!;
  const averageLatest = latest.totalAmount / latest.contracts.length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Contratos menores del Ayuntamiento de ${municipality.name}`,
    description: `Listados trimestrales de contratos menores adjudicados por el Ayuntamiento de ${municipality.name}: adjudicatario, objeto e importe.`,
    creator: { "@type": "Organization", name: `Ayuntamiento de ${municipality.name}` },
    license: data.license,
    url: data.datasetUrl,
  };

  const sources = [
    {
      name: `Portal de datos abiertos del Ayuntamiento de ${municipality.name}`,
      href: data.datasetUrl,
      license: data.license,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        eyebrow="Transparencia"
        title={
          <>
          ¿A quién <em className="not-italic text-brand">contrata</em> el Ayuntamiento?
          </>
        }
      >
        <p className="mt-6 max-w-2xl text-lead text-ink-muted">
          Los contratos menores son los que el Ayuntamiento adjudica de forma directa, sin
          licitación, por importes de hasta 15.000 € en servicios y suministros (40.000 € en
          obras). La ley obliga a publicarlos, y aquí puedes verlos todos: en el trimestre{" "}
          {quarterLabel(latest)} fueron{" "}
          <strong className="text-ink">{numberFormat.format(latest.contracts.length)} contratos</strong>{" "}
          por <strong className="text-ink">{euroFormat.format(latest.totalAmount)}</strong>.
        </p>
      </PageHero>

      <Section id="cifras" title="Las cifras de un vistazo" hideTitle className="bg-surface-sunken">
        <StatGroup>
          <Stat
            label="Contratos del trimestre"
            value={numberFormat.format(latest.contracts.length)}
            context={quarterLabel(latest)}
          />
          <Stat
            label="Importe del trimestre"
            value={euroFormat.format(latest.totalAmount)}
            context={`Media de ${euroFormat.format(averageLatest)} por contrato`}
          />
          <Stat
            label="Contratos acumulados"
            value={numberFormat.format(contractCount)}
            context={`Desde ${quarterLabel(firstQuarter)}`}
          />
          <Stat
            label="Importe acumulado"
            value={euroFormat.format(totalAmount)}
            context={`${data.quarters.length} trimestres publicados`}
          />
        </StatGroup>
        <SourceNote className="mt-8" sources={sources} />
      </Section>

      <Section
        id="evolucion"
        title="Evolución trimestral"
        description="Cuánto suma cada trimestre lo adjudicado por contrato menor y cuántos contratos se firman."
      >
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="min-w-0">
            <TrendChart
              caption="Importe total por trimestre (euros)"
              points={data.quarters.map((q) => ({
                label: quarterLabel(q),
                value: Math.round(q.totalAmount),
              }))}
              title="Importe total de contratos menores por trimestre"
              labelHeader="Trimestre"
              valueHeader="Importe (euros, IVA incluido)"
            />
          </div>
          <div className="min-w-0">
            <TrendChart
              caption="Número de contratos por trimestre"
              points={data.quarters.map((q) => ({
                label: quarterLabel(q),
                value: q.contracts.length,
              }))}
              title="Número de contratos menores por trimestre"
              labelHeader="Trimestre"
              valueHeader="Contratos"
            />
          </div>
        </div>
        <SourceNote className="mt-8" sources={sources} />
      </Section>

      <Section
        id="adjudicatarios"
        title="Mayores adjudicatarios"
        description={`Quiénes han acumulado más importe en contratos menores entre ${quarterLabel(firstQuarter)} y ${quarterLabel(latest)}, sumando todos los trimestres publicados.`}
        className="bg-surface-sunken"
      >
        <div className="max-w-3xl">
          <BarList items={topContractors(data, 10)} total={totalAmount} />
        </div>
        <SourceNote className="mt-8" sources={sources} />
      </Section>

      <Section
        id="explorar"
        title="Explora los contratos"
        description="Todos los contratos de cada trimestre, con buscador por adjudicatario y por objeto del contrato, tal y como los publica el Ayuntamiento."
      >
        <ContractsExplorer
          quarters={[...data.quarters].reverse().map((q) => ({
            label: quarterLabel(q),
            contracts: q.contracts,
            totalAmount: q.totalAmount,
          }))}
        />
        <SourceNote className="mt-8" sources={sources} />
      </Section>
    </>
  );
}
