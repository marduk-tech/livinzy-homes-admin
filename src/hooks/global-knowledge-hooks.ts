import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createGlobalKnowledge,
  generateGlobalEmbeddings,
  getAllGlobalKnowledge,
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

    onSuccess: async () => {
      await generateGlobalEmbeddings();

      notification.success({
        message: `Global Knowledge created successfully!`,
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
