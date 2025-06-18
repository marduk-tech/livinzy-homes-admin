import { Project } from "../../types/Project";
import { axiosApiInstance } from "../axios-api-Instance";

// Create a new project
export const createProject = async (projectData: Partial<Project>) => {
  const endpoint = `/projects`;
  return axiosApiInstance.post(endpoint, projectData).then((response) => {
    return response.data as Project;
  });
};

// Get all projects
export const getAllProjects = async ({ source = "admin", searchKeyword = "", issueSeverity = "" }) => {
  const endpoint = `/projects?source=${source}&keyword=${searchKeyword}&severity=${issueSeverity}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as Project[];
  });
};

// Get a project by ID
export const getProjectById = async (id: string) => {
  const endpoint = `/projects/${id}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as Project;
  });
};

// Update a project by ID
export const updateProject = async (
  id: string,
  projectData: Partial<Project>
) => {
  const endpoint = `/projects/${id}`;
  return axiosApiInstance.put(endpoint, projectData).then((response) => {
    return response.data as Project;
  });
};

// Delete a project by ID
export const deleteProject = async (id: string) => {
  const endpoint = `/projects/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data as Project;
  });
};

// Delete a project by ID
export const generateProjectUI = async (
  projectId: string,
  instructions: string
) => {
  const endpoint = `/ai/project/ui`;
  return axiosApiInstance
    .post(endpoint, { projectId, instructions })
    .then((response) => {
      return response.data as any;
    });
};

// Update a project by ID
export const resolveProjectIssue = async (
  id: string,
  issueField: any
) => {
  const endpoint = `/projects`;
  return axiosApiInstance.post(endpoint, {
    projectId: id, issueField
  }).then((response) => {
    return response.data as Project;
  });
};

