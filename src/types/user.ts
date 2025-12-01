export interface UserProfile {
  name?: string;
  email?: string;
  city?: string;
  source?: string;
  linkedin?: string;
}

export interface ChatSession {
  _id: string;
  sessionId: string;
  startingQuestion: string;
  createdAt: string;
}

export interface SavedLvnzyProject {
  _id: string;
  collectionName: string;
  projects: string[];
}

export interface CreateSavedLvnzyProject {
  collectionName: string;
  projects: string[];
}

export interface RequestedReport {
  projectName: string;
  reraId: string;
  requestDate: string;
  lvnzyProjectId?: string;
}

export interface RequestedReportRow {
  projectName: string;
  lvnzyProjectId?: string;
  requestDate: string;
  userId: string;
  userName: string;
  userMobile: string;
  userCountryCode: string;
}

export interface UtmEntry {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landingPage?: string;
  capturedAt: string;
}

export interface User {
  _id: string;
  mobile: string;
  countryCode: string;
  profile: UserProfile;
  savedProjects: string[];
  savedLvnzyProjects: SavedLvnzyProject[];
  chatSessions: ChatSession[];
  requestedReports?: RequestedReport[];
  metrics?: {
    utm?: UtmEntry[];
  };
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface CreateUserPayload {
  mobile: string;
  countryCode: string;
  profile?: UserProfile;
  savedLvnzyProjects?: CreateSavedLvnzyProject[];
}

export interface UpdateUserPayload {
  mobile: string;
  countryCode: string;
  profile: UserProfile;
  savedLvnzyProjects: SavedLvnzyProject[];
}
