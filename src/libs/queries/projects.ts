import { queryOptions } from "@tanstack/react-query";
import { api } from "../api";
import { queryKeys } from "../constants";

export const getAllProjects = () =>
  queryOptions({
    queryKey: [queryKeys.projects],
    queryFn: () => api.getAllProjects({ source: "admin" }),
  });

export const getProjectById = (projectId: string) =>
  queryOptions({
    queryKey: [queryKeys.getProjectById, projectId],
    queryFn: () => api.getProjectById(projectId),
  });
