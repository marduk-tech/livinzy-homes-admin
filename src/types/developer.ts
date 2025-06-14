interface DeveloperProject {
  name: string;
  reraNumber?: string;
  promoterName?: string;
  primaryProject?: string;
  _id?: string;
}

export interface Developer {
  _id: string;
  name: string;
  developerProjects: DeveloperProject[];
  externalWebsites?: string[];
  createdAt: string;
  updatedAt: string;
}

export type CreateDeveloperPayload = Omit<
  Developer,
  "_id" | "createdAt" | "updatedAt"
>;

export type UpdateDeveloperPayload = Partial<CreateDeveloperPayload>;
