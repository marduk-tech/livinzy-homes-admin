import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import { api } from "../libs/api";
import {
  CommunicationPreference,
  LocationFilters,
  ProjectCategories,
  queryKeys,
} from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { Project, ProjectStructure } from "../types/Project";
import { useFetchDevelopers } from "./real-estate-developer-hooks";

export function useGetAllProjects(params: {
  searchKeyword: string;
  issueSeverity: string;
  statusFilter: string;
  issueType: string;
  limit?: number;
  sortBy?: string;
  hasStatusComments?: boolean;
}) {
  return useQuery({
    queryKey: [queryKeys.projects, params],
    queryFn: () => api.getAllProjects({ source: "admin", ...params }),
    refetchOnWindowFocus: false,
  });
}

export function useGetProjectStatusCounts() {
  return useQuery({
    queryKey: [queryKeys.projectStatusCounts],
    queryFn: () => api.getProjectStatusCounts(),
    refetchOnWindowFocus: false,
    staleTime: 30000,
    retry: 1,
  });
}

export function useDeleteProjectMutation() {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) => {
      return api.deleteProject(projectId);
    },

    onSuccess: () => {
      notification.success({
        message: `Project removed successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.success({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.projects],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.projectStatusCounts],
      });
    },
  });
}

export function useCreateProjectMutation() {
  return useMutation({
    mutationFn: (projectData: Partial<Project>) => {
      return api.createProject(projectData);
    },

    onSuccess: (project) => {
      notification.success({
        message: `Project created successfully!`,
      });

      // Generate UI in background after project creation
      api
        .generateProjectUI(project._id, "")
        .then((response) => {
          if (response.data) {
            // Update project with generated UI
            console.log("ui data was generated");
          }
        })
        .catch(console.error);
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.projects],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKeys.projectStatusCounts],
      });
    },
  });
}

export function useGenerateProjectUI() {
  return useMutation({
    mutationFn: ({
      projectId,
      instructions,
    }: {
      projectId: string;
      instructions: string;
    }) => {
      return api.generateProjectUI(projectId, instructions || "");
    },

    onSuccess: () => {
      notification.success({
        message: `Project created successfully!`,
      });
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },
  });
}

export function useUpdateProjectMutation({
  projectId,
  enableToasts = true,
}: {
  projectId: string;
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({ projectData }: { projectData: Partial<Project> }) => {
      return api.updateProject(projectId, projectData);
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Project updated successfully!`,
        });
      }
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });

      console.log(error);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getProjectById, projectId],
      });

      queryClient.invalidateQueries({
        queryKey: [queryKeys.getAllCorridors],
      });

      queryClient.invalidateQueries({
        queryKey: [queryKeys.projectStatusCounts],
      });
    },
  });
}

export function useResolveProjectIssueMutation({
  enableToasts = true,
}: {
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      projectId,
      issueField,
      resolvedBy,
      resolutionComments,
    }: {
      projectId: string;
      issueField: string;
      resolvedBy: string;
      resolutionComments: string;
    }) => {
      return api.resolveProjectIssue(
        projectId,
        issueField,
        resolvedBy,
        resolutionComments
      );
    },

    onSuccess: () => {
      if (enableToasts) {
        notification.success({
          message: `Project issue resolved successfully!`,
        });
      }
    },

    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `An unexpected error occurred. Please try again later.`,
      });
    },
  });
}

export function useAddStatusCommentMutation({
  enableToasts = true,
}: {
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      projectId,
      commentText,
    }: {
      projectId: string;
      commentText: string;
    }) => {
      return api.addStatusComment(projectId, commentText);
    },
    onSuccess: () => {
      if (enableToasts) {
        notification.success({ message: `Comment added successfully!` });
      }
    },
    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `Failed to add comment. Please try again.`,
      });
    },
  });
}

export function useEditStatusCommentMutation({
  enableToasts = true,
}: {
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      projectId,
      commentIndex,
      commentText,
    }: {
      projectId: string;
      commentIndex: number;
      commentText: string;
    }) => {
      return api.editStatusComment(projectId, commentIndex, commentText);
    },
    onSuccess: () => {
      if (enableToasts) {
        notification.success({ message: `Comment updated successfully!` });
      }
    },
    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `Failed to update comment. Please try again.`,
      });
    },
  });
}

export function useToggleStatusCommentResolvedMutation({
  enableToasts = false,
}: {
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      projectId,
      commentIndex,
      resolved,
    }: {
      projectId: string;
      commentIndex: number;
      resolved: boolean;
    }) => {
      return api.toggleStatusCommentResolved(projectId, commentIndex, resolved);
    },
    onSuccess: () => {
      if (enableToasts) {
        notification.success({ message: `Status updated!` });
      }
    },
    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `Failed to update status. Please try again.`,
      });
    },
  });
}

