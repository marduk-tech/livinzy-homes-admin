import { BrickchatFeedbackCategory, BrickchatFeedbackRating, BrickchatFeedbackStatus } from "./brickchat-feedback";
import { BrickchatPromptGroup, BrickchatPromptKind } from "./brickchat-prompt";

// One confirmed, prompt-caused feedback entry as revisions show it
export interface BrickchatRevisionCase {
  _id: string;
  rating?: BrickchatFeedbackRating;
  category?: BrickchatFeedbackCategory;
  text?: string;
  query?: string;
  blocks: string[];
  expected?: string;
  createdAt: string;
  // only on a revision's cases
  status?: BrickchatFeedbackStatus;
}

// Open cases whose blocks are connected - what one revision is generated from
// (see GET /brickchat-feedback/revision-groups)
export interface BrickchatRevisionGroup {
  blocks: string[];
  cases: BrickchatRevisionCase[];
  // more blocks than one revision may touch - generate from fewer cases
  tooLarge: boolean;
  // draft revisions already touching some of these blocks
  blockedByRevisionIds: string[];
}

export type BrickchatRevisionStatus =
  | "draft"
  | "active"
  | "rejected"
  | "rolled-back";

export interface BrickchatRevisionBlock {
  key: string;
  version: number;
  // null: drafted on top of the code default
  basedOnVersion: number | null;
  group?: BrickchatPromptGroup;
  kind?: BrickchatPromptKind;
  // string for text/template, JSON value for data
  proposedBody: unknown;
  baseBody: unknown;
  // what's active for this key now (null: the code default)
  activeVersion: number | null;
}

export interface BrickchatRevision {
  _id: string;
  status: BrickchatRevisionStatus;
  source: "seed" | "manual" | "feedback-proposal";
  blocks: BrickchatRevisionBlock[];
  feedbackIds: string[];
  cases: BrickchatRevisionCase[];
  rationale?: string;
  createdBy?: string;
  approvedBy?: string;
  activatedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rolledBackBy?: string;
  rolledBackAt?: string;
  createdAt: string;
  updatedAt: string;
}
