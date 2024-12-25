import { ILivIndexDriver } from "../../types";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllLivIndexDrivers = async () => {
  const endpoint = `/livindex-drivers`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as ILivIndexDriver[];
  });
};

export const updateLivIndexDriver = async (
  id: string,
  driverData: Partial<ILivIndexDriver>
) => {
  const endpoint = `/livindex-drivers/${id}`;
  return axiosApiInstance.put(endpoint, driverData).then((response) => {
    return response.data as ILivIndexDriver;
  });
};

export const createLivIndexDriver = async (
  driverData: Partial<ILivIndexDriver>
) => {
  const endpoint = `/livindex-drivers`;
  return axiosApiInstance.post(endpoint, driverData).then((response) => {
    return response.data as ILivIndexDriver;
  });
};

export const deleteLivIndexDriver = async (id: string) => {
  const endpoint = `/livindex-drivers/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data as ILivIndexDriver;
  });
};
