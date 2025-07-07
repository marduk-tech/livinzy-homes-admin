import { useQuery } from "@tanstack/react-query";
import { api } from "../libs/api";
import { getAllLvnzyProjects, getLvnzyProjectById } from "../libs/api/lvnzy-projects";
import { queryKeys } from "../libs/constants";
import { LvnzyProject } from "../types/lvnzy-project";

export function useGetAllLvnzyProjects() {
  return useQuery({
    queryKey: [queryKeys.lvnzyProjects],
    queryFn: () => getAllLvnzyProjects(),
  });
}


/**
 * Custom hook to fetch a single project by its ID
 * @param {string} id - The ID of the project to fetch
 * @returns {UseQueryResult<Project, Error>} The result of the useQuery hook containing a single project
 */
export const useFetchLvnzyProjectById = (id: string) => {
  return useQuery<LvnzyProject, Error>({
    queryKey: [queryKeys.getLvnzyProjectById, id],
    queryFn: async () => getLvnzyProjectById(id),
    refetchOnWindowFocus: false,
  });
};
