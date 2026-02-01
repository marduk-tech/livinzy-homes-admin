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
export const getAllProjects = async ({
  source = "admin",
  searchKeyword = "",
  issueSeverity = "",
  statusFilter = "",
  issueType = "",
  limit,
  sortBy,
  hasStatusComments
}: {
  source?: string;
  searchKeyword?: string;
  issueSeverity?: string;
  statusFilter?: string;
  issueType?: string;
  limit?: number;
  sortBy?: string;
  hasStatusComments?: boolean;
}) => {
  let endpoint = `/projects?source=${source}&keyword=${searchKeyword}&severity=${issueSeverity}&statusFilter=${statusFilter}&issueType=${issueType}&hasStatusComments=${hasStatusComments || false}`;

  if (limit) {
    endpoint += `&limit=${limit}`;
  }

  if (sortBy) {
    endpoint += `&sortBy=${sortBy}`;
  }

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
  projectId: string,
  issueField: any,
  resolvedBy: string,
  resolutionComments: string
) => {
  const endpoint = `/projects/resolve-issue`;
  return axiosApiInstance.post(endpoint, {
    projectId, issueField, resolvedBy, resolutionComments
  }).then((response) => {
    return response.data as Project;
  });
};

export const addStatusComment = async (
  projectId: string,
  commentText: string
) => {
  const endpoint = `/projects/status-comment/add`;
  return axiosApiInstance.post(endpoint, {
    projectId,
    commentText,
  }).then((response) => {
    return response.data;
  });
};

export const editStatusComment = async (
  projectId: string,
  commentIndex: number,
  commentText: string
) => {
  const endpoint = `/projects/status-comment/edit`;
  return axiosApiInstance.post(endpoint, {
    projectId,
    commentIndex,
    commentText,
  }).then((response) => {
    return response.data;
  });
};

export const toggleStatusCommentResolved = async (
  projectId: string,
  commentIndex: number,
  resolved: boolean
) => {
  const endpoint = `/projects/status-comment/toggle-resolved`;
  return axiosApiInstance.post(endpoint, {
    projectId,
    commentIndex,
    resolved,
  }).then((response) => {
    return response.data;
  });
};

export const deleteStatusComment = async (
  projectId: string,
  commentIndex: number
) => {
  const endpoint = `/projects/status-comment/delete`;
  return axiosApiInstance.post(endpoint, {
    projectId,
    commentIndex,
  }).then((response) => {
    return response.data;
  });
};

export const getProjectStatusCounts = async () => {
  const endpoint = `/projects/status-counts`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as {
      total: number;
      statusCounts: {
        [key: string]: number;
      };
    };
  });
};

export const generateScoreCard = async (projectId: string) => {
  const endpoint = `/projects/generate-scorecard`;
  return axiosApiInstance.post(endpoint, { projectId }).then((response) => {
    return response.data;
  });
};

