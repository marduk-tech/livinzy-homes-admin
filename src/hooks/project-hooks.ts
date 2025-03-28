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
            api.updateProject(project._id, { ui: response.data });
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

      // Generate UI in background after project update
      api
        .generateProjectUI(projectId, "")
        .then((response) => {
          if (response.data) {
            // Update project with generated UI
            api.updateProject(projectId, { ui: response.data });
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
    metadata: [
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
        dbField: "developerId",
        fieldDisplayName: "Developer/Builder",
        fieldDescription: "Select the developer/builder for this project",
        type: "single_select",
        options: developers.map((developer) => ({
          label: developer.name,
          value: developer._id,
        })),
      },
      {
        dbField: "website",
        fieldDisplayName: "Website",
        fieldDescription: "Website for the project.",
      },
      {
        dbField: "company",
        mustHave: true,
        fieldDisplayName: "Company",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "address",
        fieldDisplayName: "Address",
        fieldDescription: "The physical address of the project.",
      },
      {
        dbField: "marketing_copy",
        fieldDisplayName: "Marketing Copy",
        fieldDescription: "Any raw marketing copy provided",
      },
      {
        dbField: "contactNumber",
        fieldDisplayName: "Contact Number",
        fieldDescription: "Enter multiple numbers separated by comma",
        type: "multi_select",
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
        dbField: ["livinzyArea", "subArea"],
        fieldDisplayName: "Sub Area",
        fieldDescription: "Select the sub area where this project is located",
        type: "single_select",
        options: [
          { label: "Near Yelahanka", value: "sub-area-1" },
          { label: "Near Devanahalli", value: "sub-area-2" },
          { label: "Near Dodaballapura", value: "sub-area-3" },
          { label: "Near Airport", value: "sub-area-4" },
          { label: "Near Nandi Hills", value: "sub-area-5" },
          { label: "Near Hebbal", value: "sub-area-6" },
          { label: "Remote North", value: "sub-area-7" },
        ],
      },
    ],
    ui: [
      {
        dbField: "oneLiner",
        fieldDisplayName: "One Liner",
        fieldDescription: "E.g Farmland · Coffee Plantation · Sakleshpur",
      },
      {
        dbField: "description",
        fieldDisplayName: "Description",
        fieldDescription:
          "The description or summary of the project covering the important points at high level.",
      },
      {
        dbField: "projectHighlights",
        fieldDisplayName: "Highlights",
        fieldDescription: "Provide relevant details",
        type: "json",
      },
      {
        dbField: "builderDetails",
        fieldDisplayName: "Builder",
        fieldDescription: "Provide relevant details",
        type: "json",
      },
      {
        dbField: "landDetails",
        fieldDisplayName: "Land",
        fieldDescription: "Provide relevant details",
        type: "json",
      },
      {
        dbField: "statusDetails",
        fieldDisplayName: "Status",
        fieldDescription: "Provide relevant details",
        type: "json",
      },
      {
        dbField: "costingDetails",
        fieldDisplayName: "Cost Summary",
        fieldDescription: "Provide relevant details",
        type: "json",
      },
      {
        dbField: "amenitiesSummary",
        fieldDisplayName: "Amenities Summary",
        fieldDescription: "Provide relevant details",
        type: "json",
      },
    ],
    land: [
      {
        dbField: "total_area",
        fieldDisplayName: "Total area in acres",
        fieldDescription: "The total land area of the project in acres.",
      },
      {
        dbField: "plantation",
        fieldDisplayName: "Plantation",
        fieldDescription:
          "Information about plantation on the project i.e trees, plants etc that grow.",
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
        mustHave: true,
        fieldDescription:
          "Size wise distribution of the plots e.g 100 plots b/w 5000 to 1000, or a detailed distribution",
      },
      {
        dbField: "villa",
        fieldDisplayName: "Villa",
        mustHave: true,
        fieldDescription:
          "Information about the villa that can be constructed on the plot.",
      },
      {
        dbField: "cost_detail",
        fieldDisplayName: "Cost details",
        mustHave: true,
        fieldDescription:
          "Costing information of the plots; per sqft cost, inclusions, plc",
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
        dbField: "payment_plan",
        fieldDisplayName: "Payment plan",
        fieldDescription: "Payment plan if available.",
      },
      {
        dbField: "rental_income",
        fieldDisplayName: "Rental income",
        fieldDescription: "Rental income option if available.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Any other relevant information about the plots.",
      },
    ],
    unitDetails: [
      {
        dbField: "size_style",
        mustHave: true,
        fieldDisplayName: "Size And Style",
        fieldDescription:
          "Details around size of apartments or villas, plot sizes, design type, carpet area etc.",
      },
      {
        dbField: "price",
        mustHave: true,
        fieldDisplayName: "Price",
        fieldDescription: "Details around price, PLC etc.",
      },
      {
        dbField: "building_details",
        fieldDisplayName: "Building Details",
        fieldDescription: "Details like number of towers, floors, lifts etc.",
      },
      {
        dbField: "unit_inclusions",
        fieldDisplayName: "Unit Inclusions",
        fieldDescription: "Details like bathroom fitting, flooring etc.",
      },
      {
        dbField: "payment_plan",
        fieldDisplayName: "Payment Plan",
        fieldDescription: "Any specific details around payment plan.",
      },
      {
        dbField: "rental_income",
        fieldDisplayName: "Rental income",
        fieldDescription:
          "Any specific details around estimated rental income.",
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Any other details.",
      },
    ],
    status: [
      {
        dbField: "launchDate",
        fieldDisplayName: "Launch Status",
        mustHave: true,
        fieldDescription: "Details relevant to launch timeline of the project.",
      },
      {
        dbField: "committedEndDate",
        fieldDisplayName: "Completion Status",
        fieldDescription: "Details regarding committed timeline.",
      },
      {
        dbField: "constructionStatus",
        fieldDisplayName: "Construction Status",
        mustHave: true,
        fieldDescription:
          "Any relevant details about current construction status including approvals received.",
      },
      {
        dbField: "traction",
        mustHave: true,
        fieldDisplayName: "Traction",
        fieldDescription: "Details about plot sold, left or anything else",
      },
      {
        dbField: "approvals",
        fieldDisplayName: "Approvals",
        fieldDescription: "Details about any approvals received by the project",
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
        dbField: "security",
        fieldDisplayName: "Security",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "pathways",
        fieldDisplayName: "Pathways",
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
        fieldDisplayName: "Outdoor sports",
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
        mustHave: true,
        fieldDescription: " Provide relevant details.",
      },
      {
        dbField: "kids",
        fieldDisplayName: "Kids",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "parks",
        fieldDisplayName: "Open area & parks",
        fieldDescription:
          "Information about open area, landscaping, parks or pathways",
      },
      {
        dbField: "parking",
        fieldDisplayName: "Parking",
        fieldDescription: "Provide relevant details.",
        hide: true,
      },
      {
        dbField: "others",
        fieldDisplayName: "Others",
        fieldDescription: "Provide relevant details.",
      },
    ],
    // clickToAction: [
    //   {
    //     dbField: "incentives",
    //     fieldDisplayName: "Incentives",
    //     fieldDescription:
    //       "Just a comma separate list of incentives that will be provided on call/visit",
    //   },

    //   {
    //     dbField: "communicationPreference",
    //     fieldDisplayName: "Communication Preference",
    //     fieldDescription: "Provide relevant details.",
    //     type: "multi_select",
    //     options: CommunicationPreference,
    //   },
    // ],
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

    livIndex: [
      {
        dbField: "landAppreciation",
        fieldDisplayName: "Land Appreciation",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "rentalYield",
        fieldDisplayName: "Rental Yield",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "agriculturalYield",
        fieldDisplayName: "Agricultural Yield",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "surroundingInfra",
        fieldDisplayName: "Surrounding Infrastructure",
        fieldDescription: "Provide relevant details.",
      },
      {
        dbField: "ecoLiving",
        fieldDisplayName: "Eco Living",
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
      homeType: [{ required: true, message: "Please select the Home Type" }],
    },
    land: {},
  };

  return {
    fieldRules,
    projectFields: projectStructure,
  };
}
