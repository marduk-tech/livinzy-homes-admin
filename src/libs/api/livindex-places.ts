import { ILivIndexPlaces } from "../../types";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllLivIndexPlaces = async ({
  type,
}: {
  type?: "road" | "hospital" | "school" | "futureInfra";
}) => {
  const endpoint = `/livindex-places${type ? `?type=${type}` : ""}`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as ILivIndexPlaces[];
  });
};

export const updateLivIndexPlace = async (
  id: string,
  placeData: Partial<ILivIndexPlaces>
) => {
  const endpoint = `/livindex-places/${id}`;
  return axiosApiInstance.put(endpoint, placeData).then((response) => {
    return response.data as ILivIndexPlaces;
  });
};

export const createPlace = async (placeData: Partial<ILivIndexPlaces>) => {
  const endpoint = `/livindex-places`;
  return axiosApiInstance.post(endpoint, placeData).then((response) => {
    return response.data as ILivIndexPlaces;
  });
};

export const deletePlace = async (id: string) => {
  const endpoint = `/livindex-places/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data as ILivIndexPlaces;
  });
};
