import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  assessBrickchatFeedback,
  BrickchatFeedbackAssessmentUpdate,
  getBrickchatConversation,
  getBrickchatFeedback,
  getBrickchatLog,
  getBrickchatPrompts,
  createPromptDraft,
  getLlmCallsForRun,
  getRecentBrickchatLogs,
  updateBrickchatFeedback,
  updateBrickchatFeedbackAssessment,
  generateRevision,
  getRevisionGroups,
  getRevisions,
  RevisionAction,
  runRevisionAction,
  updateRevision,
  getEvalCases,
  getEvalRun,
  getEvalRuns,
  startEvalRun,
  stopEvalRun,
  createEvalCase,
  updateEvalCase,
  deleteEvalCase,
  importEvalCases,
} from "../libs/api/brickchat";
import { EvalRunStatus } from "../types/brickchat-eval";
import { BrickchatRevisionStatus } from "../types/brickchat-revision";
import { errorMessage } from "../libs/api-error";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { BrickchatFeedback } from "../types/brickchat-feedback";

export function useGetBrickchatLog(threadId: string | null | undefined) {
  return useQuery({
    queryKey: [queryKeys.getBrickchatLog, threadId],
    queryFn: () => getBrickchatLog(threadId!),
    enabled: !!threadId,
    retry: false,
  });
}

// only fetched once the "See Conversation" modal is opened
export function useGetBrickchatConversation(
  threadId: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [queryKeys.getBrickchatConversation, threadId],
    queryFn: () => getBrickchatConversation(threadId!),
    enabled: !!threadId && enabled,
    retry: false,
  });
}

export function useGetRecentBrickchatLogs(limit = 10) {
  return useQuery({
    queryKey: [queryKeys.getRecentBrickchatLogs, limit],
    queryFn: () => getRecentBrickchatLogs(limit),
  });
}

export function useGetLlmCallsForRun(runId: string | null | undefined) {
  return useQuery({
    queryKey: [queryKeys.getLlmCallsForRun, runId],
    queryFn: () => getLlmCallsForRun(runId!),
    enabled: !!runId,
    retry: false,
    // a finished run's LLM calls never change
    staleTime: Infinity,
  });
}

export function useGetBrickchatFeedback() {
  return useQuery({
    queryKey: [queryKeys.getBrickchatFeedback],
    queryFn: () => getBrickchatFeedback(),
  });
}

export function useAssessBrickchatFeedbackMutation() {
  return useMutation({
    mutationFn: (id: string) => assessBrickchatFeedback(id),
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to assess feedback"),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getBrickchatFeedback],
      });
    },
  });
}

export function useUpdateBrickchatFeedbackAssessmentMutation() {
  return useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: BrickchatFeedbackAssessmentUpdate;
    }) => updateBrickchatFeedbackAssessment(id, update),
    // the server explains why a confirm was refused (e.g. missing blocks)
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to update assessment"),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getBrickchatFeedback],
      });
    },
  });
}

// A revision changes feedback statuses and (once active) what prompts serve,
// so every revision mutation refreshes all four lists
const invalidateRevisionQueries = () =>
  Promise.all(
    [
      queryKeys.getRevisionGroups,
      queryKeys.getRevisions,
      queryKeys.getBrickchatFeedback,
      queryKeys.getBrickchatPrompts,
    ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  );

export function useGetRevisionGroups() {
  return useQuery({
    queryKey: [queryKeys.getRevisionGroups],
    queryFn: () => getRevisionGroups(),
  });
}

export function useGetRevisions(status?: BrickchatRevisionStatus) {
  return useQuery({
    queryKey: [queryKeys.getRevisions, status],
    queryFn: () => getRevisions(status),
  });
}

export function useGenerateRevisionMutation() {
  return useMutation({
    mutationFn: ({
      feedbackIds,
      createdBy,
    }: {
      feedbackIds: string[];
      createdBy?: string;
    }) => generateRevision(feedbackIds, createdBy),
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to generate a revision"),
      });
    },
    onSettled: invalidateRevisionQueries,
  });
}

export function useUpdateRevisionMutation() {
  return useMutation({
    mutationFn: ({
      revisionId,
      update,
    }: {
      revisionId: string;
      update: { blocks?: { key: string; body: unknown }[]; rationale?: string };
    }) => updateRevision(revisionId, update),
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to update the revision"),
      });
    },
    onSettled: invalidateRevisionQueries,
  });
}

