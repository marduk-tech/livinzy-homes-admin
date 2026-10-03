import { BrickchatLog, BrickchatRecentThread } from "../../types/brickchat-logger";
import { axiosApiInstance } from "../axios-api-Instance";

export const getBrickchatLog = async (
  threadId: string,
): Promise<BrickchatLog> => {
  const { data } = await axiosApiInstance.get<BrickchatLog>(
    `/brickchat-logger/${threadId}`,
  );
  return data;
};

export const getRecentBrickchatLogs = async (
  limit = 10,
): Promise<BrickchatRecentThread[]> => {
  const { data } = await axiosApiInstance.get<BrickchatRecentThread[]>(
    `/brickchat-logger/recent`,
    { params: { limit } },
  );
  return data;
};
