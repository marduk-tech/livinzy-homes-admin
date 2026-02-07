import {
  AggregatedReportRow,
  CreateUserPayload,
  SavedLvnzyProject,
  UpdateUserPayload,
  User,
} from "../../types/user";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllUsers = async (params?: {
  limit?: number;
  sortBy?: string;
  search?: string;
  status?: string;
}): Promise<User[]> => {
  const { limit = 100, sortBy = 'createdAt:desc', search = '', status = '' } = params || {};
  const queryParams = new URLSearchParams();
  queryParams.append('limit', String(limit));
  queryParams.append('sortBy', sortBy);
  if (search) queryParams.append('search', search);
  if (status) queryParams.append('status', status);

  const { data } = await axiosApiInstance.get<User[]>(`/user/all?${queryParams}`);
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

export const sendReportEmail = async (
  userId: string,
  projectIds: string[]
): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosApiInstance.post(
    `/user/${userId}/send-report-email`,
    { projectIds }
  );
  return data;
};

export const getAggregatedReports = async (): Promise<AggregatedReportRow[]> => {
  const { data } = await axiosApiInstance.get<AggregatedReportRow[]>('/user/aggregated-reports');
  return data;
};

export const addLeadTrailComment = async (
  userId: string,
  comment: string
): Promise<User> => {
  const { data } = await axiosApiInstance.post<User>(
    `/user/${userId}/lead-trail`,
    { comment }
  );
  return data;
};
