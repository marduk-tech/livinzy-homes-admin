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
            console.log('ui data was generated');
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

      // // Generate UI in background after project update
      // api
      //   .generateProjectUI(projectId, "")
      //   .then((response) => {
      //     if (response.data) {
      //       // Update project with generated UI
      //       console.log("ui data was generated")
      //     }
      //   })
      //   .catch(console.error);
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
    },
  });
}

export function useProjectForm() {
  const { data: developers = [] } = useFetchDevelopers();

  const projectStructure: ProjectStructure = {
    info: [
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
        dbField: "externalWebsites",
        fieldDisplayName: "External websites",
        fieldDescription: "Website for the project.",
      },
      {
        dbField: "status",
        fieldDisplayName: "Status",
        fieldDescription: "Current status of the project",
        type: "single_select",
        options: [
          { label: "New", value: "new" },
          { label: "Active", value: "active" },
          { label: "Disabled", value: "disabled" },
        ],
      },
      {
        dbField: "homeType",
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
        dbField: "reraNumber",
        fieldDisplayName: "Rera Number",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "amenities",
        type: "text",
        fieldDisplayName: "Amenities",
        fieldDescription: "List all amenities separated by comma or newline",
      },
      {
        dbField: "financialPlan",
        type: "text",
        fieldDisplayName: "Finacial plan",
        fieldDescription: "Explain financial plan in detail",
      },
      {
        dbField: "configWithPricing",
        type: "text",
        fieldDisplayName: "Unit configs and pricing",
        fieldDescription: "List all unit configuration along with base price",
      },
      
    ]
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
