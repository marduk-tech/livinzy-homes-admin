export type BrickfiOfferingStatus = "draft" | "active" | "archived";

export const BRICKFI_OFFERING_STATUSES: BrickfiOfferingStatus[] = [
  "draft",
  "active",
  "archived",
];

// One action under an offering's pitch in brickchat - flowKey names the
// flow coded in brickfi-app that the button starts
export interface BrickfiOfferingCta {
  ctaId: string;
  label: string;
  flowKey: string;
  description?: string;
}

// A Brickfi service suggested in brickchat when the conversation fits it
// (see GET /brickfi-offerings). Only "active" ones are used by brickchat.
export interface BrickfiOffering {
  _id: string;
  // stable slug - threads and tickets refer to the offering by it, so it
  // can't change after creation
  key: string;
  title: string;
  summary: string;
  // markdown - everything offered, free and paid
  details: string;
  showWhen: string[];
  excludeWhen: string;
  ctas: BrickfiOfferingCta[];
  status: BrickfiOfferingStatus;
  createdAt: string;
  updatedAt: string;
}

export type BrickfiOfferingInput = Omit<
  BrickfiOffering,
  "_id" | "createdAt" | "updatedAt"
>;

// key can't be changed after creation
export type BrickfiOfferingUpdate = Partial<Omit<BrickfiOfferingInput, "key">>;
