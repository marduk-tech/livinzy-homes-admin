import { notification } from "antd";
import { AxiosResponse } from "axios";
import { useCallback, useState } from "react";
import { DetailedError, Upload } from "tus-js-client";
import { axiosApiInstance } from "../libs/axios-api-Instance";

interface UseBunnyUploaderOptions {
  onComplete?: (data: { videoId: string; libraryId: number }) => Promise<void>;
}

export function useBunnyUploader(options: UseBunnyUploaderOptions = {}) {
  const { onComplete } = options;
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | DetailedError | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);

  const createVideo = useCallback(async () => {
    try {
      const { data }: AxiosResponse<any> = await axiosApiInstance.post(
        "/upload/create-video"
      );
      return data;
    } catch (error) {
      console.error("Error creating video:", error);
      throw error;
    }
  }, []);

  const upload = useCallback(
    async (videoBlob: Blob) => {
      setIsLoading(true);
      setIsSuccess(false);
      setIsError(false);
      setError(null);
      setProgress(0);

      try {
        const {
          authorizationSignature,
          authorizationExpirationTime,
          videoId,
          libraryId,
        } = await createVideo();

        const upload = new Upload(videoBlob, {
          endpoint: "https://video.bunnycdn.com/tusupload",
          retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
          headers: {
            AuthorizationSignature: authorizationSignature,
            AuthorizationExpire: authorizationExpirationTime,
            VideoId: videoId,
            LibraryId: libraryId,
          },
          metadata: { filetype: videoBlob.type },
          onError: (error) => {
            setIsError(true);
            setError(error);
            notification.error({
              message: "Upload failed. Please try again later.",
            });
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess: async () => {
            setIsSuccess(true);
            if (onComplete) {
              await onComplete({ videoId, libraryId });
            }
            notification.success({ message: "Video uploaded successfully" });
            setIsLoading(false);
          },
        });

        const previousUploads = await upload.findPreviousUploads();
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      } catch (error) {
        setIsError(true);
        setIsLoading(false);
        setError(error as Error);
        notification.error({
          message: "Upload initialization failed. Please try again later.",
        });
      }
    },
    [createVideo, onComplete]
  );

  return {
    upload,
    isError,
    isSuccess,
    error,
    progress,
    isLoading,
  };
}
