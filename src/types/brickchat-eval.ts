// Shapes from services/src/scripts/evals

export type EvalStatus = "PASS" | "FAIL" | "KNOWN-FAIL" | "CRASH";

export type EvalRunStatus =
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "stopped"
  | "interrupted";

export interface EvalTurnSpec {
  q: string;
  expectIntent?: string;
  expectSubIntent?: string;
  expectTools?: string[];
  expectNonEmpty?: string[];
  expectIntentArgs?: Record<string, unknown>;
  expectMetadata?: Record<string, unknown>;
  expectSoftMetadata?: string[];
  minProjects?: number;
  expectPrompt?: boolean;
}

export interface EvalJudge {
  relevance?: number;
  faithfulness?: number;
  routing?: number;
  reasoning?: string;
  error?: string;
}

// a case's result from the newest run that included it
export interface EvalLastResult {
  runId: string;
  runAt: string;
  status: EvalStatus;
  pass: boolean;
  judge: EvalJudge | null;
  threadId: string | null;
  latencyMs: number;
}

export interface EvalCase {
  id: string;
  intent: string;
  category: string;
  source: "csv" | "manual";
  turns: EvalTurnSpec[];
  expect?: Record<string, unknown>;
  soft?: string[];
  knownIssue?: string;
  notes?: string;
  lastResult: EvalLastResult | null;
}

export interface EvalCasesResponse {
  intents: string[];
  // for the case editor
  tools: string[];
  softFamilies: string[];
  cases: EvalCase[];
}

export interface EvalCaseExpect {
  minProjects?: number;
  directAnswer?: boolean;
  expectImages?: boolean;
  answerMentions?: string[];
  promptAllowed?: boolean;
}

// queries.json shape
export type EvalCaseInput = Omit<EvalCase, "lastResult" | "expect"> & {
  expect?: EvalCaseExpect;
};

export interface EvalImportPreview {
  added: string[];
  updated: string[];
  unchanged: string[];
  errors: string[];
  imported: boolean;
}

export interface EvalToolRun {
  stepId: string;
  tool: string;
  args?: unknown;
  count: number;
  empty: boolean;
}

export interface EvalTurnResult {
  q: string;
  intent: string | null;
  subIntent: string | null;
  prompt: string | null;
  intentArgs?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  softMetadata?: string[];
  plan: string[];
  toolRuns: EvalToolRun[];
  shownProjectNames?: string[];
  error: string | null;
  latencyMs: number;
  answer: {
    summary: string;
    projectNames: string[];
    projectsCount: number;
    imagesCount: number;
    nextSetCount: number;
    directAnswer: boolean;
  } | null;
}

export interface EvalCaseResult {
  id: string;
  intent?: string;
  category: string;
  source?: string;
  threadId?: string;
  pass: boolean;
  status: EvalStatus;
  checksDetail: Record<string, boolean>;
  softFailures: string[];
  judge?: EvalJudge | null;
  knownIssue?: string;
  notes?: string;
  error?: string;
  turns: EvalTurnResult[];
}

export interface EvalSummaryRow {
  cases: number;
  passed: number;
  knownFail: number;
  planMismatches: number;
  emptyToolRuns: number;
  errors: number;
  avgRelevance: number | null;
  avgFaithfulness: number | null;
  avgRouting: number | null;
  avgTurnLatencyMs: number | null;
}

interface EvalRunBase {
  _id: string;
  label?: string;
  scope: { intent?: string; caseIds?: string[] };
  triggeredBy?: string;
  status: EvalRunStatus;
  host?: string;
  pid?: number;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  model?: string;
  judgeModel?: string;
  casesTotal?: number;
  createdAt: string;
  updatedAt: string;
}

// list view - no per-case results
export interface EvalRunListItem extends EvalRunBase {
  resultsCount: number;
  passed: number;
  avgRelevance: number | null;
  avgFaithfulness: number | null;
  avgRouting: number | null;
}

export interface EvalRun extends EvalRunBase {
  summary?: Record<string, EvalSummaryRow>;
  summaryByUseCase?: Record<string, EvalSummaryRow>;
  results: EvalCaseResult[];
}
