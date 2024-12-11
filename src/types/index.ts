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

export type PlaceType = "road" | "hospital" | "school" | "futureInfra";