export function useDeleteStatusCommentMutation({
  enableToasts = true,
}: {
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({
      projectId,
      commentIndex,
    }: {
      projectId: string;
      commentIndex: number;
    }) => {
      return api.deleteStatusComment(projectId, commentIndex);
    },
    onSuccess: () => {
      if (enableToasts) {
        notification.success({ message: `Comment deleted successfully!` });
      }
    },
    onError: (error: AxiosError<any>) => {
      notification.error({
        message: `Failed to delete comment. Please try again.`,
      });
    },
  });
}

export function useGenerateScoreCardMutation({
  enableToasts = true,
}: {
  enableToasts?: boolean;
}) {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) => {
      return api.generateScoreCard(projectId);
    },
    onSuccess: () => {
      if (enableToasts) {
        notification.success({ message: `Score card generation initiated!` });
      }
    },
    onError: (error: AxiosError<any>) => {
      notification.error({ message: `Failed to generate score card.` });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryKeys.projects] });
    },
  });
}

export function useProjectForm() {
  const { data: developers = [] } = useFetchDevelopers();

  const projectStructure: ProjectStructure = {
    basicInfo: [
      {
        dbField: "name",
        mustHave: true,
        fieldDisplayName: "Name",
        fieldDescription: "The name of the project.",
      },
      {
        dbField: ["location", "mapLink"],
        mustHave: true,
        fieldDisplayName: "Location (Google maps url)",
        fieldDescription:
          "The location of the project identified by Google maps url.",
      },
      {
        dbField: "reraNumber",
        mustHave: true,
        fieldDisplayName: "Rera Number",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "otherPhasesRera",
        fieldDisplayName: "Other Phases Rera Numbers",
        fieldDescription:
          "Comma separated list of rera numbers of other phases",
      },
      {
        dbField: "homeType",
        mustHave: true,
        fieldDisplayName: "Home Type",
        fieldDescription: "Provide relevant details",
        type: "multi_select",
        options: [
          { label: "Farmland", value: "farmland" },
          { label: "Plot", value: "plot" },
          { label: "Villa", value: "villa" },
          { label: "Rowhouse", value: "rowhouse" },
          { label: "Villament", value: "villament" },
          { label: "Apartment", value: "apartment" },
          { label: "Penthouse", value: "penthouse" },
        ],
      },
      {
        dbField: "status",
        mustHave: true,
        fieldDisplayName: "Status",
        fieldDescription: "Current status of the project",
        type: "single_select",
        options: [
          { label: "Disabled", value: "disabled" },
          { label: "New", value: "new" },
          { label: "Basic Details Ready", value: "basic-details-ready" },
          { label: "Data Populated", value: "data-populated" },
          { label: "Data Verified", value: "data-verified" },
          { label: "Report Ready", value: "report-ready" },
          { label: "Report Verified", value: "report-verified" },
        ],
      },
    ],
    layout: [
      {
        dbField: ["layout", "unitCount"],
        fieldDisplayName: "Unit Count",
        fieldDescription: "Total number of units in the project",
      },
      {
        dbField: ["layout", "landArea"],
        fieldDisplayName: "Land Area",
        fieldDescription: "Total land area of the project",
      },
      {
        dbField: ["layout", "openArea"],
        fieldDisplayName: "Open Area %",
        fieldDescription: "Percentage of open area in the project",
      },
      {
        dbField: "unitConfigWithPricing",
        type: "unit_config_list",
        fieldDisplayName: "Unit Configurations",
        fieldDescription: "Add or manage unit configurations and pricing",
      }
      
    ],
    otherDetails: [
      {
        dbField: "amenities",
        type: "text",
        fieldDisplayName: "Amenities",
        fieldDescription: "List all amenities separated by comma or newline",
      },
      {
        dbField: "financialPlan",
        type: "text",
        fieldDisplayName: "Financial plan",
        fieldDescription: "Explain financial plan in detail",
      },
      {
        dbField: "externalWebsites",
        type: "text",
        fieldDisplayName: "External websites",
        fieldDescription: "Website for the project.",
      },
       {
        dbField: "expertInfo",
        type: "text",
        fieldDisplayName: "Expert Info",
        fieldDescription: "Any specific expert analysis to be provided",
      },
    ],
  };

  const fieldRules = {
    metadata: {
      name: [
        { required: true, message: "Please input the project name!" },
        { max: 100, message: "Name cannot be longer than 100 characters" },
      ],
      location: [
        { required: true, message: "Please input the project location!" },
      ],
      website: [
        { required: true, message: "Please input the project location!" },
        { type: "url", message: "Please enter a valid URL" },
      ],
      homeType: [{ required: true, message: "Please select the Home Type" }],
    },
    land: {},
  };

  return {
    fieldRules,
    projectFields: projectStructure,
  };
}
