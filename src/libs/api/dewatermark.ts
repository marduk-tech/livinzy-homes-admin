import { axiosApiInstance } from "../axios-api-Instance";

export interface RemoveWatermarkRequest {
  imageUrl: string;
}

export interface RemoveWatermarkResponse {
  success: boolean;
  processedImageUrl: string;
  message: string;
}

export const removeWatermark = async (
  imageUrl: string
): Promise<RemoveWatermarkResponse> => {
  const endpoint = `/dewatermark/remove`;
  const response = await axiosApiInstance.post<RemoveWatermarkResponse>(
    endpoint,
    { imageUrl }
  );
  return response.data;
};
