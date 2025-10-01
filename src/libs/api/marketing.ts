import { IGhostPage, IGlossary } from "../../types";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllGlossary = async () => {
  const endpoint = `/marketing?type=glossary`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IGlossary[];
  });
};

export const createGlossary = async (glossaryData: Partial<IGlossary>) => {
  const endpoint = `/marketing`;
  return axiosApiInstance.post(endpoint, glossaryData).then((response) => {
    return response.data as IGlossary;
  });
};

export const updateGlossary = async (
  id: string,
  glossaryData: Partial<IGlossary>
) => {
  const endpoint = `/marketing/${id}`;
  return axiosApiInstance.put(endpoint, glossaryData).then((response) => {
    return response.data as IGlossary;
  });
};

export const deleteGlossary = async (id: string) => {
  const endpoint = `/marketing/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data;
  });
};

export const getGhostGlossaryPages = async (tag = 'glossary'): Promise<IGhostPage[]> => {
  const endpoint = `/marketing/ghost-pages?tag=${tag}`;

  try {
    const response = await axiosApiInstance.get(endpoint);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching Ghost pages:", error);
    return [];
  }
};
