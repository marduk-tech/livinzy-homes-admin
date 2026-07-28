import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import { annotateImage } from "../libs/api/annotate";

export const useAnnotateImage = () => {
  return useMutation({
    mutationFn: ({
      imageUrl,
      overlayImage,
    }: {
      imageUrl: string;
      overlayImage: string;
    }) => annotateImage(imageUrl, overlayImage),
    onError: (error: any) => {
      message.error(error?.message || "Failed to save annotated image");
      console.error("Image annotation error:", error);
    },
  });
};
