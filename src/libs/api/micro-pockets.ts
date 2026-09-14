import { IMicroPocket } from "../../types/micro-pocket";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllMicroPockets = async () => {
  const endpoint = `/micro-pockets`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IMicroPocket[];
  });
};

export const getMicroPocketById = async (id: string) => {
  const endpoint = `/micro-pockets/${id}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IMicroPocket;
  });
};

export const updateMicroPocket = async (
  id: string,
  microPocketData: Partial<IMicroPocket>
) => {
  const endpoint = `/micro-pockets/${id}`;
  return axiosApiInstance
    .put(endpoint, microPocketData)
    .then((response) => {
      return response.data as IMicroPocket;
    });
};

export const createMicroPocket = async (
  microPocketData: Partial<IMicroPocket>
) => {
  const endpoint = `/micro-pockets`;
  return axiosApiInstance
    .post(endpoint, microPocketData)
    .then((response) => {
      return response.data as IMicroPocket;
    });
};

export const deleteMicroPocket = async (id: string) => {
  const endpoint = `/micro-pockets/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data;
  });
};
