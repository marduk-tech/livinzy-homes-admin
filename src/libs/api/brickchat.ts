import { BrickchatLog, BrickchatRecentThread } from "../../types/brickchat-logger";
import { BrickchatFeedback } from "../../types/brickchat-feedback";
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

export const getBrickchatFeedback = async (): Promise<BrickchatFeedback[]> => {
  const { data } = await axiosApiInstance.get<BrickchatFeedback[]>(
    `/brickchat-feedback`,
  );
  return data;
};

export const updateBrickchatFeedback = async (
  id: string,
  updates: Pick<Partial<BrickchatFeedback>, "text" | "status" | "resolutionComment">,
): Promise<BrickchatFeedback> => {
  const { data } = await axiosApiInstance.patch<BrickchatFeedback>(
    `/brickchat-feedback/${id}`,
    updates,
  );
  return data;
};
