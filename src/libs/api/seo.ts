import {
  SeoHealth,
  SeoPage,
  SeoPlaybookEntry,
  SeoQuestionTopic,
  SeoSettings,
  SeoSummary,
  SeoTask,
  SeoTaskGroup,
} from "../../types/seo";
import { axiosApiInstance } from "../axios-api-Instance";

// Marketing > SEO Optimize. Every endpoint is under /marketing/seo (served
// by marketing.controller in livinzy-homes-services).
const BASE = "/marketing/seo";

// who is acting - recorded on approvals, rejections and publishes
const as = (actor?: string) =>
  actor ? { headers: { "x-admin-user": actor } } : undefined;

export const getSeoSummary = () =>
  axiosApiInstance.get<SeoSummary>(`${BASE}/summary`).then((r) => r.data);

export const getSeoTasks = (group: SeoTaskGroup) =>
  axiosApiInstance
    .get<SeoTask[]>(`${BASE}/tasks`, { params: { group } })
    .then((r) => r.data);

export type SeoTaskUpdate = {
  action?:
    | "approve"
    | "reject"
    | "snooze"
    | "cancel"
    | "send_back"
    | "done"
    | "note"
    | "edit";
  reason?: string;
  addToPlaybook?: boolean;
  days?: number;
  note?: string;
  edits?: Partial<Pick<SeoTask, "title" | "proposal" | "successMetric" | "priority" | "targetUrl">>;
  selectedOption?: number;
  selectedLinks?: number[];
  draftAfter?: Record<string, any>;
};

export const updateSeoTask = (id: string, body: SeoTaskUpdate, actor?: string) =>
  axiosApiInstance
    .patch<SeoTask>(`${BASE}/tasks/${id}`, body, as(actor))
    .then((r) => r.data);

export const publishSeoTask = (id: string, actor?: string) =>
  axiosApiInstance
    .post<SeoTask>(`${BASE}/tasks/${id}/publish`, {}, as(actor))
    .then((r) => r.data);

export const rollbackSeoTask = (id: string, actor?: string) =>
  axiosApiInstance
    .post<SeoTask>(`${BASE}/tasks/${id}/rollback`, {}, as(actor))
    .then((r) => r.data);

export const addSeoTaskLesson = (id: string, text: string, actor?: string) =>
  axiosApiInstance
    .post(`${BASE}/tasks/${id}/lesson`, { text }, as(actor))
    .then((r) => r.data);

export const addSeoIdea = (
  idea: { title: string; notes?: string; url?: string },
  actor?: string
) =>
  axiosApiInstance
    .post<SeoTask>(`${BASE}/ideas`, idea, as(actor))
    .then((r) => r.data);

export const getSeoHealth = () =>
  axiosApiInstance.get<SeoHealth>(`${BASE}/health`).then((r) => r.data);

export const createSeoHealthTask = (cause: string, actor?: string) =>
  axiosApiInstance
    .post<SeoTask>(`${BASE}/health/tasks`, { cause }, as(actor))
    .then((r) => r.data);

export const setSeoPageIgnored = (url: string, ignored: boolean) =>
  axiosApiInstance
    .post(`${BASE}/pages/ignore`, { url, ignored })
    .then((r) => r.data);

export const getSeoPages = (params: {
  kind?: string;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}) =>
  axiosApiInstance
    .get<{ items: SeoPage[]; total: number; byKind: Record<string, number> }>(
      `${BASE}/pages`,
      { params }
    )
    .then((r) => r.data);

export const getSeoQuestions = () =>
  axiosApiInstance
    .get<SeoQuestionTopic[]>(`${BASE}/questions`)
    .then((r) => r.data);

export const updateSeoQuestionTopic = (
  id: string,
  coveredByUrl: string | null,
  actor?: string
) =>
  axiosApiInstance
    .patch(`${BASE}/questions/${id}`, { coveredByUrl }, as(actor))
    .then((r) => r.data);

export const createSeoTaskFromTopic = (id: string, category: 3 | 8, actor?: string) =>
  axiosApiInstance
    .post<SeoTask>(`${BASE}/questions/${id}/tasks`, { category }, as(actor))
    .then((r) => r.data);

export const getSeoPlaybook = () =>
  axiosApiInstance
    .get<SeoPlaybookEntry[]>(`${BASE}/playbook`)
    .then((r) => r.data);

export const createSeoPlaybookEntry = (
  entry: Pick<SeoPlaybookEntry, "kind" | "text">,
  actor?: string
) =>
  axiosApiInstance
    .post(`${BASE}/playbook`, entry, as(actor))
    .then((r) => r.data);

export const updateSeoPlaybookEntry = (
  id: string,
  entry: Partial<Pick<SeoPlaybookEntry, "kind" | "text">>
) =>
  axiosApiInstance.put(`${BASE}/playbook/${id}`, entry).then((r) => r.data);

export const deleteSeoPlaybookEntry = (id: string) =>
  axiosApiInstance.delete(`${BASE}/playbook/${id}`).then((r) => r.data);

export const getSeoSettings = () =>
  axiosApiInstance.get<SeoSettings>(`${BASE}/settings`).then((r) => r.data);

export const updateSeoSettings = (thresholds: Record<string, any>) =>
  axiosApiInstance
    .put<SeoSettings>(`${BASE}/settings`, { thresholds })
    .then((r) => r.data);

export const runSeoJob = (name: string) =>
  axiosApiInstance.post(`${BASE}/jobs/${name}/run`).then((r) => r.data);
