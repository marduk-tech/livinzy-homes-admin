import { NewScoreComment, ScoreComment } from "../../types/lvnzy-project";
import { axiosApiInstance } from "../axios-api-Instance";

// includeProjectsWithoutLvnzy also returns report-ready projects with no
// LvnzyProject yet - their _id is the Project's, see LvnzyProject's
// lvnzyProjectMissing
export const getAllLvnzyProjects = async (
  onlyVerifiedReports?: boolean,
  includeProjectsWithoutLvnzy?: boolean,
) => {
  const endpoint = `/lvnzy-projects`;
  return axiosApiInstance
    .get(endpoint, {
      params: onlyVerifiedReports
        ? { onlyVerifiedReports: "true", basic: "true" }
        : {
            includeReportIssues: "true",
            ...(includeProjectsWithoutLvnzy
              ? { includeProjectsWithoutLvnzy: "true" }
              : {}),
          },
    })
    .then((response) => {
      return response.data;
    });
};

export const getLvnzyProjectById = async (id: string) => {
  const endpoint = `/lvnzy-projects/${id}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data;
  });
};

export const addLvnzyProjectScoreComment = async (
  id: string,
  payload: NewScoreComment,
): Promise<ScoreComment[]> => {
  const endpoint = `/lvnzy-projects/${id}/score-comments`;
  return axiosApiInstance.post(endpoint, payload).then((response) => {
    return response.data;
  });
};

export const updateLvnzyProject = async (id: string, payload: any) => {
  const endpoint = `/lvnzy-projects/${id}`;
  return axiosApiInstance.put(endpoint, payload).then((response) => {
    return response.data;
  });
};
