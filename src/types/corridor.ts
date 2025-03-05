export interface ICorridor {
  _id: string;
  name: string;
  aliases: string[];
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  createdAt: string;
  updatedAt: string;
}
