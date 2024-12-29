import { useQuery } from "@tanstack/react-query";
import { getAllChromaDocs } from "../libs/api/chroma-docs";
import { queryKeys } from "../libs/constants";

export function useFetchChromaDocs({
  collectionName,
}: {
  collectionName: string;
}) {
  return useQuery({
    queryKey: [queryKeys.getAllDrivers, collectionName],
    queryFn: () => getAllChromaDocs(collectionName),
  });
}
