export interface ILivIndexPlaces {
  _id: string;
  name: string;

  type?: PlaceType;
  placeId?: string;
  pincode?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  status?: string;
  features?: any;
  driver: string;
  createdAt: Date;
  updatedAt: Date;

  details: {
    description?: string;
    oneLiner?: string;
    footfall?: number;
  };
  corridors?: Array<{
    _id: string;
    corridorId: string;
    haversineDistance: number;
  }>;
}

export interface IGlobalKnowledge {
  _id: string;
  content: string;
  sources?: string;
  corridors?: Array<{
    _id: string;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type PlaceType = "road" | "hospital" | "school" | "futureInfra";

export interface ILivIndexDriver {
  _id: string;
  driverName: string;
  megaDriver?: "macro" | "connectivity" | "livability";
  defaultProximityThreshold?: number;
  defaultTriggerCoefficient?: number;
}

export interface IChromaDoc {
  id: string;
  document: string;
  metadata: IChromaMetaData;
}

export interface IChromaMetaData {
  [key: string]: any;
}

export interface IGlossary {
  _id: string;
  type: string;
  content: {
    title?: string;
    description?: string;
    content?: string;
    pageLink?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IGhostPage {
  id: string;
  title: string;
  slug: string;
  status?: string;
}
