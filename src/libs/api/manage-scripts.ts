import { scriptServerApiInstance } from "../script-server-axios-instance";

export type OptionSource =
  | { kind: "static"; options: { value: string; label: string }[] }
  | {
      kind: "remote";
      name: "developers" | "reraProjects" | "places";
      dependsOn?: string;
    };

export type ArgStyle =
  | { style: "positional" }
  | { style: "positional-csv" }
  | { style: "flag"; flag: string }
  | { style: "bool"; flag: string };

export type ScriptParam = {
  name: string;
  label: string;
  control: "select" | "multiselect" | "tags" | "number" | "text" | "flag";
  required?: boolean;
  expects?: "objectId";
  hint?: string;
  placeholder?: string;
  source?: OptionSource;
  arg: ArgStyle;
};

export type ScriptMode = {
  key: string;
  label: string;
  hint?: string;
  params: ScriptParam[];
};

export type ScriptSpec = {
  name: string;
  description: string;
  usesBrowser: boolean;
  modes?: ScriptMode[];
  params: ScriptParam[];
};

// Mirrors stagehand/src/jobs.ts
export type JobStatus = "running" | "done" | "error" | "stopped";

export type JobSummary = {
  id: string;
  kind: string;
  status: JobStatus;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  meta: Record<string, unknown>;
  pid?: number;
  usesBrowser?: boolean;
  stopping?: boolean;
};

export type Job = JobSummary & { logs: string[] };

export async function getScriptManifest(): Promise<ScriptSpec[]> {
  const { data } = await scriptServerApiInstance.get<{ scripts: ScriptSpec[] }>(
    "/scripts/manifest",
  );
  return data.scripts;
}

export async function runScript(payload: {
  script: string;
  args: string[];
}): Promise<{ jobId: string; script: string; args: string[]; status: string }> {
  const { data } = await scriptServerApiInstance.post("/run", payload);
  return data;
}

export async function getJobs(): Promise<JobSummary[]> {
  const { data } = await scriptServerApiInstance.get<{ jobs: JobSummary[] }>(
    "/jobs",
  );
  return data.jobs;
}

export async function getJob(jobId: string): Promise<Job> {
  const { data } = await scriptServerApiInstance.get<Job>(`/jobs/${jobId}`);
  return data;
}

export async function stopJob(jobId: string): Promise<{ ok: boolean }> {
  const { data } = await scriptServerApiInstance.post(`/jobs/${jobId}/stop`);
  return data;
}
