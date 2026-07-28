import { axiosApiInstance } from "../axios-api-Instance";

export interface AnnotateImageResponse {
  success: boolean;
  annotatedImageUrl: string;
  message: string;
}

export const annotateImage = async (
  imageUrl: string,
  overlayImage: string,
): Promise<AnnotateImageResponse> => {
  const endpoint = `/image-process/annotate`;
  const response = await axiosApiInstance.post<AnnotateImageResponse>(
    endpoint,
    { imageUrl, overlayImage },
  );
  return response.data;
};
