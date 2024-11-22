export interface ILivIndexPlaces {
  name: string;
  description?: string;
  type?: string;
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
