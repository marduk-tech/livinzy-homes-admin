interface DeveloperProject {
  name: string;
  reraNumber?: string;
  promoterName?: string;
  primaryProject?: string;
  _id?: string;
}

export interface DeveloperScoreCriterion {
  rating?: number;
  reasoning?: string[];
}

export interface DeveloperBrkfiScore {
  score?: number;
  reasoning?: {
    experience?: DeveloperScoreCriterion;
    timeCommitment?: DeveloperScoreCriterion;
    complaints?: DeveloperScoreCriterion;
  };
}

export interface DeveloperBrkfiStatus {
  isPartner?: boolean;
}

export interface Developer {
  _id: string;
  name: string;
  slug?: string;
  genDetails?: object;
  developerProjects: DeveloperProject[];
  externalWebsites?: string[];
  brkfiScore?: DeveloperBrkfiScore;
  brkfiStatus?: DeveloperBrkfiStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateDeveloperPayload = Omit<
  Developer,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdateDeveloperPayload = Partial<CreateDeveloperPayload>;
