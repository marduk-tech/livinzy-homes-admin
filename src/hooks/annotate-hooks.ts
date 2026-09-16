import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import { annotateImage, CropRect } from "../libs/api/annotate";

export const useAnnotateImage = () => {
  return useMutation({
    mutationFn: ({
      imageUrl,
      overlayImage,
      cropRect,
    }: {
      imageUrl: string;
      overlayImage?: string;
      cropRect?: CropRect;
    }) => annotateImage(imageUrl, overlayImage, cropRect),
    onError: (error: any) => {
      message.error(error?.message || "Failed to save annotated image");
      console.error("Image annotation error:", error);
    },
  });
};
