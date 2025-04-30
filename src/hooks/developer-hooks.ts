import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createDeveloper,
  deleteDeveloper,
  getAllDevelopers,
  getDeveloperById,
  updateDeveloper,
} from "../libs/api/developer";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import {
  CreateDeveloperPayload,
  UpdateDeveloperPayload,
} from "../types/developer";

export function useGetAllDevelopers() {
  return useQuery({
    queryKey: [queryKeys.getAllDevelopers],
    queryFn: getAllDevelopers,
  });
}

export function useGetDeveloperById(developerId: string) {
  return useQuery({
    queryKey: [queryKeys.getDeveloperById, developerId],
    queryFn: () => getDeveloperById(developerId),
    enabled: !!developerId,
  });
}

export function useCreateDeveloperMutation() {
  return useMutation({
    mutationFn: (developerData: CreateDeveloperPayload) => {
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

export function useUpdateDeveloperMutation() {
  return useMutation({
    mutationFn: ({
      developerId,
      developerData,
    }: {
      developerId: string;
      developerData: UpdateDeveloperPayload;
    }) => {
      return updateDeveloper(developerId, developerData);
    },

    onSuccess: () => {
      notification.success({
        message: `Developer updated successfully!`,
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
    mutationFn: (developerId: string) => {
      return deleteDeveloper(developerId);
    },

    onSuccess: () => {
      notification.success({
        message: `Developer deleted successfully!`,
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
