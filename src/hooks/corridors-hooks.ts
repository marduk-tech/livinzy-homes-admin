import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createCorridor,
  deleteCorridor,
  getAllCorridors,
  updateCorridor,
} from "../libs/api/corridors";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { ICorridor } from "../types/corridor";

export function useFetchCorridors() {
  return useQuery({
    queryKey: [queryKeys.getAllCorridors],
    queryFn: () => getAllCorridors(),
  });
}

export function useUpdateCorridorMutation({
  corridorId,
  enableToasts = true,
}: {
  corridorId: string;
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({ corridorData }: { corridorData: Partial<ICorridor> }) => {
      return updateCorridor(corridorId, corridorData);
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Corridor updated`,
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
        queryKey: [queryKeys.getAllCorridors],
      });
    },
  });
}

export function useCreateCorridorMutation() {
  return useMutation({
    mutationFn: (corridorData: Partial<ICorridor>) => {
      return createCorridor(corridorData);
    },

    onSuccess: () => {
      notification.success({
        message: `Corridor created successfully!`,
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
        queryKey: [queryKeys.getAllCorridors],
      });
    },
  });
}

export function useDeleteCorridorMutation() {
  return useMutation({
    mutationFn: ({ corridorId }: { corridorId: string }) => {
      return deleteCorridor(corridorId);
    },

    onSuccess: () => {
      notification.success({
        message: `Corridor removed`,
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
        queryKey: [queryKeys.getAllCorridors],
      });
    },
  });
}
