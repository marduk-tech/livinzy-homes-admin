export interface DeveloperProject {
  name: string;
  reraNumber: string;
  promoterName: string;
}

export interface RealEstateDeveloper {
  _id: string;
  name: string;
  developerProjects: DeveloperProject[];
  createdAt: string;
  updatedAt: string;
}
