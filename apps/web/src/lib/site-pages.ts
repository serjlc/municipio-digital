/*
 * The one place that knows every data page: the landing index, the hub
 * pages and the mobile menu all render from here, so adding a page means
 * adding one entry.
 */
export interface SitePage {
  title: string;
  href?: string;
  text: string;
  group: "municipio" | "transparencia";
  state: "Disponible" | "En preparación";
}

export const sitePages: SitePage[] = [
  {
    title: "Demografía",
    href: "/demografia",
    group: "municipio",
    state: "Disponible",
    text: "Cuántos somos, cómo ha crecido la población desde 1996, pirámide de edades, migraciones, nivel de estudios y el detalle por distritos.",
  },
  {
    title: "Turismo",
    href: "/turismo",
    group: "municipio",
    state: "Disponible",
    text: "Cuántos viajeros y pernoctaciones registran los hoteles según el INE, la ocupación mes a mes y quién visita las oficinas de turismo.",
  },
  {
    title: "Clima y costa",
    href: "/clima",
    group: "municipio",
    state: "Disponible",
    text: "El tiempo de ahora mismo, la predicción oficial de AEMET a siete días y el estado de la playa: agua, viento y oleaje.",
  },
  {
    title: "El mapa",
    href: "/mapa",
    group: "municipio",
    state: "Disponible",
    text: "Los distritos y los equipamientos públicos (salud, educación, deporte y cultura) sobre el callejero, con datos de OpenStreetMap.",
  },
  {
    title: "Presupuestos",
    href: "/presupuestos",
    group: "transparencia",
    state: "Disponible",
    text: "En qué se gasta el dinero del municipio y de dónde sale, capítulo a capítulo, sin necesidad de saber contabilidad pública.",
  },
  {
    title: "Deuda municipal",
    href: "/deuda",
    group: "transparencia",
    state: "Disponible",
    text: "Cuánto debe el Ayuntamiento, cuánto sale por habitante y cómo ha evolucionado desde 2010, con los datos del Ministerio de Hacienda.",
  },
  {
    title: "Contratos menores",
    href: "/contratos-menores",
    group: "transparencia",
    state: "Disponible",
    text: "A quién contrata el Ayuntamiento sin licitación, trimestre a trimestre: adjudicatarios, objeto e importe de cada contrato, con buscador.",
  },
  {
    title: "El BOJA y el municipio",
    href: "/boja",
    group: "transparencia",
    state: "Disponible",
    text: "Cada disposición del boletín de la Junta que menciona al municipio, del día: subvenciones, normativa, planeamiento y nombramientos.",
  },
];

export const municipioPages = sitePages.filter((p) => p.group === "municipio");
export const transparenciaPages = sitePages.filter((p) => p.group === "transparencia");
