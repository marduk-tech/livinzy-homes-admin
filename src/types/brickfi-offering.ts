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
  // optional button icon - a react-icons set key and an icon name in it
  icon?: { iconSet: string; iconName: string };
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

export type BrickfiOfferingTicketStatus = "open" | "in-progress" | "closed";

// A request a user submitted from an offering's CTA flow in brickchat (see
// GET /brickfi-offerings/tickets)
export interface BrickfiOfferingTicket {
  _id: string;
  ticketId: string;
  // the signed-in user who raised it - null for a guest
  user: {
    _id: string;
    name?: string;
    mobile?: string;
    countryCode?: string;
    email?: string;
  } | null;
  guestId?: string;
  threadId: string;
  turnId?: string;
  offeringKey: string;
  // current names - null if the offering or CTA no longer exists
  offeringTitle: string | null;
  ctaId: string;
  ctaLabel: string | null;
  // whatever the CTA's flow collected - its shape is the flow's own
  data: Record<string, unknown>;
  status: BrickfiOfferingTicketStatus;
  createdAt: string;
  updatedAt: string;
}
