import chiclanaSections from "./chiclana-sections.json";
import type { Municipality, SectionBoundary } from "./types";

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
  sources: {
    ckan: "https://datosabiertos.chiclana.es",
    townHall: "https://www.chiclana.es",
  },
  datasets: {
    padron: "padron-municipal-de-habitantes",
    padronFormat: "chiclana",
    minorContracts: "contratos-menores",
    minorContractsFormat: "chiclana",
    tourism: {
      occupancy: "flujos-turisticos",
      visitors: "visitantes-y-turismo-en-el-municipio",
      format: "chiclana",
    },
  },
};
