import { Trace } from "../../types/trace";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllTraces = async (): Promise<Trace[]> => {
  const { data } = await axiosApiInstance.get<Trace[]>("/traces");
  return data;
};
