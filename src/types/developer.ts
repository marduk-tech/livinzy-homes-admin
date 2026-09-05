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

export type SourcedText = { text?: string; sources?: number[] };
export type DeveloperBioField = SourcedText | string;

export interface DeveloperGenProject {
  name: string;
  location?: string;
  type?: "residential" | "commercial" | "mixed-use";
  subType?: "apartment" | "plotted" | "villa" | "mall" | "hotel" | "workplace";
  unitVariations?: string;
  amenityAndFeatures?: string;
  timeline?: string;
  sources?: number[];
}

export interface DeveloperCitation {
  index?: number;
  url: string;
  title?: string;
}

export interface DeveloperGenDetails {
  citations?: DeveloperCitation[];
  details?: {
    projects?: DeveloperGenProject[];
    management?: DeveloperBioField;
    financials?: DeveloperBioField;
    feedback?: DeveloperBioField;
    otherDetails?: DeveloperBioField;
    brand?: { website?: string; logo?: string; brandNames?: string };
  };
}

export interface DeveloperInfo {
  oneLiner?: string;
  credibility?: {
    experienceTime?: string;
    projectsTheme?: string;
    financials?: string;
  };
  faq?: { question: string; answer: string }[];
}

export interface Developer {
  _id: string;
  name: string;
  slug?: string;
  genDetails?: DeveloperGenDetails;
  info?: DeveloperInfo;
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
