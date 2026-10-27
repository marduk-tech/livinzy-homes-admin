import { Project } from "../../types/Project";
import { axiosApiInstance } from "../axios-api-Instance";
import { apiKey, baseApiUrl } from "../constants";

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
  hasStatusComments,
  developerPartner,
  projectIds,
  view,
}: {
  source?: string;
  // "list": only the fields the projects table shows (admin source only)
  view?: "list";
  searchKeyword?: string;
  issueSeverity?: string;
  statusFilter?: string;
  issueType?: string;
  limit?: number;
  sortBy?: string;
  hasStatusComments?: boolean;
  developerPartner?: boolean;
  projectIds?: string[];
}) => {
  let endpoint = `/projects?source=${source}&keyword=${searchKeyword}&severity=${issueSeverity}&statusFilter=${statusFilter}&issueType=${issueType}&hasStatusComments=${hasStatusComments || false}&developerPartner=${developerPartner || false}`;

  if (limit) {
    endpoint += `&limit=${limit}`;
  }

  if (sortBy) {
    endpoint += `&sortBy=${sortBy}`;
  }

  if (projectIds?.length) {
    endpoint += `&projectIds=${projectIds.join(",")}`;
  }

  if (view) {
    endpoint += `&view=${view}`;
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

// Pre-processes project data (drivers, developer history, investment comps
// etc) on its own - generateScore below already does this first.
export const processProjectData = async (projectId: string) => {
  const endpoint = `/projects/process-data`;
  return axiosApiInstance.post(endpoint, { projectId }).then((response) => {
    return response.data;
  });
};

// The score card's parts that can be generated on their own - the four
// pillars, then the summary (pros/cons) written from them. Mirrors
// SCORE_PARTS in the services' score-card-v3.js.
export const SCORE_CARD_PARTS = [
  { value: "property", label: "Property" },
  { value: "developer", label: "Developer" },
  { value: "areaConnectivity", label: "Area & Connectivity" },
  { value: "financials", label: "Financials" },
  { value: "summary", label: "Summary (pros & cons)" },
] as const;

// Generates the score card - always re-processes the project's data first,
// then scores it. With `pillars`, only those parts are generated, and
// regenerated even if already scored; without, every part not yet scored.
export const generateScore = async (projectId: string, pillars?: string[]) => {
  const endpoint = `/projects/generate-score`;
  return axiosApiInstance
    .post(endpoint, { projectId, ...(pillars?.length ? { pillars } : {}) })
    .then((response) => {
      return response.data;
    });
};

export type ScoreCardStage =
  | "data-processing"
  | "report-processing"
  | "report-processed";

// One progress update of a streamed generateScoresStreamed run - passed /
// failed are project counts so far (see runScoreCardBatch in the services'
// project.controller.js for what each stage counts).
export interface ScoreCardProgress {
  stage: ScoreCardStage;
  total: number;
  passed: number;
  failed: number;
  attempt?: number;
}

export interface ScoreCardBatchResult {
  status: number;
  success: boolean;
  message: string;
  results: { projectId: string; success: boolean; error?: string }[];
}

// Generates score cards for several projects in one request (same endpoint
// as generateScore), with progress streamed back as newline-delimited JSON
// so `onProgress` is called as each stage moves along. Uses fetch rather than
// axios, since axios can't read a response body while it's still arriving
// in the browser. Resolves to the final result line; rejects if the request
// fails before streaming or the run errors out.
export const generateScoresStreamed = async (
  projectIds: string[],
  onProgress: (progress: ScoreCardProgress) => void,
  pillars?: string[],
): Promise<ScoreCardBatchResult> => {
  const response = await fetch(
    `${(baseApiUrl || "").replace(/\/$/, "")}/projects/generate-score`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey || "",
      },
      body: JSON.stringify({
        projectIds,
        stream: true,
        ...(pillars?.length ? { pillars } : {}),
      }),
    },
  );
  // validation errors (404/400) come back as plain JSON before any streaming
  if (!response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  if (!response.body) throw new Error("Streaming isn't supported here");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  let result: ScoreCardBatchResult | undefined;
  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const message = JSON.parse(line);
    if (message.type === "progress") onProgress(message);
    else if (message.type === "result") result = message;
    else if (message.type === "error") throw new Error(message.message);
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffered += decoder.decode(value, { stream: true });
    // a chunk can end mid-line - keep the incomplete tail for the next one
    const lines = buffered.split("\n");
    buffered = lines.pop() || "";
    lines.forEach(handleLine);
  }
  handleLine(buffered);
  if (!result) throw new Error("The report request ended without a result");
  return result;
};

export const runProjectChecksForProject = async (projectId: string) => {
  const endpoint = `/projects/run-checks`;
  return axiosApiInstance.post(endpoint, { projectId }).then((response) => {
    return response.data;
  });
};

