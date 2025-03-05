import { ICorridor } from "../../types/corridor";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllCorridors = async () => {
  const endpoint = `/corridors`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as ICorridor[];
  });
};

export const getCorridorById = async (id: string) => {
  const endpoint = `/corridors/${id}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as ICorridor;
  });
};

export const updateCorridor = async (
  id: string,
  corridorData: Partial<ICorridor>
) => {
  const endpoint = `/corridors/${id}`;
  return axiosApiInstance.put(endpoint, corridorData).then((response) => {
    return response.data as ICorridor;
  });
};

export const createCorridor = async (corridorData: Partial<ICorridor>) => {
  const endpoint = `/corridors`;
  return axiosApiInstance.post(endpoint, corridorData).then((response) => {
    return response.data as ICorridor;
  });
};

export const deleteCorridor = async (id: string) => {
  const endpoint = `/corridors/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data;
  });
};
