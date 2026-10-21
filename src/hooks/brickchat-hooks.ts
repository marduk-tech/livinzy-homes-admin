import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  getBrickchatConversation,
  getBrickchatFeedback,
  getBrickchatLog,
  getBrickchatPrompts,
  getLlmCallsForRun,
  getRecentBrickchatLogs,
  updateBrickchatFeedback,
} from "../libs/api/brickchat";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { BrickchatFeedback } from "../types/brickchat-feedback";

export function useGetBrickchatLog(threadId: string | null | undefined) {
  return useQuery({
    queryKey: [queryKeys.getBrickchatLog, threadId],
    queryFn: () => getBrickchatLog(threadId!),
    enabled: !!threadId,
    retry: false,
  });
}

// only fetched once the "See Conversation" modal is opened
export function useGetBrickchatConversation(
  threadId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [queryKeys.getBrickchatConversation, threadId],
    queryFn: () => getBrickchatConversation(threadId!),
    enabled: !!threadId && enabled,
    retry: false,
  });
}

export function useGetRecentBrickchatLogs(limit = 10) {
  return useQuery({
    queryKey: [queryKeys.getRecentBrickchatLogs, limit],
    queryFn: () => getRecentBrickchatLogs(limit),
  });
}

export function useGetLlmCallsForRun(runId: string | null | undefined) {
  return useQuery({
    queryKey: [queryKeys.getLlmCallsForRun, runId],
    queryFn: () => getLlmCallsForRun(runId!),
    enabled: !!runId,
    retry: false,
    // a finished run's LLM calls never change
    staleTime: Infinity,
  });
}

export function useGetBrickchatFeedback() {
  return useQuery({
    queryKey: [queryKeys.getBrickchatFeedback],
    queryFn: () => getBrickchatFeedback(),
  });
}

export function useGetBrickchatPrompts() {
  return useQuery({
    queryKey: [queryKeys.getBrickchatPrompts],
    queryFn: () => getBrickchatPrompts(),
  });
}

export function useUpdateBrickchatFeedbackMutation() {
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Pick<Partial<BrickchatFeedback>, "text" | "status" | "resolutionComment">;
    }) => updateBrickchatFeedback(id, updates),

    onSuccess: () => {
      notification.success({
        message: `Feedback updated successfully!`,
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
        queryKey: [queryKeys.getBrickchatFeedback],
      });
    },
  });
}
