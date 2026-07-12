import chiclanaRent from "./chiclana-rent.json";
import chiclanaSections from "./chiclana-sections.json";
import type { Municipality, RentPrices, SectionBoundary } from "./types";

export const chiclana: Municipality = {
  name: "Chiclana de la Frontera",
  shortName: "Chiclana",
  ineCode: "11015",
  province: "Cádiz",
  region: "andalucia",
  coordinates: {
    lat: 36.4197,
    lon: -6.146,
  },
  sectionBoundaries: chiclanaSections as SectionBoundary[],
  sectionBoundariesSource: {
    name: "Callejero del Ayuntamiento (contornos de las secciones)",
    href: "https://datosabiertos.chiclana.es/dataset/callejerp",
    license: "Open Data Commons Attribution License",
  },
  rentPrices: chiclanaRent as RentPrices,
  rentPricesSource: {
    name: "SERPAVI, Ministerio de Vivienda y Agenda Urbana",
    href: "https://www.mivau.gob.es/vivienda/alquila-bien-es-tu-derecho/serpavi",
    license: "Ley 37/2007",
  },
  sources: {
    ckan: "https://datosabiertos.chiclana.es",
    townHall: "https://www.chiclana.es",
    /* AEMET has no station in Chiclana; San Fernando is the nearest (7 km) */
    aemetStation: "5972X",
    aemetBeach: "1101503",
    gtfsFeed: {
      url: "https://api.ctan.es/v1/datos/UNIFICADO/gtfs.zip",
      name: "Red de Consorcios de Transporte de Andalucía, datos abiertos",
      href: "https://api.ctan.es/",
    },
  },
  datasets: {
    padron: "padron-municipal-de-habitantes",
    padronFormat: "chiclana",
    minorContracts: "contratos-menores",
    minorContractsFormat: "chiclana",
    budget: "presupuestos",
    budgetFormat: "chiclana",
    streets: "callejerp",
    streetsFormat: "chiclana",
    tourism: {
      occupancy: "flujos-turisticos",
      visitors: "visitantes-y-turismo-en-el-municipio",
      format: "chiclana",
    },
  },
};
