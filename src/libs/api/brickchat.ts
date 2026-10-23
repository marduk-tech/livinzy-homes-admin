import {
  BrickchatConversation,
  BrickchatLog,
  BrickchatRecentThread,
  LlmCallsForRun,
} from "../../types/brickchat-logger";
import {
  BrickchatFeedback,
  BrickchatFeedbackAssessment,
} from "../../types/brickchat-feedback";
import { BrickchatPrompt } from "../../types/brickchat-prompt";
import {
  BrickchatRevision,
  BrickchatRevisionGroup,
  BrickchatRevisionStatus,
} from "../../types/brickchat-revision";
import {
  EvalCaseInput,
  EvalCasesResponse,
  EvalImportPreview,
  EvalRun,
  EvalRunListItem,
} from "../../types/brickchat-eval";
import { axiosApiInstance } from "../axios-api-Instance";

export const getBrickchatLog = async (
  threadId: string,
): Promise<BrickchatLog> => {
  const { data } = await axiosApiInstance.get<BrickchatLog>(
    `/brickchat-logger/${threadId}`,
  );
  return data;
};

export const getBrickchatConversation = async (
  threadId: string,
): Promise<BrickchatConversation> => {
  const { data } = await axiosApiInstance.get<BrickchatConversation>(
    `/brickchat-logger/${threadId}/conversation`,
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

export const getLlmCallsForRun = async (
  runId: string,
): Promise<LlmCallsForRun> => {
  const { data } = await axiosApiInstance.get<LlmCallsForRun>(
    `/traces/runs/${runId}/llm-calls`,
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

// Drafts the feedback's assessment with an LLM - replaces any earlier
// draft and clears its confirmation
export const assessBrickchatFeedback = async (
  id: string,
): Promise<BrickchatFeedback> => {
  const { data } = await axiosApiInstance.post<BrickchatFeedback>(
    `/brickchat-feedback/${id}/assess`,
  );
  return data;
};

// A reviewer's edits to the assessment (null clears a field), and/or
// confirming it (confirm: true, with reviewer) or withdrawing that (false)
export type BrickchatFeedbackAssessmentUpdate = {
  rootCause?: BrickchatFeedbackAssessment["rootCause"];
  blocks?: string[];
  expected?: string | null;
  checks?: Record<string, unknown> | null;
  question?: string | null;
  confirm?: boolean;
  reviewer?: string;
};

export const updateBrickchatFeedbackAssessment = async (
  id: string,
  update: BrickchatFeedbackAssessmentUpdate,
): Promise<BrickchatFeedback> => {
  const { data } = await axiosApiInstance.patch<BrickchatFeedback>(
    `/brickchat-feedback/${id}/assessment`,
    update,
  );
  return data;
};

// --- prompt revisions from feedback (all under /brickchat-feedback) ---

export const getRevisionGroups = async (): Promise<BrickchatRevisionGroup[]> => {
  const { data } = await axiosApiInstance.get<BrickchatRevisionGroup[]>(
    `/brickchat-feedback/revision-groups`,
  );
  return data;
};

// Drafts a revision with an LLM from the given open cases
export const generateRevision = async (
  feedbackIds: string[],
  createdBy?: string,
): Promise<BrickchatRevision> => {
  const { data } = await axiosApiInstance.post<BrickchatRevision>(
    `/brickchat-feedback/revision-groups/generate`,
    { feedbackIds, createdBy },
  );
  return data;
};

export const getRevisions = async (
  status?: BrickchatRevisionStatus,
): Promise<BrickchatRevision[]> => {
  const { data } = await axiosApiInstance.get<BrickchatRevision[]>(
    `/brickchat-feedback/revisions`,
    { params: status ? { status } : {} },
  );
  return data;
};

// A reviewer's edits to a draft: new bodies for any of its blocks and/or a
// new rationale
export const updateRevision = async (
  revisionId: string,
  update: { blocks?: { key: string; body: unknown }[]; rationale?: string },
): Promise<BrickchatRevision> => {
  const { data } = await axiosApiInstance.patch<BrickchatRevision>(
    `/brickchat-feedback/revisions/${revisionId}`,
    update,
  );
  return data;
};

export type RevisionAction = "activate" | "reject" | "rollback";

export const runRevisionAction = async (
  revisionId: string,
  action: RevisionAction,
  reviewer: string,
): Promise<BrickchatRevision> => {
  const { data } = await axiosApiInstance.post<BrickchatRevision>(
    `/brickchat-feedback/revisions/${revisionId}/${action}`,
    { reviewer },
  );
  return data;
};

export const getBrickchatPrompts = async (): Promise<BrickchatPrompt[]> => {
  const { data } = await axiosApiInstance.get<BrickchatPrompt[]>(
    `/brickchat-prompts`,
  );
  return data;
};

export const getEvalCases = async (): Promise<EvalCasesResponse> => {
  const { data } = await axiosApiInstance.get<EvalCasesResponse>(
    `/brickchat-evals/cases`,
  );
  return data;
};

export const getEvalRuns = async (): Promise<EvalRunListItem[]> => {
  const { data } = await axiosApiInstance.get<EvalRunListItem[]>(
    `/brickchat-evals/runs`,
  );
  return data;
};

export const getEvalRun = async (runId: string): Promise<EvalRun> => {
  const { data } = await axiosApiInstance.get<EvalRun>(
    `/brickchat-evals/runs/${runId}`,
  );
  return data;
};

export const startEvalRun = async (payload: {
  intent?: string;
  caseIds?: string[];
  triggeredBy?: string;
}): Promise<EvalRun> => {
  const { data } = await axiosApiInstance.post<EvalRun>(
    `/brickchat-evals/runs`,
    payload,
  );
  return data;
};

export const stopEvalRun = async (runId: string): Promise<{ ok: boolean }> => {
  const { data } = await axiosApiInstance.post<{ ok: boolean }>(
    `/brickchat-evals/runs/${runId}/stop`,
  );
  return data;
};

export const createEvalCase = async (
  evalCase: EvalCaseInput & { updatedBy?: string },
): Promise<EvalCaseInput> => {
  const { data } = await axiosApiInstance.post<EvalCaseInput>(
    `/brickchat-evals/cases`,
    evalCase,
  );
  return data;
};

export const updateEvalCase = async (
  evalCase: EvalCaseInput & { updatedBy?: string },
): Promise<EvalCaseInput> => {
  const { data } = await axiosApiInstance.put<EvalCaseInput>(
    `/brickchat-evals/cases/${encodeURIComponent(evalCase.id)}`,
    evalCase,
  );
  return data;
};

export const deleteEvalCase = async (caseId: string): Promise<{ ok: boolean }> => {
  const { data } = await axiosApiInstance.delete<{ ok: boolean }>(
    `/brickchat-evals/cases/${encodeURIComponent(caseId)}`,
  );
  return data;
};

// dryRun only previews - nothing is written
export const importEvalCases = async (payload: {
  cases: unknown[];
  dryRun: boolean;
  updatedBy?: string;
}): Promise<EvalImportPreview> => {
  const { data } = await axiosApiInstance.post<EvalImportPreview>(
    `/brickchat-evals/cases/import`,
    payload,
  );
  return data;
};

export const exportEvalCases = async (): Promise<EvalCaseInput[]> => {
  const { data } = await axiosApiInstance.get<EvalCaseInput[]>(
    `/brickchat-evals/cases/export`,
  );
  return data;
};
