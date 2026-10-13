export interface BrickchatStepLog {
  id: string;
  tool: string;
  args?: unknown;
  dependsOn: string[];
  status: "ok" | "error";
  resultSummary?: unknown;
  error?: string;
  logs: string[];
  // LangSmith run this step's LLM calls are nested under (absent on turns
  // logged before run ids were recorded)
  langsmithRunId?: string;
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
  plannerRunId?: string;
  steps: BrickchatStepLog[];
  outcome?: string;
  error?: string;
  synthesisLogs: string[];
  synthesisRunId?: string;
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

export interface LlmCallMessage {
  role: string;
  content: unknown;
  toolCalls?: unknown[];
  toolCallId?: string;
}

export interface LlmCall {
  runId: string;
  name: string;
  parentRunId?: string;
  model?: string;
  invocationParams?: Record<string, unknown>;
  messages: LlmCallMessage[];
  prompts?: string[];
  output?: LlmCallMessage | string;
  error?: string;
  promptTokens?: number;
  completionTokens?: number;
  startTime: string;
  endTime?: string;
}

export interface LlmCallsForRun {
  runId: string;
  runName: string;
  traceId: string;
  calls: LlmCall[];
}
