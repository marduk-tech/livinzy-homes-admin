import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  addLeadTrailComment,
  createUser,
  deleteLeadTrailComment,
  getAggregatedReports,
  getAllUsers,
  sendReportEmail,
  updateUser,
} from "../libs/api/user";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { CreateUserPayload, UpdateUserPayload } from "../types/user";

export function useGetAllUsers(params?: {
  limit?: number;
  sortBy?: string;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: [queryKeys.getAllUsers, params],
    queryFn: () => getAllUsers(params),
  });
}

export function useGetAggregatedReports() {
  return useQuery({
    queryKey: ['aggregatedReports'],
    queryFn: () => getAggregatedReports(),
  });
}

export function useCreateUserMutation() {
  return useMutation({
    mutationFn: (userData: CreateUserPayload) => {
      return createUser(userData);
    },

    onSuccess: () => {
      notification.success({
        message: `User created successfully!`,
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
        queryKey: [queryKeys.getAllUsers],
      });
    },
  });
}

export function useUpdateUserMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: UpdateUserPayload;
    }) => {
      return updateUser(userId, userData);
    },

    onSuccess: () => {
      notification.success({
        message: `User updated successfully!`,
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
        queryKey: [queryKeys.getAllUsers],
      });
    },
  });
}

export function useSendReportEmailMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      projectIds,
    }: {
      userId: string;
      projectIds: string[];
    }) => {
      return sendReportEmail(userId, projectIds);
    },

    onSuccess: () => {
      notification.success({
        message: `Report notification sent successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `Failed to send notification. Please try again later.`,
      });
      console.log(error);
    },
  });
}

export function useAddLeadTrailCommentMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      comment,
      dateOriginal,
    }: {
      userId: string;
      comment: string;
      dateOriginal?: string;
    }) => {
      return addLeadTrailComment(userId, comment, dateOriginal);
    },

    onSuccess: () => {
      notification.success({
        message: "Comment added successfully!",
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: "Failed to add comment. Please try again.",
      });
      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllUsers],
      });
    },
  });
}

export function useDeleteLeadTrailCommentMutation() {
  return useMutation({
    mutationFn: ({
      userId,
      commentId,
    }: {
      userId: string;
      commentId: string;
    }) => {
      return deleteLeadTrailComment(userId, commentId);
    },

    onSuccess: () => {
      notification.success({
        message: "Comment deleted successfully!",
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: "Failed to delete comment. Please try again.",
      });
      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllUsers],
      });
    },
  });
}
