import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import { createUser, getAllUsers, updateUser } from "../libs/api/user";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { CreateUserPayload, UpdateUserPayload } from "../types/user";

export function useGetAllUsers() {
  return useQuery({
    queryKey: [queryKeys.getAllUsers],
    queryFn: getAllUsers,
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
