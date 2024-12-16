import { IGlobalKnowledge } from "../../types";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllGlobalKnowledge = async () => {
  const endpoint = `/global-knowledge`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IGlobalKnowledge[];
  });
};

export const createGlobalKnowledge = async (
  globalKnowledgeData: Partial<IGlobalKnowledge>
) => {
  const endpoint = `/global-knowledge`;
  return axiosApiInstance
    .post(endpoint, globalKnowledgeData)
    .then((response) => {
      return response.data as IGlobalKnowledge;
    });
};

export const generateGlobalEmbeddings = async () => {
  const endpoint = `/ai/generate-global-embeddings`;
  return axiosApiInstance.post(endpoint).then((response) => {
    return response.data as any;
  });
};