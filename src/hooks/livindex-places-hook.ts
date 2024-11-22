import { useQuery } from "@tanstack/react-query";
import { getAllLivIndexPlaces } from "../libs/api/livindex-places";
import { queryKeys } from "../libs/constants";

export function useFetchLivindexPlaces({
  type,
}: {
  type?: "road" | "hospital" | "school" | "futureInfra";
}) {
  return useQuery({
    queryKey: [queryKeys.getAllPlaces, type],
    queryFn: () => getAllLivIndexPlaces({ type }),
  });
}
