import { axiosApiInstance } from "../axios-api-Instance";

export interface AnnotateImageResponse {
  success: boolean;
  annotatedImageUrl: string;
  message: string;
}

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const annotateImage = async (
  imageUrl: string,
  overlayImage?: string,
  cropRect?: CropRect,
): Promise<AnnotateImageResponse> => {
  const endpoint = `/image-process/annotate`;
  const response = await axiosApiInstance.post<AnnotateImageResponse>(
    endpoint,
    { imageUrl, overlayImage, cropRect },
  );
  return response.data;
};
