import { axiosApiInstance } from "../axios-api-Instance";

export interface ScriptInfo {
  scriptName: string;
  isRunning: boolean;
}

export const getScripts = async (): Promise<ScriptInfo[]> => {
  const { data } = await axiosApiInstance.get<ScriptInfo[]>("/scripts");
  return data;
};

export const runScript = async (
  scriptName: string,
): Promise<{ message: string }> => {
  const { data } = await axiosApiInstance.post<{ message: string }>(
    `/scripts/${scriptName}`,
  );
  return data;
};
