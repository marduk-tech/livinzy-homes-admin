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

export interface User {
  _id: string;
  mobile: string;
  countryCode: string;
  profile: UserProfile;
  savedProjects: string[];
  savedLvnzyProjects: SavedLvnzyProject[];
  chatSessions: ChatSession[];
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
