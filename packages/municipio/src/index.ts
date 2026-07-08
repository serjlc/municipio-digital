import { chiclana } from "./chiclana";

export type { Municipality } from "./types";
export { chiclana };

/**
 * The municipality this deployment serves. Forks change this import
 * (or, in the future, select it via environment variable).
 */
export const municipality = chiclana;
