export interface BrickchatStepLog {
  id: string;
  tool: string;
  args?: unknown;
  dependsOn: string[];
  status: "ok" | "error";
  resultSummary?: unknown;
  error?: string;
  logs: string[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
}

export interface BrickchatPlanStep {
  id: string;
  tool: string;
  args?: unknown;
  dependsOn?: string[];
}

export interface BrickchatTurn {
  turnId: string;
  query: string;
  intent?: unknown;
  plan?: { steps: BrickchatPlanStep[] };
  plannerLogs: string[];
  steps: BrickchatStepLog[];
  outcome?: string;
  error?: string;
  synthesisLogs: string[];
  startedAt: string;
  finishedAt?: string;
}

export interface BrickchatLog {
  thread_id: string;
  turns: BrickchatTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface BrickchatRecentThread {
  thread_id: string;
  query: string;
  startedAt: string;
  createdAt: string;
}
