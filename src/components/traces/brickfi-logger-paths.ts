// URL structure for the Brickfi Logger page - one path per tab, so each tab
// (and a specific thread) can be linked to directly:
//   /brickfi-logger                    -> redirects to the threads tab
//   /brickfi-logger/threads            -> threads tab, nothing loaded
//   /brickfi-logger/threads/:threadId  -> threads tab with that thread loaded
//   /brickfi-logger/feedback           -> feedback tab
//   /brickfi-logger/prompts            -> prompts tab
//   /brickfi-logger/revisions          -> prompt revisions tab
//   /brickfi-logger/evals              -> eval cases and runs
//   /brickfi-logger/evals/:runId       -> evals tab with that run open
export const BRICKFI_LOGGER_BASE = "/brickfi-logger";

export const BRICKFI_LOGGER_TABS = {
  threads: "threads",
  feedback: "feedback",
  prompts: "prompts",
  revisions: "revisions",
  evals: "evals",
} as const;

export type BrickfiLoggerTab =
  (typeof BRICKFI_LOGGER_TABS)[keyof typeof BRICKFI_LOGGER_TABS];

export const BRICKFI_LOGGER_PATHS = {
  tab: (tab: BrickfiLoggerTab) => `${BRICKFI_LOGGER_BASE}/${tab}`,
  thread: (threadId: string) =>
    `${BRICKFI_LOGGER_BASE}/${BRICKFI_LOGGER_TABS.threads}/${encodeURIComponent(threadId)}`,
  evalRun: (runId: string) =>
    `${BRICKFI_LOGGER_BASE}/${BRICKFI_LOGGER_TABS.evals}/${encodeURIComponent(runId)}`,
};
