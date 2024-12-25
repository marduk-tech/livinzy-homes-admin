export interface ILivIndexPlaces {
  _id: string;
  name: string;
  description?: string;
  type?: PlaceType;
  placeId?: string;
  pincode?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  status?: string;
  features?: any;

  createdAt: Date;
  updatedAt: Date;
}

export interface IGlobalKnowledge {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export type PlaceType = "road" | "hospital" | "school" | "futureInfra";

export interface ILivIndexDriver {
  _id: string;
  driverName: string;
  megaDriver?: "macro" | "connectivity" | "livability";
  defaultProximityCoefficient?: number;
  defaultTriggerCoefficient?: number;
}
