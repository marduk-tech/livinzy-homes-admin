import { axiosApiInstance } from "../axios-api-Instance";

export const getAllLvnzyProjects = async () => {
  const endpoint = `/lvnzy-projects`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data;
  });
};

export const getLvnzyProjectById = async (id: string) => {
  const endpoint = `/lvnzy-projects/${id}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data;
  });
};

export const updateLvnzyProject = async (id: string, payload: any) => {
  const endpoint = `/lvnzy-projects/${id}`;
  return axiosApiInstance.put(endpoint, payload).then((response) => {
    return response.data;
  });
};
