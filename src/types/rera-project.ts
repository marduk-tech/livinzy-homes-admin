interface RegistrationExtension {
  name: string;
  startDate: string;
  completionDate: string;
}

interface UnitBreakup {
  unitType: string;
  totalUnits: number;
  totalCarpetArea: number;
  totalBalconyArea: number;
}

interface Tower {
  name: string;
  totalFloors: number;
  totalUnits: number;
  totalParking: number;
  height: number;
}

interface ProjectDetails {
  projectName: string;
  projectDescription: string;
  projectRegistrationNumber: string;
  projectType: string;
  projectSubType: string;
  projectLatLng: string;
  projectAddress: string;
  projectLandArea: string;
  projectCoveredArea: string;
  projectOpenArea: string;
  projectParkArea: string;
  projectAuthority: string;
  projectTotalUnits: number;
  projectContractors: string;
  farSanctioned: string;
  totalTowers: number;
  listOfRegistrationsExtensions: RegistrationExtension[];
  unitsBreakup: UnitBreakup[];
  towers: Tower[];
}

export interface ReraProject {
  id: string;
  projectDetails: ProjectDetails;
  complaints: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CreateReraProjectPayload = {
  projectDetails: ProjectDetails;
  complaints: Record<string, any>;
};

export type UpdateReraProjectPayload = Partial<CreateReraProjectPayload>;