export function useRevisionActionMutation() {
  return useMutation({
    mutationFn: ({
      revisionId,
      action,
      reviewer,
    }: {
      revisionId: string;
      action: RevisionAction;
      reviewer: string;
    }) => runRevisionAction(revisionId, action, reviewer),
    // e.g. why an activation was refused (a block changed since drafting)
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to update the revision"),
      });
    },
    onSettled: invalidateRevisionQueries,
  });
}

export function useGetBrickchatPrompts() {
  return useQuery({
    queryKey: [queryKeys.getBrickchatPrompts],
    queryFn: () => getBrickchatPrompts(),
  });
}

export function useCreatePromptDraftMutation() {
  return useMutation({
    mutationFn: createPromptDraft,
    // e.g. a dropped {{placeholder}} or no change from the active version
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to save the draft"),
      });
    },
    onSettled: invalidateRevisionQueries,
  });
}

export function useUpdateBrickchatFeedbackMutation() {
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Pick<Partial<BrickchatFeedback>, "text" | "status" | "resolutionComment">;
    }) => updateBrickchatFeedback(id, updates),

    onSuccess: () => {
      notification.success({
        message: `Feedback updated successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getBrickchatFeedback],
      });
    },
  });
}

// active runs are polled for live results
const EVAL_POLL_MS = 4000;
export const isEvalRunActive = (status?: EvalRunStatus) =>
  status === "queued" || status === "running";

const invalidateEvalQueries = () =>
  Promise.all(
    [queryKeys.getEvalCases, queryKeys.getEvalRuns, queryKeys.getEvalRun].map(
      (key) => queryClient.invalidateQueries({ queryKey: [key] }),
    ),
  );

export function useGetEvalCases(poll = false) {
  return useQuery({
    queryKey: [queryKeys.getEvalCases],
    queryFn: () => getEvalCases(),
    refetchInterval: poll ? EVAL_POLL_MS : false,
  });
}

export function useGetEvalRuns() {
  return useQuery({
    queryKey: [queryKeys.getEvalRuns],
    queryFn: () => getEvalRuns(),
    refetchInterval: (query) =>
      query.state.data?.some((r) => isEvalRunActive(r.status))
        ? EVAL_POLL_MS
        : false,
  });
}

export function useGetEvalRun(runId: string | null | undefined) {
  return useQuery({
    queryKey: [queryKeys.getEvalRun, runId],
    queryFn: () => getEvalRun(runId!),
    enabled: !!runId,
    retry: false,
    refetchInterval: (query) =>
      isEvalRunActive(query.state.data?.status) ? EVAL_POLL_MS : false,
  });
}

export function useStartEvalRunMutation() {
  return useMutation({
    mutationFn: startEvalRun,
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to start the eval run"),
      });
    },
    onSettled: invalidateEvalQueries,
  });
}

export function useStopEvalRunMutation() {
  return useMutation({
    mutationFn: (runId: string) => stopEvalRun(runId),
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to stop the eval run"),
      });
    },
    onSettled: invalidateEvalQueries,
  });
}

const invalidateEvalCases = () =>
  queryClient.invalidateQueries({ queryKey: [queryKeys.getEvalCases] });

export function useSaveEvalCaseMutation() {
  return useMutation({
    mutationFn: ({
      evalCase,
      isNew,
    }: {
      evalCase: Parameters<typeof createEvalCase>[0];
      isNew: boolean;
    }) => (isNew ? createEvalCase(evalCase) : updateEvalCase(evalCase)),
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to save the case"),
      });
    },
    onSettled: invalidateEvalCases,
  });
}

export function useDeleteEvalCaseMutation() {
  return useMutation({
    mutationFn: (caseId: string) => deleteEvalCase(caseId),
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to delete the case"),
      });
    },
    onSettled: invalidateEvalCases,
  });
}

export function useImportEvalCasesMutation() {
  return useMutation({
    mutationFn: importEvalCases,
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to import cases"),
      });
    },
    onSettled: (data) => (data?.imported ? invalidateEvalCases() : undefined),
  });
}
