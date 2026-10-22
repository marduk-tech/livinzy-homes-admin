export type BrickchatFeedbackStatus =
  | "new"
  | "in-progress"
  | "completed"
  | "verified"
  | "wont-fix";

// Statuses that close out a feedback note and so can carry a resolutionComment.
export const RESOLVED_BRICKCHAT_FEEDBACK_STATUSES: BrickchatFeedbackStatus[] = [
  "wont-fix",
  "completed",
  "verified",
];

export const BRICKCHAT_FEEDBACK_STATUS_OPTIONS: {
  value: BrickchatFeedbackStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "verified", label: "Verified" },
  { value: "wont-fix", label: "Wont Fix" },
];

// 1-5, same scale as rating in brickchat-feedback.model.js (backend)
export type BrickchatFeedbackRating = 1 | 2 | 3 | 4 | 5;

export const BRICKCHAT_FEEDBACK_RATING_OPTIONS: {
  value: BrickchatFeedbackRating;
  label: string;
}[] = [
  { value: 1, label: "Bad" },
  { value: 2, label: "Needs work" },
  { value: 3, label: "Satisfactory" },
  { value: 4, label: "Good" },
  { value: 5, label: "Awesome" },
];

export type BrickchatFeedbackCategory =
  | "wrong-intent"
  | "wrong-data"
  | "hallucination"
  | "missing-info"
  | "wrong-project"
  | "too-long"
  | "tone"
  | "other";

export const BRICKCHAT_FEEDBACK_CATEGORY_OPTIONS: {
  value: BrickchatFeedbackCategory;
  label: string;
}[] = [
  { value: "wrong-intent", label: "Wrong Intent" },
  { value: "wrong-project", label: "Wrong Project" },
  { value: "wrong-data", label: "Wrong Data" },
  { value: "hallucination", label: "Hallucination" },
  { value: "missing-info", label: "Missing Info" },
  { value: "too-long", label: "Too Long" },
  { value: "tone", label: "Tone" },
  { value: "other", label: "Other" },
];

export type BrickchatFeedbackRootCause =
  | "prompt"
  | "data"
  | "retrieval"
  | "code"
  | "not-an-issue"
  | "unclear";

export const BRICKCHAT_FEEDBACK_ROOT_CAUSE_OPTIONS: {
  value: BrickchatFeedbackRootCause;
  label: string;
}[] = [
  { value: "prompt", label: "Prompt" },
  { value: "data", label: "Data" },
  { value: "retrieval", label: "Retrieval" },
  { value: "code", label: "Code" },
  { value: "not-an-issue", label: "Not an issue" },
  { value: "unclear", label: "Unclear" },
];

// Copied from the turn's log + LangSmith planner run when feedback is
// submitted, so the case can be replayed later.
export interface BrickchatFeedbackSnapshot {
  plannerInput?: unknown;
  query?: string;
  updatedQuery?: string;
  intent?: Record<string, unknown>;
  plan?: Record<string, unknown>;
  outcome?: string;
  answer?: string;
  promptVersions?: Record<string, number | "default">;
  // what couldn't be captured and why (e.g. an expired LangSmith trace)
  captureErrors?: string[];
  capturedAt?: string;
}

// Drafted by LLM triage, then confirmed by a reviewer.
export interface BrickchatFeedbackAssessment {
  rootCause?: BrickchatFeedbackRootCause;
  blocks?: string[];
  expected?: string;
  checks?: Record<string, unknown>;
  question?: string;
  draftedBy?: "llm" | "reviewer";
  draftedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface BrickchatFeedback {
  _id: string;
  threadId: string;
  // absent for thread-level feedback
  turnId?: string;
  userId: string;
  source?: "user" | "reviewer";
  rating?: BrickchatFeedbackRating;
  category?: BrickchatFeedbackCategory;
  // optional - a rating or category alone is valid feedback
  text?: string;
  imageUrls?: string[];
  snapshot?: BrickchatFeedbackSnapshot;
  assessment?: BrickchatFeedbackAssessment;
  revisionIds?: string[];
  status?: BrickchatFeedbackStatus;
  resolutionComment?: string;
  createdAt: string;
  updatedAt: string;
}
