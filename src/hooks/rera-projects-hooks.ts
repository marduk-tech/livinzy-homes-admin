import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createReraProject,
  deleteReraProject,
  getAllReraProjects,
  getReraProjectById,
  updateReraProject,
} from "../libs/api/rera-project";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import {
  CreateReraProjectPayload,
  UpdateReraProjectPayload,
} from "../types/rera-project";

export function useGetAllReraProjects(params?: { keyword?: string }) {
  return useQuery({
    queryKey: [queryKeys.getAllReraProjects, params],
    queryFn: () => getAllReraProjects(params),
  });
}

export function useGetReraProjectById(projectId: string) {
  return useQuery({
    queryKey: [queryKeys.getReraProjectById, projectId],
    queryFn: () => getReraProjectById(projectId),
    enabled: !!projectId,
  });
}

export function useCreateReraProjectMutation() {
  return useMutation({
    mutationFn: (projectData: CreateReraProjectPayload) => {
      return createReraProject(projectData);
    },

    onSuccess: () => {
      notification.success({
        message: `RERA Project created successfully!`,
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
        queryKey: [queryKeys.getAllReraProjects],
      });
    },
  });
}

export function useUpdateReraProjectMutation() {
  return useMutation({
    mutationFn: ({
      projectId,
      projectData,
    }: {
      projectId: string;
      projectData: UpdateReraProjectPayload;
    }) => {
      return updateReraProject(projectId, projectData);
    },

    onSuccess: () => {
      notification.success({
        message: `RERA Project updated successfully!`,
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
        queryKey: [queryKeys.getAllReraProjects],
      });
    },
  });
}

export function useDeleteReraProjectMutation() {
  return useMutation({
    mutationFn: (projectId: string) => {
      return deleteReraProject(projectId);
    },

    onSuccess: () => {
      notification.success({
        message: `RERA Project deleted successfully!`,
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
        queryKey: [queryKeys.getAllReraProjects],
      });
    },
  });
}
