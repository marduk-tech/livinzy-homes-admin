import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  createLivIndexDriver,
  deleteLivIndexDriver,
  getAllLivIndexDrivers,
  updateLivIndexDriver,
} from "../libs/api/livindex-drivers";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { ILivIndexDriver } from "../types";

export function useFetchLivindexDrivers() {
  return useQuery({
    queryKey: [queryKeys.getAllDrivers],
    queryFn: () => getAllLivIndexDrivers(),
  });
}

export function useUpdateLivindexDriverMutation({
  driverId,
  enableToasts = true,
}: {
  driverId: string;
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({ driverData }: { driverData: Partial<ILivIndexDriver> }) => {
      return updateLivIndexDriver(driverId, driverData);
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Driver updated successfully!`,
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
        queryKey: [queryKeys.getAllDrivers],
      });
    },
  });
}

export function useCreateLivindexDriverMutation() {
  return useMutation({
    mutationFn: (driverData: Partial<ILivIndexDriver>) => {
      return createLivIndexDriver(driverData);
    },

    onSuccess: () => {
      notification.success({
        message: `Driver created successfully!`,
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
        queryKey: [queryKeys.getAllDrivers],
      });
    },
  });
}

export function useDeleteLivindexDriverMutation() {
  return useMutation({
    mutationFn: ({ driverId }: { driverId: string }) => {
      return deleteLivIndexDriver(driverId);
    },

    onSuccess: () => {
      notification.success({
        message: `Driver removed successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.success({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllDrivers],
      });
    },
  });
}
