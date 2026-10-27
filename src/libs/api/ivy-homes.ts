import axios from "axios";
import { axiosApiInstance } from "../axios-api-Instance";

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

// Project mapping lives in services (/third-party/ivy-homes/mappings); the
// mapping itself is stored on the Brickfi project's inventoryStatus.

export interface IvyProjectSummary {
  id: number;
  name: string;
  slug?: string;
  locality?: string;
  salesArea?: string;
  lat?: number;
  lng?: number;
  listingCount?: number;
  statuses?: string[];
}

export interface IvyProjectMatch {
  _id: string;
  name: string;
  score: number | null;
  distanceKm: number | null;
  confident?: boolean; // would be auto-mapped by "Run matching"
}

// mapped: already in the DB, matched: auto-mapped by this run,
// stale: mapped in the DB but Ivy no longer lists the project
export type IvyMappingOutcome = "mapped" | "matched" | "suggested" | "unmatched" | "error" | "stale";

export interface IvyProjectMapping {
  ivyProject: IvyProjectSummary;
  mappedProject: IvyProjectMatch | null;
  suggestion: IvyProjectMatch | null;
  outcome: IvyMappingOutcome;
  error?: string;
}

export interface IvyMappingsResponse {
  rows: IvyProjectMapping[];
  summary: Partial<Record<IvyMappingOutcome, number>>;
}

export interface IvyMappingUpdate {
  ivyProjectId: number;
  mappedProject: IvyProjectMatch | null;
  removedFrom: string[];
}

export const getIvyMappings = async (): Promise<IvyMappingsResponse> => {
  const response = await axiosApiInstance.get<IvyMappingsResponse>("/third-party/ivy-homes/mappings");
  return response.data;
};

export const runIvyMatching = async (): Promise<IvyMappingsResponse> => {
  const response = await axiosApiInstance.post<IvyMappingsResponse>("/third-party/ivy-homes/mappings/match");
  return response.data;
};

// projectId null removes the mapping
export const updateIvyMapping = async ({
  ivyProjectId,
  projectId,
}: {
  ivyProjectId: number;
  projectId: string | null;
}): Promise<IvyMappingUpdate> => {
  const response = await axiosApiInstance.put<IvyMappingUpdate>(`/third-party/ivy-homes/mappings/${ivyProjectId}`, {
    projectId,
  });
  return response.data;
};
