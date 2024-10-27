import * as projectCalls from "./projects";
import * as uploadCalls from "./upload";

export const api = {
  ...projectCalls,
  ...uploadCalls,
};
