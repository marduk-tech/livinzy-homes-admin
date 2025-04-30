import {
  CreateReraProjectPayload,
  ReraProject,
  UpdateReraProjectPayload,
} from "../../types/rera-project";
import { axiosApiInstance } from "../axios-api-Instance";

export async function getAllReraProjects(): Promise<ReraProject[]> {
  const { data } = await axiosApiInstance.get<ReraProject[]>("/rera-projects");
  return data;
}

export async function getReraProjectById(
  projectId: string
): Promise<ReraProject> {
  const { data } = await axiosApiInstance.get<ReraProject>(
    `/rera-projects/${projectId}`
  );
  return data;
}

export async function createReraProject(
  projectData: CreateReraProjectPayload
): Promise<ReraProject> {
  const { data } = await axiosApiInstance.post<ReraProject>(
    "/rera-projects",
    projectData
  );
  return data;
}

export async function updateReraProject(
  projectId: string,
  projectData: UpdateReraProjectPayload
): Promise<ReraProject> {
  const { data } = await axiosApiInstance.put<ReraProject>(
    `/rera-projects/${projectId}`,
    projectData
  );
  return data;
}

export async function deleteReraProject(projectId: string): Promise<void> {
  await axiosApiInstance.delete(`/rera-projects/${projectId}`);
}
