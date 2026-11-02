import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import { api } from "../libs/api";
import {
  addLvnzyProjectScoreComment,
  getAllLvnzyProjects,
  getLvnzyProjectById,
  updateLvnzyProject,
} from "../libs/api/lvnzy-projects";
import { queryKeys } from "../libs/constants";
import { LvnzyProject, NewScoreComment } from "../types/lvnzy-project";

export function useGetAllLvnzyProjects(onlyVerifiedReports?: boolean) {
  return useQuery({
    queryKey: [queryKeys.lvnzyProjects, onlyVerifiedReports],
    queryFn: () => getAllLvnzyProjects(onlyVerifiedReports),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    gcTime: 15 * 60 * 1000,
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

// Doesn't invalidate the project query - the brick360 page keeps unsaved
// score edits in local state seeded from it, so a refetch would wipe them.
// The caller merges the returned scoreComments into that state instead.
export const useAddLvnzyProjectScoreComment = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: NewScoreComment }) =>
      addLvnzyProjectScoreComment(id, payload),
    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `Couldn't save the comment. Please try again.`,
      });

      console.log(error);
    },
  });
};
