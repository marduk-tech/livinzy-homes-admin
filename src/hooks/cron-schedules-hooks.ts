import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import {
  createCronSchedule,
  deleteCronSchedule,
  getCronSchedules,
  runCronScheduleNow,
  updateCronSchedule,
} from "../libs/api/cron-schedules";
import { errorMessage } from "../libs/api-error";
import { queryKeys } from "../libs/constants";

export function useCronSchedules() {
  return useQuery({
    queryKey: [queryKeys.getCronSchedules],
    queryFn: getCronSchedules,
    // Only to keep "next run" honest — schedules rarely change under you.
    refetchInterval: 60000,
  });
}

function useScheduleMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  messages: { success: string; error: string },
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      notification.success({ message: messages.success });
    },
    onError: (error) => {
      notification.error({
        message: messages.error,
        description: errorMessage(error, messages.error),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.getCronSchedules] });
    },
  });
}

export function useCreateCronSchedule() {
  return useScheduleMutation(createCronSchedule, {
    success: "Schedule created",
    error: "Could not create the schedule",
  });
}

export function useUpdateCronSchedule() {
  return useScheduleMutation(updateCronSchedule, {
    success: "Schedule updated",
    error: "Could not update the schedule",
  });
}

export function useDeleteCronSchedule() {
  return useScheduleMutation(deleteCronSchedule, {
    success: "Schedule deleted",
    error: "Could not delete the schedule",
  });
}

export function useRunCronScheduleNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runCronScheduleNow,
    onError: (error) => {
      notification.error({
        message: "Could not start run",
        description: errorMessage(error, "Failed to start the schedule"),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.getCronSchedules] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.getScriptJobs] });
    },
  });
}
