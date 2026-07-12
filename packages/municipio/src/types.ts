/**
 * Everything that is specific to one municipality lives in a single object
 * implementing this interface. The rest of the codebase must stay generic:
 * connectors and UI receive this config, they never hardcode local values.
 */
/** Simplified outline of one census section, for the district map */
export interface SectionBoundary {
  district: number;
  section: number;
  /** Polygon rings as [longitude, latitude] pairs */
  rings: [number, number][][];
}

/** One year of rental prices from SERPAVI: medians of tax-declared rents */
export interface RentYearValue {
  /** Median monthly rent of the whole dwelling, in euros */
  rent: number | null;
  /** Median monthly rent per square metre, in euros */
  rentM2: number | null;
  /** Dwellings with declared rental income that year */
  count?: number | null;
}

/**
 * Rental prices extracted from the SERPAVI database with
 * `packages/datos/scripts/extract-serpavi.mjs`. The ministry ships SERPAVI
 * as one ~70MB spreadsheet for all of Spain, so each municipality commits
 * its own small extract instead of fetching live (the script explains how).
 */
export interface RentPrices {
  /** Which SERPAVI edition the extract comes from, e.g. "marzo de 2026" */
  edition: string;
  years: number[];
  municipality: {
    flats: Record<string, RentYearValue>;
    houses: Record<string, RentYearValue>;
  };
  sections: { district: number; section: number; flats: Record<string, RentYearValue> }[];
}

export interface Municipality {
  /** Display name, e.g. "Chiclana de la Frontera" */
  name: string;
  /** Short name used in navigation and titles, e.g. "Chiclana" */
  shortName: string;
  /** INE municipality code (5 digits). Keys most national data sources. */
  ineCode: string;
  province: string;
  /** Autonomous community slug. Enables regional connectors. */
  region: "andalucia" | (string & {});
  /** Canonical site URL once deployed, used for metadata and canonical links */
  siteUrl?: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  sources: {
    /** Base URL of the local CKAN open data portal, if the town has one */
    ckan?: string;
    /** Official town hall website, linked for attribution */
    townHall?: string;
    /** Nearest AEMET weather station id, for current readings */
    aemetStation?: string;
    /** AEMET beach forecast code, if the town has a monitored beach */
    aemetBeach?: string;
    /**
     * Public transport GTFS feed covering the town, with its attribution.
     * Spain publishes feeds through the national access point
     * (nap.transportes.gob.es); many operators also serve them openly, like
     * the Andalusian consortia (api.ctan.es). The connector filters the
     * feed down to the stops inside the municipality.
     */
    gtfsFeed?: { url: string; name: string; href: string; license?: string };
  };
  /**
   * Census section outlines, if the town publishes them (Chiclana does in
   * its street-map dataset). Optional: without them the district section
   * simply renders no map.
   */
  sectionBoundaries?: SectionBoundary[];
  /** Where the section outlines come from, cited next to the map */
  sectionBoundariesSource?: { name: string; href: string; license?: string };
  /** Rental prices extracted from SERPAVI, if the extract exists */
  rentPrices?: RentPrices;
  /** Where the rental prices come from, cited on the housing page */
  rentPricesSource?: { name: string; href: string; license?: string };
  /** Ids of known datasets in the local CKAN portal */
  datasets?: {
    padron?: string;
    /**
     * Name of the adapter in `padronParsers` (@municipio/datos) that
     * understands this town's padron files. Padron files have no standard
     * format, so each municipality contributes its own adapter. Omit it and
     * the portal still works: demographics falls back to the INE series.
     */
    padronFormat?: string;
    /** Dataset id of the quarterly minor-contract listings */
    minorContracts?: string;
    /** Adapter name in `contractsParsers` (@municipio/datos) for those files */
    minorContractsFormat?: string;
    /** Dataset id of the yearly municipal budget tables */
    budget?: string;
    /** Adapter name in `budgetParsers` (@municipio/datos) for those files */
    budgetFormat?: string;
    /** Dataset id of the official street gazetteer */
    streets?: string;
    /** Adapter name in `streetsParsers` (@municipio/datos) for those files */
    streetsFormat?: string;
    /** Local tourism datasets, parsed by the adapter named in `format` */
    tourism?: {
      /** Dataset id with hotel occupancy compiled by the town hall */
      occupancy?: string;
      /** Dataset id with visitors attended at the tourist offices */
      visitors?: string;
      /** Adapter name in `tourismParsers` (@municipio/datos) */
      format?: string;
    };
  };
}
