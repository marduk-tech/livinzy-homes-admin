import {
  CreateUserPayload,
  SavedLvnzyProject,
  UpdateUserPayload,
  User,
} from "../../types/user";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllUsers = async (): Promise<User[]> => {
  const { data } = await axiosApiInstance.get<User[]>("/user/all");
  return data;
};

export const createUser = async (payload: CreateUserPayload): Promise<User> => {
  const { data } = await axiosApiInstance.post<User>("/user", payload);
  return data;
};

export const updateUser = async (
  userId: string,
  payload: UpdateUserPayload
): Promise<User> => {
  const { data } = await axiosApiInstance.post<User>(
    `/user/${userId}`,
    payload
  );
  return data;
};
