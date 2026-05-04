import { ConversationThread } from "../../types/conversation";
import { Trace } from "../../types/trace";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllTraces = async (): Promise<Trace[]> => {
  const { data } = await axiosApiInstance.get<Trace[]>("/traces");
  return data;
};

export const getUserConversations = async (
  userId: string,
): Promise<ConversationThread[]> => {
  const { data } = await axiosApiInstance.get<ConversationThread[]>(
    `/traces/user/${userId}/conversations`,
  );
  return data;
};
