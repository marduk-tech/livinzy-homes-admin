import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import { api } from "../libs/api";
import {
  getAllLvnzyProjects,
  getLvnzyProjectById,
  updateLvnzyProject,
} from "../libs/api/lvnzy-projects";
import { queryKeys } from "../libs/constants";
import { LvnzyProject } from "../types/lvnzy-project";

export function useGetAllLvnzyProjects() {
  return useQuery({
    queryKey: [queryKeys.lvnzyProjects],
    queryFn: () => getAllLvnzyProjects(),
    refetchOnMount: false,
    refetchOnWindowFocus: false
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

export const useUpdateLvnzyProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateLvnzyProject(id, payload),
    onSuccess: (data: LvnzyProject) => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getLvnzyProjectById, data._id],
      });
      notification.success({
        message: `Project updated successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.lvnzyProjects] });
    },
  });
};
