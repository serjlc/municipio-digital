import type { Municipality } from "./types";

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
  sources: {
    ckan: "https://datosabiertos.chiclana.es",
    townHall: "https://www.chiclana.es",
  },
  datasets: {
    padron: "padron-municipal-de-habitantes",
    padronFormat: "chiclana",
  },
};
