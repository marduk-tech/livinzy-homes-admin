import dayjs from "dayjs";
import {
  EvalRunListItem,
  EvalRunStatus,
  EvalStatus,
} from "../../types/brickchat-eval";

export const EVAL_STATUS_COLORS: Record<EvalStatus, string> = {
  PASS: "green",
  FAIL: "red",
  "KNOWN-FAIL": "orange",
  CRASH: "magenta",
};

export const EVAL_RUN_STATUS_COLORS: Record<EvalRunStatus, string> = {
  queued: "default",
  running: "processing",
  done: "green",
  failed: "red",
  stopped: "default",
  interrupted: "orange",
};

// @ant-design/pro-chat sets dayjs's global locale to zh-cn, so pin English
export const formatEvalDate = (date?: string) =>
  date ? dayjs(date).locale("en").format("DD MMM, hh:mm A") : "-";

export const formatSeconds = (ms?: number | null) =>
  ms == null ? "-" : `${Math.round(ms / 100) / 10}s`;

export const runDurationMs = (run: { startedAt?: string; finishedAt?: string }) =>
  run.startedAt
    ? (run.finishedAt ? new Date(run.finishedAt) : new Date()).getTime() -
      new Date(run.startedAt).getTime()
    : null;

export const runScopeLabel = (run: Pick<EvalRunListItem, "scope">) =>
  run.scope?.intent ||
  `${run.scope?.caseIds?.length ?? 0} case${run.scope?.caseIds?.length === 1 ? "" : "s"}`;
