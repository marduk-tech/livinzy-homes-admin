import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  addProjectsToDeveloper,
  createDeveloper,
  deleteDeveloper,
  getAllDevelopers,
  getDeveloperById,
  getDeveloperNames,
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

export function useGetDeveloperNames() {
  return useQuery<{ _id: string; name: string }[], Error>({
    queryKey: [queryKeys.getDeveloperNames],
    queryFn: () => getDeveloperNames(),
  });
}

export function useAddProjectsToDeveloperMutation() {
  return useMutation({
    mutationFn: ({
      developerId,
      projects,
    }: {
      developerId: string;
      projects: { id: string; name: string; reraNumber: string }[];
    }) => addProjectsToDeveloper(developerId, projects),

    onSuccess: (data) => {
      notification.success({
        message: data.added > 0
          ? `Added ${data.added} project(s) to developer`
          : data.message,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: "Failed to add projects to developer. Please try again.",
      });
      console.log(error);
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
