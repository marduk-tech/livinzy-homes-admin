import { useAuth0 } from "@auth0/auth0-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import {
  addSeoIdea,
  addSeoTaskLesson,
  createSeoHealthTask,
  createSeoPlaybookEntry,
  createSeoTaskFromTopic,
  deleteSeoPlaybookEntry,
  getSeoHealth,
  getSeoPages,
  getSeoPlaybook,
  getSeoQuestions,
  getSeoSettings,
  getSeoSummary,
  getSeoTasks,
  publishSeoTask,
  rollbackSeoTask,
  runSeoJob,
  setSeoPageIgnored,
  SeoTaskUpdate,
  updateSeoPlaybookEntry,
  updateSeoQuestionTopic,
  updateSeoSettings,
  updateSeoTask,
} from "../libs/api/seo";
import { queryClient } from "../libs/query-client";
import { SeoTaskGroup } from "../types/seo";

// Every SEO query key starts with "seo" - any change refreshes the whole
// view (task counts in the header, lists, health...).
const SEO_KEY = "seo";
const refreshAll = () => queryClient.invalidateQueries({ queryKey: [SEO_KEY] });

const onError = (error: AxiosError<any>) =>
  notification.error({
    message: error.response?.data?.message || error.message || "Something went wrong",
  });

const useActor = () => {
  const { user } = useAuth0();
  return user?.email || user?.name || undefined;
};

export const useSeoSummary = () =>
  useQuery({
    queryKey: [SEO_KEY, "summary"],
    queryFn: getSeoSummary,
    // jobs started from the view report their status here
    refetchInterval: 30000,
  });

export const useSeoTasks = (group: SeoTaskGroup) =>
  useQuery({
    queryKey: [SEO_KEY, "tasks", group],
    queryFn: () => getSeoTasks(group),
    // drafting / QA progress shows without a reload
    refetchInterval: group === "in_progress" ? 15000 : false,
  });

export const useSeoHealth = () =>
  useQuery({ queryKey: [SEO_KEY, "health"], queryFn: getSeoHealth });

export const useSeoQuestions = () =>
  useQuery({ queryKey: [SEO_KEY, "questions"], queryFn: getSeoQuestions });

export const useSeoPages = (params: Parameters<typeof getSeoPages>[0]) =>
  useQuery({
    queryKey: [SEO_KEY, "pages", params],
    queryFn: () => getSeoPages(params),
  });

export const useSeoPlaybook = () =>
  useQuery({ queryKey: [SEO_KEY, "playbook"], queryFn: getSeoPlaybook });

export const useSeoSettings = () =>
  useQuery({ queryKey: [SEO_KEY, "settings"], queryFn: getSeoSettings });

export function useUpdateSeoTask() {
  const actor = useActor();
  return useMutation({
    mutationFn: ({ id, ...body }: SeoTaskUpdate & { id: string }) =>
      updateSeoTask(id, body, actor),
    onError,
    onSettled: refreshAll,
  });
}

export function usePublishSeoTask() {
  const actor = useActor();
  return useMutation({
    mutationFn: (id: string) => publishSeoTask(id, actor),
    onSuccess: () => notification.success({ message: "Published" }),
    onError,
    onSettled: refreshAll,
  });
}

export function useRollbackSeoTask() {
  const actor = useActor();
  return useMutation({
    mutationFn: (id: string) => rollbackSeoTask(id, actor),
    onSuccess: () => notification.success({ message: "Rolled back" }),
    onError,
    onSettled: refreshAll,
  });
}

export function useAddSeoTaskLesson() {
  const actor = useActor();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      addSeoTaskLesson(id, text, actor),
    onSuccess: () => notification.success({ message: "Added to the playbook" }),
    onError,
    onSettled: refreshAll,
  });
}

export function useAddSeoIdea() {
  const actor = useActor();
  return useMutation({
    mutationFn: (idea: { title: string; notes?: string; url?: string }) =>
      addSeoIdea(idea, actor),
    onSuccess: (task) =>
      notification.success({
        message: "Idea added to the Inbox",
        description: task.title,
      }),
    onError,
    onSettled: refreshAll,
  });
}

export function useCreateSeoHealthTask() {
  const actor = useActor();
  return useMutation({
    mutationFn: (cause: string) => createSeoHealthTask(cause, actor),
    onSuccess: () => notification.success({ message: "Fix task added to the Inbox" }),
    onError,
    onSettled: refreshAll,
  });
}

export function useSetSeoPageIgnored() {
  return useMutation({
    mutationFn: ({ url, ignored }: { url: string; ignored: boolean }) =>
      setSeoPageIgnored(url, ignored),
    onError,
    onSettled: refreshAll,
  });
}

export function useUpdateSeoQuestionTopic() {
  const actor = useActor();
  return useMutation({
    mutationFn: ({ id, coveredByUrl }: { id: string; coveredByUrl: string | null }) =>
      updateSeoQuestionTopic(id, coveredByUrl, actor),
    onError,
    onSettled: refreshAll,
  });
}

export function useCreateSeoTaskFromTopic() {
  const actor = useActor();
  return useMutation({
    mutationFn: ({ id, category }: { id: string; category: 3 | 8 }) =>
      createSeoTaskFromTopic(id, category, actor),
    onSuccess: () => notification.success({ message: "Task added to the Inbox" }),
    onError,
    onSettled: refreshAll,
  });
}

export function useSavePlaybookEntry() {
  const actor = useActor();
  return useMutation({
    mutationFn: ({ id, kind, text }: { id?: string; kind: any; text: string }) =>
      id ? updateSeoPlaybookEntry(id, { kind, text }) : createSeoPlaybookEntry({ kind, text }, actor),
    onError,
    onSettled: refreshAll,
  });
}

export function useDeletePlaybookEntry() {
  return useMutation({
    mutationFn: (id: string) => deleteSeoPlaybookEntry(id),
    onError,
    onSettled: refreshAll,
  });
}

export function useUpdateSeoSettings() {
  return useMutation({
    mutationFn: (thresholds: Record<string, any>) => updateSeoSettings(thresholds),
    onSuccess: () => notification.success({ message: "Settings saved" }),
    onError,
    onSettled: refreshAll,
  });
}

export function useRunSeoJob() {
  return useMutation({
    mutationFn: (name: string) => runSeoJob(name),
    onSuccess: (_, name) =>
      notification.info({ message: `${name} started`, description: "Its status updates in Settings › Jobs." }),
    onError,
    onSettled: refreshAll,
  });
}
