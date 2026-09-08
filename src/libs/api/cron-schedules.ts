import { scriptServerApiInstance } from "../script-server-axios-instance";

// Mirrors stagehand/src/store/schedules.ts
export type CronSchedule = {
  id: string;
  label?: string;
  script: string;
  args: string[];
  cron: string;
  timezone: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastJobId?: string;
  nextRun?: string;
};

export type CronScheduleInput = {
  label?: string;
  script: string;
  args: string[];
  cron: string;
  timezone?: string;
  enabled?: boolean;
};

export async function getCronSchedules(): Promise<CronSchedule[]> {
  const { data } = await scriptServerApiInstance.get<{ crons: CronSchedule[] }>(
    "/crons",
  );
  return data.crons;
}

export async function createCronSchedule(
  payload: CronScheduleInput,
): Promise<CronSchedule> {
  const { data } = await scriptServerApiInstance.post("/crons", payload);
  return data.cron;
}

export async function updateCronSchedule({
  id,
  ...payload
}: Partial<CronScheduleInput> & { id: string }): Promise<CronSchedule> {
  const { data } = await scriptServerApiInstance.patch(`/crons/${id}`, payload);
  return data.cron;
}

export async function deleteCronSchedule(id: string): Promise<{ ok: boolean }> {
  const { data } = await scriptServerApiInstance.delete(`/crons/${id}`);
  return data;
}

export async function runCronScheduleNow(
  id: string,
): Promise<{ jobId: string; status: string }> {
  const { data } = await scriptServerApiInstance.post(`/crons/${id}/run`);
  return data;
}
