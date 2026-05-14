import { useMutation } from "@tanstack/react-query";
import { axiosApiInstance } from "../libs/axios-api-Instance";

interface AiQueryPayload {
  query: string;
  context: string;
  llm?: string;
}

async function postAiQuery(payload: AiQueryPayload): Promise<string> {
  const response = await axiosApiInstance.post("/ai/query", payload);
  return response.data.data;
}

export function useAiQuery() {
  return useMutation({
    mutationFn: postAiQuery,
  });
}
