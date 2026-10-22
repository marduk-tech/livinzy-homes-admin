import { BrickchatRevisionStatus } from "../../types/brickchat-revision";

export const REVISION_STATUS_COLORS: Record<BrickchatRevisionStatus, string> = {
  draft: "orange",
  active: "green",
  rejected: "default",
  "rolled-back": "red",
};
