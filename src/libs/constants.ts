export const envMode = import.meta.env.MODE;

export const baseApiUrl = import.meta.env.VITE_API_URL;

export const queryKeys = {
  projects: "projects",
  getProjectById: "getProjectById",
  getAllPlaces: "getAllPlaces",
  getAllDrivers: "getAllDrivers",
  getAllGlobalKnowledge: "getAllGlobalKnowledge",

  getAllChromaDocs: "getAllChromaDocs",
};
export const LivIndexDrivers = [
  "road",
  "school",
  "hospital",
  "commercial",
  "leisure",
  "industrial-hitech",
  "industrial-general",
  "airport",
  "transit",
  "tier-1-city",
  "tier-2-city",
  "tourist-city",
  "satellite-city",
];

export const LivIndexMegaDrivers = ["macro", "connectivity", "livability"];

export const LivIndexStatuses = [
  "announced",
  "pre-construction",
  "construction",
  "partial-launch",
  "launched",
  "post-launch",
];

export const LivIndexPlacesSuperFactors = ["macro", "transport", "livability"];
export const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
export const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
export const auth0CallbackUrl = import.meta.env.VITE_AUTH0_CALLBACK_URL;

export const ProjectCategories = [
  {
    value: "bo",
    label: "Bangalore Outskirts",
  },
  {
    value: "hh",
    label: "Holiday Homes",
  },
  {
    value: "lf",
    label: "Luxury Farmhouses",
  },
  {
    value: "he",
    label: "Harvest & Earn",
  },
  {
    value: "tp",
    label: "Themed Projects",
  },
  {
    value: "bl",
    label: "Bigger Lands",
  },
  {
    value: "pf",
    label: "Pocket Friendly",
  },
];

export const LocationFilters = [
  {
    value: "chikkaballapur",
    label: "Chikkaballapur",
  },
  {
    value: "doddaballapura",
    label: "Doddaballapura",
  },
  {
    value: "sakleshpur",
    label: "Sakleshpur",
  },
  {
    value: "kanakpura",
    label: "Kanakpura",
  },
  {
    value: "mysuru",
    label: "Mysuru",
  },
];

export const CommunicationPreference = [
  {
    value: "PHONE_CALL",
    label: "Phone Call",
  },
  {
    value: "VIDEO_CALL",
    label: "Video Call",
  },
  {
    value: "OFFICE_VISIT",
    label: "Office Visit",
  },
  {
    value: "SITE_VISIT",
    label: "Site Visit",
  },
  {
    value: "HOME_VISIT",
    label: "Home Visit",
  },
];

export const CHROMA_COLLECTION = "livinzy-homes-dev";
export const GLOBAL_CHROMA_COLLECTION = "global-livinzy-homes-dev";
