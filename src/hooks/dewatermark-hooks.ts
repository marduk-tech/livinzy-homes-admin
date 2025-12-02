import { useMutation } from "@tanstack/react-query";
import { message } from "antd";
import { removeWatermark } from "../libs/api/dewatermark";

export const useRemoveWatermark = () => {
  return useMutation({
    mutationFn: (imageUrl: string) => removeWatermark(imageUrl),
    onError: (error: any) => {
      message.error(error?.message || "Failed to remove watermark");
      console.error("Watermark removal error:", error);
    },
  });
};
