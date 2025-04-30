import {
  CreateDeveloperPayload,
  Developer,
  UpdateDeveloperPayload,
} from "../../types/developer";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllDevelopers = async (): Promise<Developer[]> => {
  const { data } = await axiosApiInstance.get<Developer[]>(
    "/real-estate-developer"
  );
  return data;
};

export const getDeveloperById = async (
  developerId: string
): Promise<Developer> => {
  const { data } = await axiosApiInstance.get<Developer>(
    `/real-estate-developer/${developerId}`
  );
  return data;
};

export const createDeveloper = async (
  payload: CreateDeveloperPayload
): Promise<Developer> => {
  const { data } = await axiosApiInstance.post<Developer>(
    "/real-estate-developer",
    payload
  );
  return data;
};

export const updateDeveloper = async (
  developerId: string,
  payload: UpdateDeveloperPayload
): Promise<Developer> => {
  const { data } = await axiosApiInstance.put<Developer>(
    `/real-estate-developer/${developerId}`,
    payload
  );
  return data;
};

export const deleteDeveloper = async (developerId: string): Promise<void> => {
  await axiosApiInstance.delete(`/real-estate-developer/${developerId}`);
};
