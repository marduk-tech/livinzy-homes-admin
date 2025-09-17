import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createPlace,
  deletePlace,
  getAllLivIndexPlaces,
  updateLivIndexPlace,
} from "../libs/api/livindex-places";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { ILivIndexPlaces, PlaceType } from "../types";

export function useFetchLivindexPlaces(params?: {
  type?: PlaceType;
  keyword?: string;
  limit?: number;
  sort?: object;
}) {
  return useQuery({
    queryKey: [queryKeys.getAllPlaces, params],
    queryFn: () => getAllLivIndexPlaces(params),
  });
}

export function useUpdateLivindexPlaceMutation({
  placeId,
  enableToasts = true,
}: {
  placeId: string;
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({ placeData }: { placeData: Partial<ILivIndexPlaces> }) => {
      return updateLivIndexPlace(placeId, placeData);
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Place updated successfully!`,
        });
      }
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllPlaces],
      });
    },
  });
}

export function useCreateLivindexPlaceMutation() {
  return useMutation({
    mutationFn: (placeData: Partial<ILivIndexPlaces>) => {
      return createPlace(placeData);
    },

    onSuccess: () => {
      notification.success({
        message: `Place created successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllPlaces],
      });
    },
  });
}

export function useDeletePlaceMutation() {
  return useMutation({
    mutationFn: ({ placeId }: { placeId: string }) => {
      return deletePlace(placeId);
    },

    onSuccess: () => {
      notification.success({
        message: `Place removed successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.success({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllPlaces],
      });
    },
  });
}
