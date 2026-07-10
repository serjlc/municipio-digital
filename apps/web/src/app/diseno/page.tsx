import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  CardLink,
  CardText,
  CardTitle,
  Container,
  Section,
  SourceNote,
  Stat,
  StatGroup,
  BarList,
  Chip,
  SearchInput,
  TrendChart,
} from "@municipio/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  description:
    "Guía viva del sistema de diseño: colores, tipografía y componentes que usan todas las páginas y proyectos.",
};

const semanticColors = [
  ["surface", "Fondo de la página"],
  ["surface-raised", "Tarjetas y paneles"],
  ["surface-sunken", "Franjas y fondos hundidos"],
  ["ink", "Texto principal"],
  ["ink-muted", "Texto secundario"],
  ["ink-faint", "Texto terciario y notas"],
  ["line", "Bordes y separadores"],
  ["brand", "Color de marca (verde de Andalucía)"],
  ["brand-strong", "Marca reforzada, hovers"],
  ["brand-soft", "Fondos suaves de marca"],
  ["accent", "Acento (albero)"],
  ["accent-strong", "Acento sobre fondos claros"],
  ["accent-soft", "Fondos suaves de acento"],
] as const;

function Swatch({ token, usage }: { token: string; usage: string }) {
  return (
    <li className="flex items-center gap-4 rounded-field border border-line bg-surface-raised p-3">
      <span
        aria-hidden="true"
        className="h-12 w-12 shrink-0 rounded-field border border-line"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <span className="min-w-0">
        <code className="block truncate text-sm font-semibold text-ink">{token}</code>
        <span className="text-sm text-ink-muted">{usage}</span>
      </span>
    </li>
  );
}

