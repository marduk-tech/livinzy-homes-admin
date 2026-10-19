import { useQuery } from "@tanstack/react-query";
import { getIvyListings } from "../libs/api/ivy-homes";
import { queryKeys } from "../libs/constants";

export function useIvyListings() {
  return useQuery({
    queryKey: [queryKeys.ivyListings],
    queryFn: getIvyListings,
    staleTime: 5 * 60 * 1000,
  });
}
