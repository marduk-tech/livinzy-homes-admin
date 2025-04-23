import { useQuery } from "@tanstack/react-query";
import { api } from "../libs/api";
import { getAllLvnzyProjects } from "../libs/api/lvnzy-projects";
import { queryKeys } from "../libs/constants";

export function useGetAllLvnzyProjects() {
  return useQuery({
    queryKey: [queryKeys.projects],
    queryFn: () => getAllLvnzyProjects(),
  });
}
