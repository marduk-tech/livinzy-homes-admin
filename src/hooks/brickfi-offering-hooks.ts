import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import {
  createBrickfiOffering,
  getBrickfiOfferingTickets,
  getBrickfiOfferings,
  updateBrickfiOffering,
} from "../libs/api/brickfi-offerings";
import { errorMessage } from "../libs/api-error";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import {
  BrickfiOfferingInput,
  BrickfiOfferingUpdate,
} from "../types/brickfi-offering";

const invalidateOfferings = () =>
  queryClient.invalidateQueries({ queryKey: [queryKeys.getBrickfiOfferings] });

export function useGetBrickfiOfferings() {
  return useQuery({
    queryKey: [queryKeys.getBrickfiOfferings],
    queryFn: () => getBrickfiOfferings(),
  });
}

export function useCreateBrickfiOfferingMutation() {
  return useMutation({
    mutationFn: (offering: BrickfiOfferingInput) =>
      createBrickfiOffering(offering),
    onSuccess: () => {
      notification.success({ message: "Offering created" });
    },
    // e.g. a duplicate key, or a CTA missing its flowKey
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to create the offering"),
      });
    },
    onSettled: invalidateOfferings,
  });
}

export function useUpdateBrickfiOfferingMutation() {
  return useMutation({
    mutationFn: ({ id, update }: { id: string; update: BrickfiOfferingUpdate }) =>
      updateBrickfiOffering(id, update),
    onSuccess: () => {
      notification.success({ message: "Offering updated" });
    },
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to update the offering"),
      });
    },
    onSettled: invalidateOfferings,
  });
}

export function useGetBrickfiOfferingTickets() {
  return useQuery({
    queryKey: [queryKeys.getBrickfiOfferingTickets],
    queryFn: () => getBrickfiOfferingTickets(),
  });
}
