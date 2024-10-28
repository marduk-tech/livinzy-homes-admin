export const envMode = import.meta.env.MODE;

export const baseApiUrl = import.meta.env.VITE_API_URL;

export const queryKeys = {
  projects: "projects",
  getProjectById: "getProjectById",
};

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