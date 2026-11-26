import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createGlossary,
  deleteGlossary,
  getAllEmailReachouts,
  getAllFeedbacks,
  createEmailTemplate,
  getAllEmailTemplates,
  getAllGlossary,
  sendTestEmailTemplate,
  updateEmailTemplate,
  updateGlossary,
} from "../libs/api/marketing";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { IGlossary } from "../types";

export function useFetchFeedbacks() {
  return useQuery({
    queryKey: [queryKeys.getAllFeedbacks],
    queryFn: () => getAllFeedbacks(),
  });
}

export function useFetchEmailReachouts() {
  return useQuery({
    queryKey: [queryKeys.getAllEmailReachouts],
    queryFn: () => getAllEmailReachouts(),
  });
}

export function useFetchEmailTemplates() {
  return useQuery({
    queryKey: [queryKeys.getAllEmailTemplates],
    queryFn: () => getAllEmailTemplates(),
  });
}

export function useCreateEmailTemplateMutation() {
  return useMutation({
    mutationFn: (data: { name: string; subject?: string; html: string }) =>
      createEmailTemplate(data),

    onSuccess: () => {
      notification.success({ message: `Email template created!` });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message:
          error.response?.data?.message ||
          `An unexpected error occurred. Please try again later.`,
      });
      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllEmailTemplates],
      });
    },
  });
}

export function useSendTestEmailTemplateMutation() {
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      email: string;
      html?: string;
      subject?: string;
      variables?: Record<string, string>;
    }) => sendTestEmailTemplate(id, data),

    onSuccess: (_, { email }) => {
      notification.success({ message: `Test email sent to ${email}` });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: "Failed to send test email",
        description: error.response?.data?.message || error.message,
      });
      console.log(error);
    },
  });
}

export function useUpdateEmailTemplateMutation() {
  return useMutation({
    mutationFn: ({ id, html }: { id: string; html: string }) =>
      updateEmailTemplate(id, html),

    onSuccess: () => {
      notification.success({ message: `Email template saved!` });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message:
          error.response?.data?.message ||
          `An unexpected error occurred. Please try again later.`,
      });
      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllEmailTemplates],
      });
    },
  });
}

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
