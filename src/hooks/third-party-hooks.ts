import { useMutation, useQuery } from "@tanstack/react-query";
import { getAmbakMasterdata, getAmbakOffers } from "../libs/api/ambak";
import { getIvyListings } from "../libs/api/ivy-homes";
import { queryKeys } from "../libs/constants";

export function useIvyListings() {
  return useQuery({
    queryKey: [queryKeys.ivyListings],
    queryFn: getIvyListings,
    staleTime: 5 * 60 * 1000,
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
