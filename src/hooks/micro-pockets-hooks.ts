import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createMicroPocket,
  deleteMicroPocket,
  getAllMicroPockets,
  updateMicroPocket,
} from "../libs/api/micro-pockets";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { IMicroPocket } from "../types/micro-pocket";

export function useFetchMicroPockets() {
  return useQuery({
    queryKey: [queryKeys.getAllMicroPockets],
    queryFn: () => getAllMicroPockets(),
  });
}

export function useUpdateMicroPocketMutation({
  microPocketId,
  enableToasts = true,
}: {
  microPocketId: string;
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      microPocketData,
    }: {
      microPocketData: Partial<IMicroPocket>;
    }) => {
      return updateMicroPocket(microPocketId, microPocketData);
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Micro Pocket updated`,
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
        queryKey: [queryKeys.getAllMicroPockets],
      });
    },
  });
}

export function useCreateMicroPocketMutation() {
  return useMutation({
    mutationFn: (microPocketData: Partial<IMicroPocket>) => {
      return createMicroPocket(microPocketData);
    },

    onSuccess: () => {
      notification.success({
        message: `Micro Pocket created successfully!`,
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
        queryKey: [queryKeys.getAllMicroPockets],
      });
    },
  });
}

export function useDeleteMicroPocketMutation() {
  return useMutation({
    mutationFn: ({ microPocketId }: { microPocketId: string }) => {
      return deleteMicroPocket(microPocketId);
    },

    onSuccess: () => {
      notification.success({
        message: `Micro Pocket removed`,
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
        queryKey: [queryKeys.getAllMicroPockets],
      });
    },
  });
}
