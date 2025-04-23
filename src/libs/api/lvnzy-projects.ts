import { axiosApiInstance } from "../axios-api-Instance";

export const getAllLvnzyProjects = async () => {
  const endpoint = `/lvnzy-projects`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data;
  });
};
