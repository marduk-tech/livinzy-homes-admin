export interface LvnzyProject {
  _id: string;
  slug?: string;
  // GET /lvnzy-projects (the list) sends this instead of the score itself
  scoreExists?: boolean;
  property: any;
  developer: any;
  investment: any;
  meta: any;
  neighborhood: any;
  connectivity: any;
  originalProjectId: any;
  score: any;
  scoreOriginal?: any;
  createdAt: string;
  updatedAt: string;
}
