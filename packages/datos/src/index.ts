export { fetchPopulation, type PopulationSeries, type PopulationYear } from "./ine";
export {
  fetchDemographicIndicators,
  type DemographicIndicators,
  type VitalRatesYear,
  type LifeExpectancy,
} from "./ine-indicators";
export {
  fetchCensusPyramid,
  fetchEducationLevels,
  type AgeGroup,
  type CensusPyramid,
  type EducationLevel,
  type EducationLevels,
} from "./ine-census";
export {
  fetchMigrationBalances,
  type MigrationBalances,
  type MigrationYear,
} from "./ine-migrations";
export { fetchCkanDataset, type CkanDataset, type CkanResource } from "./ckan";
export {
  fetchPadronData,
  padronParsers,
  type PadronParser,
  type PadronData,
  type DistrictPopulation,
  type SectionPopulation,
} from "./padron";
