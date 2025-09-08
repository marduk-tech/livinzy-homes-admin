import { axiosApiInstance } from "../axios-api-Instance";

export const getVideoStatus = async (id: string) => {
  if (!id) {
    return null;
  }
  const endpoint = `/upload/video/${id}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as VideoInfo;
  });
};

export const deleteVideo = async (id: string) => {
  const endpoint = `/upload/video/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data as DeleteVideoResponse;
  });
};

export interface DeleteVideoResponse {
  success: boolean;
  message: string;
  statusCode: number;
}

export interface VideoInfo {
  videoLibraryId: number;
  guid: string;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  rotation: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: any[];
  hasMP4Fallback: boolean;
  collectionId: string;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingMessages: any[];
}
