import { municipality } from "@municipio/config";
import {
  Badge,
  ButtonLink,
  Card,
  CardLink,
  CardText,
  CardTitle,
  Container,
  Section,
} from "@municipio/ui";

const upcomingData = [
  {
    title: "Demografía",
    text: "Cuántos somos, cómo cambia la población y cómo se reparte por el municipio, con datos del INE, del SIMA y del padrón municipal.",
  },
  {
    title: "Clima y costa",
    text: "Temperaturas, avisos y estado del tiempo con datos oficiales de AEMET, pensado para consultarse en dos segundos.",
  },
  {
    title: "Presupuestos",
    text: "En qué se gasta el dinero del municipio, explicado sin necesidad de saber contabilidad pública.",
  },
  {
    title: "Agenda y BOJA",
    text: "Lo que publica la Junta de Andalucía que afecta al municipio: subvenciones, normativa y eventos.",
  },
];

export default function Home() {
  return (
    <>
      <div className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_85%_-10%,var(--color-brand-soft),transparent),radial-gradient(40rem_20rem_at_0%_110%,var(--color-accent-soft),transparent)]"
        />
        <Container className="py-20 sm:py-28">
          <Badge tone="sand">Proyecto ciudadano · software libre</Badge>
          <h1 className="mt-6 max-w-3xl text-display font-semibold text-ink text-balance">
            Los datos de {municipality.shortName},{" "}
            <em className="font-display font-normal italic text-brand">claros y a mano</em>
          </h1>
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            Este sitio recoge datos públicos sobre {municipality.name} desde fuentes oficiales y
            los presenta para que cualquiera los entienda. Lo hacemos vecinos, en abierto, sin
            esperar a nadie. Y el código sirve para cualquier otro municipio.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/#datos" size="lg">
              Ver qué estamos preparando
            </ButtonLink>
            <ButtonLink
              href="https://github.com/serjlc/municipio-digital"
              variant="secondary"
              size="lg"
              external
            >
              Código en GitHub
            </ButtonLink>
          </div>
        </Container>
      </div>

      <Section
        id="datos"
        eyebrow="Datos del municipio"
        title="Qué encontrarás aquí"
        description="Cada sección consume APIs públicas (municipales, andaluzas y estatales), cita su fuente y se actualiza sola. Empezamos por demografía y seguimos con el resto."
      >
        <ul className="grid gap-5 sm:grid-cols-2" role="list">
          {upcomingData.map((item) => (
            <li key={item.title}>
              <Card className="h-full">
                <Badge tone="brand">En camino</Badge>
                <CardTitle>{item.title}</CardTitle>
                <CardText>{item.text}</CardText>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="proyectos"
        eyebrow="Proyectos ciudadanos"
        title="Un hogar para proyectos de vecinos"
        description="Aquí no se consumen datos y ya está: también se generan. Cualquiera puede proponer un proyecto que aporte información nueva sobre el municipio. Se revisa, se publica y su dataset se libera con la metodología documentada."
        className="bg-surface-sunken"
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <Card interactive>
            <Badge tone="sand">Piloto</Badge>
            <CardTitle>
              <CardLink href="/#proyectos">Termografía de fachadas</CardLink>
            </CardTitle>
            <CardText>
              Medir con cámara térmica el calor que alcanzan las fachadas del municipio en verano,
              cruzarlo con la temperatura oficial de AEMET y el año de construcción del Catastro, y
              publicar el dataset completo. Una forma seria de mostrar lo poco preparados que están
              nuestros edificios para el calor que viene.
            </CardText>
          </Card>
          <Card className="justify-between gap-5">
            <div className="flex flex-col gap-3">
              <CardTitle>¿Tienes una idea?</CardTitle>
              <CardText>
                Escribe una propuesta corta: qué es, qué datos usa o genera y quién la mantiene. Si
                encaja con los criterios del proyecto, se incuba y se publica aquí.
              </CardText>
            </div>
            <ButtonLink
              href="https://github.com/serjlc/municipio-digital"
              variant="secondary"
              external
            >
              Proponer un proyecto
            </ButtonLink>
          </Card>
        </div>
      </Section>

      <Section
        id="reutilizar"
        eyebrow="Para otros municipios"
        title="Llévatelo a tu pueblo"
        description={`Nada de ${municipality.shortName} está incrustado en el código. Con un archivo de configuración (código INE, coordenadas y portal de datos local) el mismo proyecto funciona para cualquier municipio español. Las fuentes estatales funcionan solas y las autonómicas se activan por comunidad.`}
      >
        <ButtonLink href="https://github.com/serjlc/municipio-digital" external>
          Empieza con el código
        </ButtonLink>
      </Section>
    </>
  );
}
