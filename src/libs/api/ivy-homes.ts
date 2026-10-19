import axios from "axios";

// Public partner API, no auth (see Ivy Homes Live Listings API v2 doc).
const IVY_LISTINGS_URL = "https://api.ivy.homes/api/v2/properties/paginated/";

export type IvyCity = "Bangalore" | "Mumbai";

export interface IvyImage {
  alt: string;
  thumbnail: string;
  full_image: string;
}

export interface IvyVideo {
  alt: string;
  thumbnail: string;
  full_video: string; // HLS (.m3u8)
}

export interface IvyStagingGroup {
  title: string;
  items: { id: number; title: string; videos: IvyVideo[] }[];
}

export interface IvyListing {
  id: number;
  property_title: string;
  property_url: string;
  property_status: string;
  engagement_model: string;
  property_config?: string;
  price: number;
  bedrooms: number;
  floor: number;
  area: number;
  area_type: string;
  super_built_up_area: number | null;
  tags: string[];
  sales_start_date: string;
  updated_at: string;
  rank: number;
  project: {
    id: number;
    project_name: string;
    project_slug: string;
    locality: string;
    sales_area: string;
    city_zone: string;
    latitude: number;
    longitude: number;
    tags: string[];
  };
  main_image: IvyImage | null;
  gallery: IvyImage[];
  virtual_stagging_media?: IvyStagingGroup[]; // field name is misspelled in the API
  city: IvyCity; // added client-side, not part of the API response
}

interface IvyPage {
  data: Omit<IvyListing, "city">[];
  meta: { next: string | null };
}

// Unfiltered (all statuses and engagement models), Bangalore by default.
// ~290 listings → 2 calls at page_size=200; follows meta.next so it stays correct if the count changes.
export const getIvyListings = async (): Promise<IvyListing[]> => {
  const listings: Omit<IvyListing, "city">[] = [];
  let url: string | null = IVY_LISTINGS_URL;
  let params: Record<string, unknown> | undefined = { page_size: 200 };
  while (url) {
    const response: { data: IvyPage } = await axios.get(url, { params });
    listings.push(...response.data.data);
    url = response.data.meta?.next ?? null;
    params = undefined; // the "next" URL already carries the query string
  }
  return listings.map((l) => ({ ...l, city: "Bangalore" }));
};
