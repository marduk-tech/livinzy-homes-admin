import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createGlobalKnowledge,
  deleteGlobalKnowledge,
  generateGlobalEmbeddings,
  getAllGlobalKnowledge,
  updateGlobalKnowledge,
} from "../libs/api/global-knowledge";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { IGlobalKnowledge } from "../types";

export function useFetchGlobalKnowledge() {
  return useQuery({
    queryKey: [queryKeys.getAllGlobalKnowledge],
    queryFn: () => getAllGlobalKnowledge(),
  });
}

export function useCreateGlobalKnowledgeMutation() {
  return useMutation({
    mutationFn: (globalKnowledgeData: Partial<IGlobalKnowledge>) => {
      return createGlobalKnowledge(globalKnowledgeData);
    },

    onSuccess: () => {
      notification.success({
        message: `Encyclopedia created successfully!`,
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
        queryKey: [queryKeys.getAllGlobalKnowledge],
      });
    },
  });
}

export function useDeleteGlobalKnowledgeMutation() {
  return useMutation({
    mutationFn: (id: string) => {
      return deleteGlobalKnowledge(id);
    },

    onSuccess: () => {
      notification.success({
        message: `Global Knowledge deleted successfully!`,
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
        queryKey: [queryKeys.getAllGlobalKnowledge],
      });
    },
  });
}

export function useUpdateGlobalKnowledgeMutation() {
  return useMutation({
    mutationFn: ({
      id,
      globalKnowledgeData,
    }: {
      id: string;
      globalKnowledgeData: Partial<IGlobalKnowledge>;
    }) => {
      return updateGlobalKnowledge(id, globalKnowledgeData);
    },

    onSuccess: () => {
      notification.success({
        message: `Encyclopedia updated successfully!`,
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
        queryKey: [queryKeys.getAllGlobalKnowledge],
      });
    },
  });
}
