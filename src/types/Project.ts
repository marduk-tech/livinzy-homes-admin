import { ILivIndexPlaces } from ".";

export interface IMedia {
  _id: string;
  type: "image" | "video" | "document";
  image?: {
    url: string;
    tags: string[];
    caption?: string;
  };
  isPreview: boolean;
  video?: {
    url?: string;
    tags: string[];
    caption?: string;
    bunnyVideoId?: string;
    bunnyTitle?: string;
    status?: string;
    directPlayUrl?: string;
    hlsUrl?: string;
    thumbnailUrl?: string;
    previewUrl?: string;
    isYoutube?: boolean;
    youtubeUrl?: string;
    bunnyLibraryId?: number;
  };
  document?: {
    name: string;
    url: string;
    documentType: "brochure" | "project-specs";
  };
}

export interface IInfo {
  _id: string;
  name: string;
  location: {
    _id: string;
    mapLink: string;
    lat: number;
    lng: number;
  };
  externalWebsites: string;
  configWithPricing: string;
  financialPlan: string;
  amenities: string;
  developerId?: string;
  homeType: Array<
    | "farmland"
    | "plot"
    | "villa"
    | "rowhouse"
    | "villament"
    | "apartment"
    | "penthouse"
  >;
  status: "new" | "active" | "disabled";
  reraNumber?: string;
  reraProjectId: string;
  corridors?: {
    corridorId: string;
    haversineDistance: number;
  };
  refinedContent: any;
  unitConfigWithPricing: Array<{
    _id?: string;
    config: string;
    price: number;
    floorplans: string[];
  }>;
  rate: {
    minimumUnitCost: number;
    minimumUnitSize: number;
  };
}

export interface ILand {
  _id: string;
  total_area: string;
  plantation: string;
  irrigation: string;
  water_bodies: string;
  others: string;
}

export interface IPlots {
  _id: string;
  size_mix: string;
  facing_mix: string;
  shape_mix: string;
  plots_list: string;
  villa: string;
  cost_range: string;
  others: string;
}

export interface IConnectivity {
  _id: string;
  roads: string;
  towns: string;
  schools: string;
  hospital: string;
  airport: string;
  others: string;
}

export interface IClimate {
  _id: string;
  rainfall: string;
  temperature: string;
  humidity: string;
  others: string;
}

export interface IBasicInfra {
  _id: string;
  electricity: string;
  water_supply: string;
  pathways: string;
  security: string;
  others: string;
}

export interface IAmenities {
  _id: string;
  sports_external: string;
  swimming_pool: string;
  clubhouse: string;
  kids: string;
  parks: string;
  parking: string;
  others: string;
}

export interface ITeam {
  _id: string;
  partners: string;
  experience: string;
  others: string;
}

export interface IUI {
  description: string;
  oneLiner: string;
  projectDetails: string;
  costingDetails: string;
  statusDetails: string;
  landDetails: string;
  builderDetails: string;
  amenitiesSummary: string;
  categories: string[];
}

interface ExtrinsicDriverCoefficients {
  proximityCoeffecient: number;
  countCoeffecient: number;
  triggerCoeffecient: number;
  timelineCoeffecient: number;
}

export interface ExtrinsicDriver {
  score: number;
  place: ILivIndexPlaces;
  distance: number;
  summary: string;
  coefficients: ExtrinsicDriverCoefficients;
}

interface IntrinsicDriverCoefficients {
  craftCoeffecient: number;
  builderCoeffecient: number;
}

interface IntrinsicDriver {
  coefficients: IntrinsicDriverCoefficients;
}

export interface LivIndexScore {
  score: number;
  summary: string;
  extrinsicDrivers: ExtrinsicDriver[];
  intrinsicDriver: IntrinsicDriver[];
}

export interface Project {
  _id: string;
  info: IInfo;
  media: IMedia[];
  ui: IUI;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectField {
  dbField: string | string[];
  fieldDisplayName: string;
  fieldDescription: string;
  mustHave?: boolean;
  hide?: boolean;

  type?:
    | "single_select"
    | "text"
    | "multi_select"
    | "json"
    | "unit_config_list";

  options?: { label: string; value: string }[];
}

interface Place {
  name: string;
  latLng: {
    lat: number;
    lng: number;
  };
  description: string;
}

interface SubLivestmentScore {
  placesList: Place[];
  score: number;
}

interface Livestment {
  livestmentScore: number;
  metroCityScore: SubLivestmentScore;
  tier2CityScore: SubLivestmentScore;
  touristCityScore: SubLivestmentScore;
  schoolsScore: SubLivestmentScore;
  hospitalsScore: SubLivestmentScore;
  airportScore: SubLivestmentScore;
  roadsScore: SubLivestmentScore;
}

export interface ProjectStructure {
  info: ProjectField[];
}
