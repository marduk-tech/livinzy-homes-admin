export interface ILivIndexPlaces {
  _id: string;
  name: string;

  type?: PlaceType;
  placeId?: string;
  pincode?: string;
  location?: {
    lat?: number;
    lng?: number;
  };
  status?: string;
  features?: any;
  driver: string;
  createdAt: Date;
  updatedAt: Date;

  details: {
    description?: string;
    oneLiner?: string;
    footfall?: number;
    updates?: ILivIndexPlaceUpdatesEntry[];
  };
  corridors?: Array<{
    _id: string;
    corridorId: string;
    haversineDistance: number;
  }>;
}

// one batch of updates found for a place (details.updates[]) - written by the
// driver-info script, or added by hand from the admin
export interface ILivIndexPlaceUpdatesEntry {
  _id?: string;
  updatedAt?: string;
  updates: { _id?: string; summary: string; links?: string[] }[];
}

export interface IGlobalKnowledge {
  _id: string;
  title?: string;
  content: string;
  // inactive notes are never retrieved by brickchat; missing means active
  active?: boolean;
  sources?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type PlaceType = "road" | "hospital" | "school" | "futureInfra";

export interface ILivIndexDriver {
  _id: string;
  driverName: string;
  megaDriver?: "macro" | "connectivity" | "livability";
  defaultProximityThreshold?: number;
  defaultTriggerCoefficient?: number;
}

export interface IChromaDoc {
  id: string;
  document: string;
  metadata: IChromaMetaData;
}

export interface IChromaMetaData {
  [key: string]: any;
}

export interface IGlossary {
  _id: string;
  type: string;
  content: {
    title?: string;
    description?: string;
    content?: string;
    pageLink?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Marketing doc of type "email", normalised by the services API
export interface IEmailTemplate {
  _id: string;
  name: string | null;
  subject: string | null;
  html: string;
  createdAt: string;
  updatedAt: string;
}

export interface IEmailReachout {
  _id: string;
  type: string;
  content: {
    success: boolean;
    totalEligibleEmails?: number;
    successEmails?: string[];
    failureEmails?: string[];
    templateId?: number;
    templateTitle?: string;
    error?: string;
    timestamp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IFeedback {
  _id: string;
  type: string;
  content: {
    feedback: { question: string; answer: string }[];
    contact: {
      name: string;
      contact: string;
      mobile?: string;
      email?: string;
      userId?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface IGhostPage {
  id: string;
  title: string;
  slug: string;
  status?: string;
}
