import { IChromaDoc } from "../../types";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllChromaDocs = async (collectionName: string) => {
  const endpoint = `/ai/chroma-docs?collectionName=${collectionName}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data.data as IChromaDoc[];
  });
};
