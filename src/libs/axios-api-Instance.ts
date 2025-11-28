import axios, { AxiosRequestConfig } from "axios";

import { apiKey, baseApiUrl } from "../libs/constants";

const config: AxiosRequestConfig = {
  baseURL: baseApiUrl,
  headers: {
    "x-api-key": apiKey || "",
  },
  // withCredentials: true,
};

const api = axios.create(config);

export const axiosApiInstance = api;
