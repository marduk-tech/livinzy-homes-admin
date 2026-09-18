import { apiKey, baseApiUrl } from "../constants";
import { axiosApiInstance } from "../axios-api-Instance";

// Routes a scraped image through our backend instead of the browser hitting
// the source site directly - some sites hotlink-protect / mis-serve
// cross-origin requests, which shows up as ERR_BLOCKED_BY_ORB when the raw
// URL is used as an <img src> (see proxyImageController). The api key is
// passed as a query param rather than the usual x-api-key header, since an
// <img> tag can't set custom headers (see validateApiKey's fallback).
export const proxiedImageUrl = (url: string): string =>
  `${baseApiUrl}image-process/proxy-image?url=${encodeURIComponent(
    url,
  )}&apiKey=${encodeURIComponent(apiKey || "")}`;

export interface FetchWebsiteImagesError {
  url: string;
  error: string;
}

export interface FetchWebsiteImagesResponse {
  success: boolean;
  imageUrls: string[];
  errors: FetchWebsiteImagesError[];
  // Candidates dropped because they probed below the min size (or couldn't
  // be probed at all) - see MIN_SCRAPED_IMAGE_DIMENSION in the controller.
  lowResCount: number;
}

// `url` may be a single website url or several separated by commas - the
// backend fetches/scrapes each one and merges the results.
export const fetchWebsiteImages = async (
  url: string
): Promise<FetchWebsiteImagesResponse> => {
  const endpoint = `/image-process/fetch-website-images`;
  const response = await axiosApiInstance.post<FetchWebsiteImagesResponse>(
    endpoint,
    { url }
  );
  return response.data;
};

export interface UploadFromUrlsResult {
  sourceUrl: string;
  uploadedUrl?: string;
  error?: string;
}

export interface UploadFromUrlsResponse {
  success: boolean;
  results: UploadFromUrlsResult[];
}

export const uploadImagesFromUrls = async (
  imageUrls: string[]
): Promise<UploadFromUrlsResponse> => {
  const endpoint = `/image-process/upload-from-urls`;
  const response = await axiosApiInstance.post<UploadFromUrlsResponse>(
    endpoint,
    { imageUrls }
  );
  return response.data;
};
