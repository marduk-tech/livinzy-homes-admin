import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getScripts, runScript } from "../libs/api/scripts";
import { queryKeys } from "../libs/constants";

export function useGetScripts() {
  return useQuery({
    queryKey: [queryKeys.getScripts],
    queryFn: getScripts,
    refetchInterval: 30000,
  });
}

export function useRunScript() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runScript,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.getScripts] });
    },
  });
}
