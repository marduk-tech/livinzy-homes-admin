import {
  CreateDeveloperPayload,
  Developer,
  UpdateDeveloperPayload,
} from "../../types/developer";
import { axiosApiInstance } from "../axios-api-Instance";
import { scriptServerApiInstance } from "../script-server-axios-instance";
import { JobStatus } from "./manage-scripts";

export interface GenerateDeveloperInfoResponse {
  jobId: string;
  developerId: string;
  force?: boolean;
  status: JobStatus;
}

export const getAllDevelopers = async (params?: {
  keyword?: string;
}): Promise<Developer[]> => {
  const { data } = await axiosApiInstance.get<Developer[]>(
    "/real-estate-developer",
    {
      params: {
        ...params,
        // limit for admin to get recent 10 developers
        limit: 10,
      },
    }
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

export const generateDeveloperInfo = async (
  developerId: string,
  force = false
): Promise<GenerateDeveloperInfoResponse> => {
  const { data } =
    await scriptServerApiInstance.post<GenerateDeveloperInfoResponse>(
      "/developer-gen",
      { developerId, force }
    );
  return data;
};

export const RERA_REFETCH_OPTIONS = [
  { value: "project-details", label: "Project details" },
  { value: "documents", label: "Documents" },
  { value: "land-details", label: "Land details" },
  { value: "complaints", label: "Complaints" },
  { value: "promoter-details", label: "Promoter details" },
];

export interface ExtractDeveloperReraProjectsParams {
  developerId?: string;
  reraNumbers?: string;
  refetch?: string[];
}

export interface ExtractDeveloperReraProjectsResponse {
  jobId: string;
  developerId?: string;
  reraNumbers?: string;
  refetch?: string[];
  dryRun?: boolean;
  status: JobStatus;
}

export const extractDeveloperReraProjects = async (
  params: ExtractDeveloperReraProjectsParams
): Promise<ExtractDeveloperReraProjectsResponse> => {
  const { data } =
    await scriptServerApiInstance.post<ExtractDeveloperReraProjectsResponse>(
      "/developer-rera-projects",
      params
    );
  return data;
};
