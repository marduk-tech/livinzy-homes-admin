import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  getBrickchatFeedback,
  getBrickchatLog,
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

export function useGetRecentBrickchatLogs(limit = 10) {
  return useQuery({
    queryKey: [queryKeys.getRecentBrickchatLogs, limit],
    queryFn: () => getRecentBrickchatLogs(limit),
  });
}

export function useGetBrickchatFeedback() {
  return useQuery({
    queryKey: [queryKeys.getBrickchatFeedback],
    queryFn: () => getBrickchatFeedback(),
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
