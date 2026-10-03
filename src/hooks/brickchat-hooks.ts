import { useQuery } from "@tanstack/react-query";
import { getBrickchatLog, getRecentBrickchatLogs } from "../libs/api/brickchat";
import { queryKeys } from "../libs/constants";

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
