import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createGlossary,
  deleteGlossary,
  getAllGlossary,
  updateGlossary,
} from "../libs/api/marketing";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { IGlossary } from "../types";

export function useFetchGlossary() {
  return useQuery({
    queryKey: [queryKeys.getAllGlossary],
    queryFn: () => getAllGlossary(),
  });
}

export function useCreateGlossaryMutation() {
  return useMutation({
    mutationFn: (glossaryData: Partial<IGlossary>) => {
      return createGlossary(glossaryData);
    },

    onSuccess: () => {
      notification.success({
        message: `Glossary term created successfully!`,
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
        queryKey: [queryKeys.getAllGlossary],
      });
    },
  });
}

export function useDeleteGlossaryMutation() {
  return useMutation({
    mutationFn: (id: string) => {
      return deleteGlossary(id);
    },

    onSuccess: () => {
      notification.success({
        message: `Glossary term deleted successfully!`,
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
        queryKey: [queryKeys.getAllGlossary],
      });
    },
  });
}

export function useUpdateGlossaryMutation() {
  return useMutation({
    mutationFn: ({
      id,
      glossaryData,
    }: {
      id: string;
      glossaryData: Partial<IGlossary>;
    }) => {
      return updateGlossary(id, glossaryData);
    },

    onSuccess: () => {
      notification.success({
        message: `Glossary term updated successfully!`,
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
        queryKey: [queryKeys.getAllGlossary],
      });
    },
  });
}
