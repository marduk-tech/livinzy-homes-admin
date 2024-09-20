import axios, { AxiosRequestConfig } from "axios";

import { baseApiUrl } from "../libs/constants";

const config: AxiosRequestConfig = {
  baseURL: baseApiUrl,
  // withCredentials: true,
};

const api = axios.create(config);

export const axiosApiInstance = api;
