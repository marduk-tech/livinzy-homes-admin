export interface LvnzyProject {
  _id: string;
  slug?: string;
  // GET /lvnzy-projects (the list) sends this instead of the score itself
  scoreExists?: boolean;
  // list only: unresolved internal checks on the original project, per field
  checkCountsByField?: Record<string, number>;
  // list only: the worst severity among those checks, per field
  checkSeverityByField?: Record<string, number>;
  property: any;
  developer: any;
  investment: any;
  meta: any;
  neighborhood: any;
  connectivity: any;
  originalProjectId: any;
  score: any;
  scoreOriginal?: any;
  scoreComments?: ScoreComment[];
  createdAt: string;
  updatedAt: string;
}

// a sub-pillar's rating + reasoning when the comment was left (no rating for
// the summary's pros/cons)
export interface ScoreSnapshot {
  rating?: number;
  reasoning: string[];
}

export interface ScoreComment {
  _id: string;
  pillar: string;
  subPillar: string;
  comment: string;
  original?: ScoreSnapshot;
  updated?: ScoreSnapshot;
  createdAt: string;
}

export type NewScoreComment = Omit<ScoreComment, "_id" | "createdAt">;
