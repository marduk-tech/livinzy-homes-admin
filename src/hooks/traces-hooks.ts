import { useQuery } from "@tanstack/react-query";
import { getAllTraces } from "../libs/api/traces";
import { queryKeys } from "../libs/constants";

export function useGetAllTraces() {
  return useQuery({
    queryKey: [queryKeys.getAllTraces],
    queryFn: getAllTraces,
  });
}
