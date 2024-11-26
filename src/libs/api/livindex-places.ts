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
