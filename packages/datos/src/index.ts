export { fetchPopulation, type PopulationSeries, type PopulationYear } from "./ine";
export {
  fetchWeather,
  type Weather,
  type WeatherNow,
  type ForecastDay,
  type BeachDay,
} from "./aemet";
export { fetchMunicipalDebt, type MunicipalDebt, type DebtYear } from "./hacienda-debt";
export { fetchBojaMentions, type BojaMentions, type BojaMention } from "./junta-boja";
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
  fetchHotelTourism,
  type HotelTourism,
  type TourismYear,
} from "./ine-tourism";
export {
  fetchLocalTourism,
  tourismParsers,
  type TourismParser,
  type LocalTourismData,
  type LocalOccupancy,
  type OccupancyYear,
  type LocalVisitors,
  type VisitorOrigin,
} from "./tourism";
export {
  fetchMunicipalBudget,
  budgetParsers,
  type BudgetParser,
  type MunicipalBudget,
  type BudgetChapter,
} from "./budget";
export {
  fetchStreetGazetteer,
  streetsParsers,
  type StreetsParser,
  type StreetGazetteer,
  type Street,
} from "./streets";
export {
  fetchMinorContracts,
  contractsParsers,
  type ContractsParser,
  type ContractsQuarter,
  type MinorContract,
  type MinorContractsData,
} from "./contracts";
export {
  fetchPadronData,
  padronParsers,
  type PadronParser,
  type PadronData,
  type DistrictPopulation,
  type SectionPopulation,
} from "./padron";
