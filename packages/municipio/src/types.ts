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
    /** Reference AEMET weather station id */
    aemetStation?: string;
  };
  /**
   * Census section outlines, if the town publishes them (Chiclana does in
   * its street-map dataset). Optional: without them the district section
   * simply renders no map.
   */
  sectionBoundaries?: SectionBoundary[];
  /** Where the section outlines come from, cited next to the map */
  sectionBoundariesSource?: { name: string; href: string; license?: string };
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
