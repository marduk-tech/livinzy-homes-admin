export interface IMicroPocket {
  _id: string;
  name: string;
  aliases: string[];
  location: {
    lat: number;
    lng: number;
  };
  description: string;
  score?: any;
  scoredAt?: string;
  createdAt: string;
  updatedAt: string;
}
