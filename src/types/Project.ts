import { ILivIndexPlaces } from ".";

export interface IMedia {
  _id: string;
  type: "image" | "video";
  image?: {
    url: string;
    tags: string[];
    caption?: string;
  };
  isPreview: boolean;
  video?: {
    url: string;
    tags: string[];
    caption?: string;
    bunnyVideoId?: string;
    bunnyTitle?: string;
    status?: string;
    directPlayUrl?: string;
    hlsUrl?: string;
    thumbnailUrl?: string;
    previewUrl?: string;
  };
}

export interface IMetadata {
  _id: string;
  name: string;
  location: string;
  website: string;
  oneLiner?: string;
  description: string;
  summary: string;
  contactNumber?: string;
  homeType:
    | "farmland"
    | "plot"
    | "villa"
    | "rowhouse"
    | "villament"
    | "apartment"
    | "penthouse";
  livinzyArea?: {
    key: string;
    aliases?: string[];
    subArea?: string;
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
  metadata: IMetadata;
  land: ILand;
  plots: IPlots;
  media: IMedia[];
  connectivity: IConnectivity;
  climate: IClimate;
  basic_infra: IBasicInfra;
  amenities: IAmenities;
  team: ITeam;
  ui: IUI;

  livestment: Livestment;

  livIndexScore: LivIndexScore;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectField {
  dbField: string | string[];
  fieldDisplayName: string;
  fieldDescription: string;
  mustHave?: boolean;
  hide?: boolean;

  type?: "single_select" | "text" | "multi_select" | "json";

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
  metadata: ProjectField[];
  ui: ProjectField[];
  land: ProjectField[];
  plots: ProjectField[];
  unitDetails: ProjectField[];
  status: ProjectField[];
  basic_infra: ProjectField[];
  amenities: ProjectField[];
  clickToAction: ProjectField[];
  team: ProjectField[];
  livIndex: ProjectField[];
}
