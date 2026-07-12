import { chiclana } from "./chiclana";

export type {
  HeatData,
  HeatSection,
  Municipality,
  RentPrices,
  RentYearValue,
  SectionBoundary,
} from "./types";
export { chiclana };

/**
 * The municipality this deployment serves. Forks change this import
 * (or, in the future, select it via environment variable).
 */
export const municipality = chiclana;
