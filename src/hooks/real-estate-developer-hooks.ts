import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createDeveloper,
  deleteDeveloper,
  getAllDevelopers,
  getDeveloperById,
  updateDeveloper,
} from "../libs/api/real-estate-developer";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { RealEstateDeveloper } from "../types/real-estate-developer";

export const useFetchDevelopers = () => {
  return useQuery<RealEstateDeveloper[], Error>({
    queryKey: [queryKeys.getAllDevelopers],
    queryFn: () => getAllDevelopers(),
  });
};

export const useFetchDeveloperById = (id: string) => {
  return useQuery<RealEstateDeveloper, Error>({
    queryKey: [queryKeys.getDeveloperById, id],
    queryFn: () => getDeveloperById(id),
    enabled: !!id,
  });
};

export function useUpdateDeveloperMutation({
  developerId,
  enableToasts = true,
}: {
  developerId: string;
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      developerData,
    }: {
      developerData: Partial<RealEstateDeveloper>;
    }) => {
      return updateDeveloper(developerId, developerData);
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Developer updated successfully!`,
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
        queryKey: [queryKeys.getAllDevelopers],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getDeveloperById, developerId],
      });
    },
  });
}

export function useCreateDeveloperMutation() {
  return useMutation({
    mutationFn: (developerData: Partial<RealEstateDeveloper>) => {
      return createDeveloper(developerData);
    },

    onSuccess: () => {
      notification.success({
        message: `Developer created successfully!`,
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
        queryKey: [queryKeys.getAllDevelopers],
      });
    },
  });
}

export function useDeleteDeveloperMutation() {
  return useMutation({
    mutationFn: ({ developerId }: { developerId: string }) => {
      return deleteDeveloper(developerId);
    },

    onSuccess: () => {
      notification.success({
        message: `Developer removed successfully`,
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
        queryKey: [queryKeys.getAllDevelopers],
      });
    },
  });
}
