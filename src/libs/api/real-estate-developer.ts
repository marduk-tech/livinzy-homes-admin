import { RealEstateDeveloper } from "../../types/real-estate-developer";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllDevelopers = async () => {
  const response = await axiosApiInstance.get("/real-estate-developer");
  return response.data;
};

export const getDeveloperById = async (id: string) => {
  const response = await axiosApiInstance.get(`/real-estate-developer/${id}`);
  return response.data;
};

export const createDeveloper = async (data: Partial<RealEstateDeveloper>) => {
  const response = await axiosApiInstance.post("/real-estate-developer", data);
  return response.data;
};

export const updateDeveloper = async (
  id: string,
  data: Partial<RealEstateDeveloper>
) => {
  const response = await axiosApiInstance.put(
    `/real-estate-developer/${id}`,
    data
  );
  return response.data;
};

export const deleteDeveloper = async (id: string) => {
  const response = await axiosApiInstance.delete(
    `/real-estate-developer/${id}`
  );
  return response.data;
};

export const getDeveloperNames = async (): Promise<
  { _id: string; name: string }[]
> => {
  const response = await axiosApiInstance.get("/real-estate-developer/names");
  return response.data;
};

export const addProjectsToDeveloper = async (
  developerId: string,
  projects: { id: string; name: string; reraNumber: string }[]
): Promise<{ message: string; added: number }> => {
  const response = await axiosApiInstance.post(
    `/real-estate-developer/${developerId}/add-projects`,
    { projects }
  );
  return response.data;
};
