export interface IMedia {
  _id: string;
  url: string;
  tags: string[];
}

export interface Project {
  _id: string;
  metadata: {
    _id: string;
    name: string;
    location: string;
    website: string;
  };
  land: {
    _id: string;
    total_area: string;
    plantation: string;
    irrigation: string;
    water_bodies: string;
    others: string;
  };
  plots: {
    _id: string;
    size_mix: string;
    facing_mix: string;
    shape_mix: string;
    plots_list: string;
    villa: string;
    cost_range: string;
    others: string;
  };
  media: IMedia[];
  connectivity: {
    _id: string;
    roads: string;
    towns: string;
    schools: string;
    hospital: string;
    airport: string;
    others: string;
  };
  climate: {
    _id: string;
    rainfall: string;
    temperature: string;
    humidity: string;
    others: string;
  };
  basic_infra: {
    _id: string;
    electricity: string;
    water_supply: string;
    pathways: string;
    security: string;
    others: string;
  };
  amenities: {
    _id: string;
    sports_external: string;
    swimming_pool: string;
    clubhouse: string;
    kids: string;
    parks: string;
    parking: string;
    others: string;
  };
  team: {
    _id: string;
    partners: string;
    experience: string;
    others: string;
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}
