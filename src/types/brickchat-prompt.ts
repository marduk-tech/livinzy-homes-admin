export type BrickchatPromptGroup = "planner" | "discovery" | "synthesize";

export type BrickchatPromptKind = "text" | "template" | "data";

// "default" = no stored versions yet, so this is the code default
export type BrickchatPromptStatus = "draft" | "active" | "archived" | "default";

// One editable prompt block at its latest version (see GET /brickchat-prompts)
export interface BrickchatPrompt {
  key: string;
  group: BrickchatPromptGroup;
  kind: BrickchatPromptKind;
  // {{placeholders}} a template's body uses, filled in at runtime
  variables: string[];
  // string for text/template, JSON object/array for data
  body: string | Record<string, unknown> | unknown[];
  version: number | null;
  status: BrickchatPromptStatus;
  // the revision that created this version (null for a code default)
  revisionId: string | null;
  updatedAt: string | null;
}
