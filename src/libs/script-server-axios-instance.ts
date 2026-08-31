import axios, { AxiosRequestConfig } from "axios";

import { scriptServerApiKey, scriptServerApiUrl } from "./constants";

const config: AxiosRequestConfig = {
  baseURL: (scriptServerApiUrl || "").replace(/\/$/, ""),
  headers: {
    "x-api-key": scriptServerApiKey || "",
  },
};

export const scriptServerApiInstance = axios.create(config);
