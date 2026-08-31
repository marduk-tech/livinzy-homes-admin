import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  getJob,
  getJobs,
  getScriptManifest,
  runScript,
  stopJob,
} from "../libs/api/manage-scripts";
import { queryKeys } from "../libs/constants";

const errorMessage = (error: unknown, fallback: string) => {
  const err = error as AxiosError<{ error?: string; message?: string }>;
  return err.response?.data?.error || err.response?.data?.message || fallback;
};

export function useScriptManifest() {
  return useQuery({
    queryKey: [queryKeys.getScriptManifest],
    queryFn: getScriptManifest,
    staleTime: 5 * 60 * 1000,
  });
}

export function useScriptJobs() {
  return useQuery({
    queryKey: [queryKeys.getScriptJobs],
    queryFn: getJobs,
    refetchInterval: 3000,
  });
}

export function useScriptJob(jobId?: string) {
  return useQuery({
    queryKey: [queryKeys.getScriptJob, jobId],
    queryFn: () => getJob(jobId as string),
    enabled: !!jobId,
    // Stop hitting the server once the job settles; logs can't change after that.
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
  });
}

export function useRunScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runScript,
    onError: (error) => {
      notification.error({
        message: "Could not start run",
        description: errorMessage(error, "Failed to start the script"),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.getScriptJobs] });
    },
  });
}

export function useStopJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: stopJob,
    onSuccess: () => {
      notification.success({ message: "Stop requested" });
    },
    onError: (error) => {
      notification.error({
        message: "Could not stop job",
        description: errorMessage(error, "Failed to stop the job"),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.getScriptJobs] });
      queryClient.invalidateQueries({ queryKey: [queryKeys.getScriptJob] });
    },
  });
}
