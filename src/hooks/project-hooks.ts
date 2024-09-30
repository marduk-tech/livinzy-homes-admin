import { useMutation } from "@tanstack/react-query";
import { notification } from "antd";
import { AxiosError } from "axios";
import { api } from "../libs/api";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import { Project } from "../types/Project";

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

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [queryKeys.projects],
      });
    },
  });
}

export function useUpdateProjectMutation(projectId: string) {
  return useMutation({
    mutationFn: ({ projectData }: { projectData: Partial<Project> }) => {
      return api.updateProject(projectId, projectData);
    },

    onSuccess: () => {
      notification.success({
        message: `Project updated successfully!`,
      });
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
    },
  });
}

export function useProjectForm() {
  const projectStructure = {
    metadata: [
      {
        dbField: "name",
        fieldDisplayName: "Name",
        fieldDescription: "The name of the project.",
      },
      {
        dbField: "location",
        fieldDisplayName: "Location",
        fieldDescription:
          "The location of the project identified by Google maps url.",
      },
      {
        dbField: "website",
        fieldDisplayName: "Website",
        fieldDescription: "Website for the project.",
      },
      {
        dbField: "company",
        fieldDisplayName: "Company",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "address",
        fieldDisplayName: "Address",
        fieldDescription: "The physical address of the project.",
      },
      {
        dbField: "oneLiner",
        fieldDisplayName: "Oneliner",
        fieldDescription: "One liner showing the speciality of the project.",
      },
      {
        dbField: "description",
        fieldDisplayName: "Description",
        fieldDescription:
          "The description or summary of the project covering the important points at high level.",
      },
      {
        dbField: "summary",
        fieldDisplayName: "Summary",
        fieldDescription:
          "The description or summary of the project covering the important points at high level.",
      },
    ],
    land: [
      {
        dbField: "total_area",
        fieldDisplayName: "Total area",
        fieldDescription: "The total land area of the project in acres.",
      },
      {
        dbField: "plantation",
        fieldDisplayName: "Plantation",
        fieldDescription:
          "Information about plantation on the project i.e trees, plants etc that can be grown.",
      },
      {
        dbField: "irrigation",
        fieldDisplayName: "Irrigation",
        fieldDescription: "Irrigation facilities at the project.",
      },
      {
        dbField: "water_bodies",
        fieldDisplayName: "Water bodies",
        fieldDescription:
          "Any natural or man made water bodies in the project.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Any other land related information.",
      },
    ],
    plots: [
      {
        dbField: "size_mix",
        fieldDisplayName: "Size mix",
        fieldDescription: "Size wise distribution of the plots.",
      },
      {
        dbField: "facing_mix",
        fieldDisplayName: "Facing mix",
        fieldDescription: "Direction wise distribution of the plots.",
      },
      {
        dbField: "shape_mix",
        fieldDisplayName: "Shape mix",
        fieldDescription: "Shape wise distribution of the plots.",
      },
      {
        dbField: "plots_list",
        fieldDisplayName: "Plots list",
        fieldDescription:
          "List of plots in as detailed manner as possible (if available).",
      },
      {
        dbField: "villa",
        fieldDisplayName: "Villa",
        fieldDescription:
          "Information about the villa that can be constructed on the plot.",
      },
      {
        dbField: "cost_range",
        fieldDisplayName: "Cost range",
        fieldDescription: "Costing information of the plots.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Any other relevant information about the plots.",
      },
    ],

    connectivity: [
      {
        dbField: "roads",
        fieldDisplayName: "Roads",
        fieldDescription: "Road connectivity for the project.",
      },
      {
        dbField: "towns",
        fieldDisplayName: "Towns",
        fieldDescription: "Any nearby towns or cities.",
      },
      {
        dbField: "schools",
        fieldDisplayName: "Schools",
        fieldDescription: "Nearby schools.",
      },
      {
        dbField: "hospital",
        fieldDisplayName: "Hospital",
        fieldDescription: "Nearby hospitals.",
      },
      {
        dbField: "airport",
        fieldDisplayName: "Airport",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Provide relevant details.",
      },
    ],
    climate: [
      {
        dbField: "rainfall",
        fieldDisplayName: "Rainfall",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "temperature",
        fieldDisplayName: "Temperature",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "humidity",
        fieldDisplayName: "Humidity",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Provide relevant details.",
      },
    ],
    basic_infra: [
      {
        dbField: "electricity",
        fieldDisplayName: "Electricity",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "water_supply",
        fieldDisplayName: "Water supply",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "pathways",
        fieldDisplayName: "Pathways",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "security",
        fieldDisplayName: "Security",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Provide relevant details.",
      },
    ],

    amenities: [
      {
        dbField: "sports_external",
        fieldDisplayName: "Sports external",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "swimming_pool",
        fieldDisplayName: "Swimming pool",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "clubhouse",
        fieldDisplayName: "Clubhouse",
        fieldDescription: " Provide relevant details.",
      },
      {
        dbField: "kids",
        fieldDisplayName: "Kids",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "parks",
        fieldDisplayName: "Parks",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "parking",
        fieldDisplayName: "Parking",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Provide relevant details.",
      },
    ],
    team: [
      {
        dbField: "partners",
        fieldDisplayName: "Partners",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "experience",
        fieldDisplayName: "Experience",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Provide relevant details.",
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
    },
    land: {},
  };

  return {
    fieldRules,
    projectFields: projectStructure,
  };
}
