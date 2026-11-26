import {
  IEmailReachout,
  IEmailTemplate,
  IFeedback,
  IGhostPage,
  IGlossary,
} from "../../types";
import { axiosApiInstance } from "../axios-api-Instance";

export const getAllEmailTemplates = async () => {
  const endpoint = `/marketing/email-templates`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IEmailTemplate[];
  });
};

export const createEmailTemplate = async (data: {
  name: string;
  subject?: string;
  html: string;
}) => {
  const endpoint = `/marketing/email-templates`;
  return axiosApiInstance.post(endpoint, data).then((response) => {
    return response.data as IEmailTemplate;
  });
};

export const sendTestEmailTemplate = async (
  id: string,
  data: {
    email: string;
    html?: string;
    subject?: string;
    variables?: Record<string, string>;
  }
) => {
  const endpoint = `/marketing/email-templates/${id}/test`;
  return axiosApiInstance.post(endpoint, data).then((response) => {
    return response.data as { success: boolean; id?: string };
  });
};

export const updateEmailTemplate = async (id: string, html: string) => {
  const endpoint = `/marketing/email-templates/${id}`;
  return axiosApiInstance.put(endpoint, { html }).then((response) => {
    return response.data as IEmailTemplate;
  });
};

export const getAllGlossary = async () => {
  const endpoint = `/marketing?type=glossary`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IGlossary[];
  });
};

export const createGlossary = async (glossaryData: Partial<IGlossary>) => {
  const endpoint = `/marketing`;
  return axiosApiInstance.post(endpoint, glossaryData).then((response) => {
    return response.data as IGlossary;
  });
};

export const updateGlossary = async (
  id: string,
  glossaryData: Partial<IGlossary>
) => {
  const endpoint = `/marketing/${id}`;
  return axiosApiInstance.put(endpoint, glossaryData).then((response) => {
    return response.data as IGlossary;
  });
};

export const deleteGlossary = async (id: string) => {
  const endpoint = `/marketing/${id}`;
  return axiosApiInstance.delete(endpoint).then((response) => {
    return response.data;
  });
};

export const getAllEmailReachouts = async () => {
  const endpoint = `/marketing?type=emailReachout`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IEmailReachout[];
  });
};

export const getAllFeedbacks = async () => {
  const endpoint = `/marketing/feedback`;
  return axiosApiInstance.get(endpoint).then((response) => {
    return response.data as IFeedback[];
  });
};

export const getGhostGlossaryPages = async (tag = 'glossary'): Promise<IGhostPage[]> => {
  const endpoint = `/marketing/ghost-pages?tag=${tag}`;

  try {
    const response = await axiosApiInstance.get(endpoint);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching Ghost pages:", error);
    return [];
  }
};
