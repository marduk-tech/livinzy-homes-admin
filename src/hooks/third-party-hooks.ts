import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAmbakMasterdata, getAmbakOffers } from "../libs/api/ambak";
import {
  getIvyListings,
  getIvyMappings,
  IvyMappingsResponse,
  runIvyMatching,
  updateIvyMapping,
} from "../libs/api/ivy-homes";
import { queryKeys } from "../libs/constants";

export function useIvyListings() {
  return useQuery({
    queryKey: [queryKeys.ivyListings],
    queryFn: getIvyListings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useIvyMappings() {
  return useQuery({
    queryKey: [queryKeys.ivyMappings],
    queryFn: getIvyMappings,
    staleTime: 5 * 60 * 1000,
  });
}

// keeps the run's outcomes (matched/error) in the table instead of refetching
export function useRunIvyMatching() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: runIvyMatching,
    onSuccess: (data) => queryClient.setQueryData([queryKeys.ivyMappings], data),
  });
}

export function useUpdateIvyMapping() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIvyMapping,
    onSuccess: ({ ivyProjectId, mappedProject }) =>
      queryClient.setQueryData<IvyMappingsResponse>([queryKeys.ivyMappings], (prev) => {
        if (!prev) return prev;
        const rows = prev.rows
          .filter((row) => !(row.ivyProject.id === ivyProjectId && row.outcome === "stale" && !mappedProject))
          .map((row) => {
            if (row.ivyProject.id !== ivyProjectId) return row;
            if (mappedProject) return { ...row, mappedProject, outcome: "mapped" as const, error: undefined };
            return {
              ...row,
              mappedProject: null,
              outcome: row.suggestion ? ("suggested" as const) : ("unmatched" as const),
              error: undefined,
            };
          });
        return { ...prev, rows };
      }),
  });
}

export function useAmbakMasterdata() {
  return useQuery({
    queryKey: [queryKeys.ambakMasterdata],
    queryFn: getAmbakMasterdata,
    staleTime: 24 * 60 * 60 * 1000, // Ambak asks partners to cache master data daily
  });
}

export function useAmbakOffers() {
  return useMutation({ mutationFn: getAmbakOffers });
}
