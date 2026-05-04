import { useQuery } from "@tanstack/react-query";
import { getAllTraces, getUserConversations } from "../libs/api/traces";
import { queryKeys } from "../libs/constants";

export function useGetAllTraces() {
  return useQuery({
    queryKey: [queryKeys.getAllTraces],
    queryFn: getAllTraces,
  });
}

export function useGetUserConversations(userId: string | null | undefined) {
  return useQuery({
    queryKey: [queryKeys.getUserConversations, userId],
    queryFn: () => getUserConversations(userId!),
    enabled: !!userId,
  });
}
