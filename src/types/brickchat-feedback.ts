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

export interface BrickchatFeedback {
  _id: string;
  threadId: string;
  userId: string;
  text: string;
  imageUrls?: string[];
  status?: BrickchatFeedbackStatus;
  resolutionComment?: string;
  createdAt: string;
  updatedAt: string;
}