export default function DesignPage() {
  return (
    <>
      <Container className="pt-16 pb-6 sm:pt-20 sm:pb-8">
        <h1 className="text-display font-bold text-ink text-balance">Sistema de diseño</h1>
        <p className="mt-5 max-w-2xl text-lead text-ink-muted">
          Guía viva de los tokens y componentes de @municipio/ui. Todo lo que se publica en este
          sitio, incluidos los proyectos ciudadanos, se construye con estas piezas. Los colores se
          adaptan solos al modo claro u oscuro del sistema.
        </p>
      </Container>

      <Section
        id="colores"
        title="Color"
        description="Los componentes usan solo tokens semánticos. Las escalas de base (verde de la bandera andaluza y albero, sobre blanco cal) quedan por debajo, así otro municipio puede cambiar la paleta entera tocando unas pocas variables. El selector de la cabecera fuerza tema claro u oscuro; por defecto se sigue el del sistema."
      >
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {semanticColors.map(([token, usage]) => (
            <Swatch key={token} token={token} usage={usage} />
          ))}
        </ul>
      </Section>

      <Section
        id="tipografia"
        title="Tipografía"
        description="Instrument Sans para todo: los titulares usan peso alto y tracking apretado, el texto corrido queda en peso normal. Los tamaños grandes son fluidos: crecen con la pantalla sin saltos."
        className="bg-surface-sunken"
      >
        <div className="flex flex-col gap-8">
          <p className="text-display font-bold text-ink">
            Titular grande, <em className="not-italic text-brand">con énfasis</em>
          </p>
          <p className="text-title font-semibold text-ink">Título de sección</p>
          <p className="text-subtitle font-semibold text-ink">Subtítulo o título de tarjeta</p>
          <p className="max-w-2xl text-lead text-ink-muted">
            Párrafo de entrada, un punto más grande que el texto normal para abrir secciones.
          </p>
          <p className="max-w-2xl text-ink-muted">
            Texto de lectura normal. Las cifras usan numerales tabulares para que las columnas de
            datos queden alineadas: 1.234.567.
          </p>
        </div>
      </Section>

      <Section
        id="botones"
        title="Botones"
        description="Tres variantes y tres tamaños. Los tamaños medio y grande garantizan un objetivo táctil de al menos 44 píxeles."
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primario</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button disabled>Deshabilitado</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/diseno" size="sm" variant="secondary">
              Pequeño
            </ButtonLink>
            <ButtonLink href="/diseno" variant="secondary">
              Mediano
            </ButtonLink>
            <ButtonLink href="/diseno" size="lg" variant="secondary">
              Grande
            </ButtonLink>
          </div>
        </div>
      </Section>

      <Section
        id="etiquetas"
        title="Etiquetas y avisos"
        description="Las etiquetas marcan estados y categorías. Los avisos comunican contexto sin interrumpir."
        className="bg-surface-sunken"
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-3">
            <Badge>Neutral</Badge>
            <Badge tone="brand">En camino</Badge>
            <Badge tone="sand">Piloto</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Alert title="Dato provisional">
              El INE publica esta serie con unos meses de retraso. La cifra se actualizará sola
              cuando salga la definitiva.
            </Alert>
            <Alert tone="warning" title="Funcionalidad con clave">
              Esta sección necesita una clave gratuita de AEMET. Sin ella, la página se muestra
              igualmente con un aviso como este.
            </Alert>
          </div>
        </div>
      </Section>

      <Section
        id="tarjetas"
        title="Tarjetas y cifras"
        description="La tarjeta es la pieza básica de composición. Cuando toda la tarjeta es un enlace, el título lleva el enlace real y el resto se hace clicable sin duplicar destinos para lectores de pantalla."
      >
        <div className="flex flex-col gap-10">
          <div className="grid gap-5 sm:grid-cols-2">
            <Card interactive>
              <Badge tone="brand">Ejemplo</Badge>
              <CardTitle>
                <CardLink href="/diseno">Tarjeta enlazada</CardLink>
              </CardTitle>
              <CardText>Toda la superficie responde al clic y al foco del teclado.</CardText>
            </Card>
            <Card>
              <CardTitle>Tarjeta estática</CardTitle>
              <CardText>Para contenido que no lleva a ningún sitio.</CardText>
            </Card>
          </div>
          <div>
            <StatGroup>
              <Stat label="Habitantes" value="87.493" context="Padrón 2024" />
              <Stat label="Superficie" value="203 km²" />
              <Stat label="Playas" value="6" />
              <Stat label="Densidad" value="431 /km²" />
            </StatGroup>
            <SourceNote
              className="mt-6"
              sources={[
                { name: "INE", href: "https://www.ine.es", license: "CC BY 4.0" },
                { name: "SIMA, Junta de Andalucía", href: "https://www.juntadeandalucia.es/institutodeestadisticaycartografia/sima/" },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section
        id="chips"
        title="Chips seleccionables"
        description="El selector pequeño del portal: distritos, trimestres, capas del mapa. Verde cuando está activo. Para alternar capas lleva aria-pressed; para seleccionar uno entre varios, no."
        className="bg-surface-sunken"
      >
        <div className="flex flex-wrap gap-2">
          <Chip selected>Distrito 1</Chip>
          <Chip>Distrito 2</Chip>
          <Chip>Distrito 3</Chip>
        </div>
      </Section>

      <Section
        id="buscadores"
        title="Buscadores"
        description="Un único input de búsqueda en todo el portal (SearchInput), siempre con etiqueta accesible. Los resultados van en una lista bajo el campo, nunca en desplegables nativos."
      >
        <SearchInput aria-label="Ejemplo de buscador" placeholder="Busca tu calle..." className="w-full sm:w-96" />
      </Section>

      <Section
        id="graficas"
        title="Gráficas"
        description="Serie temporal en SVG con los tokens del tema. Interactiva con puntero, tacto y flechas del teclado, y con su tabla equivalente oculta para lectores de pantalla. En pantallas estrechas se desliza dentro de su marco; la página nunca scrollea. El título visible entra por la prop caption."
        className="bg-surface-sunken"
      >
        <TrendChart
          caption="Ejemplo: población 2019-2025"
          points={[
            { label: "2019", value: 84568 },
            { label: "2020", value: 85204 },
            { label: "2021", value: 86086 },
            { label: "2022", value: 87493 },
            { label: "2023", value: 88537 },
            { label: "2024", value: 89794 },
            { label: "2025", value: 90864 },
          ]}
          title="Ejemplo de gráfica de tendencia"
          labelHeader="Año"
          valueHeader="Habitantes"
        />
      </Section>

      <Section
        id="barras"
        title="Barras por categoría"
        description="Para repartos (presupuesto por capítulos, visitantes por origen): BarList, renderizada en servidor, con el valor y su porcentaje siempre en texto."
      >
        <div className="max-w-2xl">
          <BarList
            items={[
              { label: "Gastos de personal", value: 28738740 },
              { label: "Bienes corrientes y servicios", value: 31119025 },
              { label: "Inversiones reales", value: 5030229 },
            ]}
          />
        </div>
      </Section>

      <Section
        id="avisos"
        title="Avisos"
        description="Cuando una fuente no responde, la página lo dice con un aviso en su sitio: nada de huecos silenciosos ni datos fingidos."
        className="bg-surface-sunken"
      >
        <div className="flex max-w-2xl flex-col gap-4">
          <Alert title="Dato provisional">La fuente aún no ha publicado la cifra definitiva.</Alert>
          <Alert tone="warning" title="Datos no disponibles ahora mismo">
            No hemos podido consultar la fuente. Suele ser algo temporal.
          </Alert>
        </div>
      </Section>
    </>
  );
}
