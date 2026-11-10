import { useMutation, useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import {
  createBrickfiOffering,
  getBrickfiOfferingTickets,
  getBrickfiOfferings,
  updateBrickfiOffering,
  updateBrickfiOfferingTicket,
} from "../libs/api/brickfi-offerings";
import { errorMessage } from "../libs/api-error";
import { queryKeys } from "../libs/constants";
import { queryClient } from "../libs/query-client";
import {
  BrickfiOfferingInput,
  BrickfiOfferingTicketUpdate,
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

// status change and/or reply - reaches the user's thread once the ticket is
// closed
export function useUpdateBrickfiOfferingTicketMutation() {
  return useMutation({
    mutationFn: ({
      ticketId,
      update,
    }: {
      ticketId: string;
      update: BrickfiOfferingTicketUpdate;
    }) => updateBrickfiOfferingTicket(ticketId, update),
    onSuccess: (ticket, { update }) => {
      // saved, but it couldn't reach the user - it goes out with the
      // ticket's next update
      if (ticket?.threadPosted === false) {
        notification.warning({
          message: update.reply ? "Reply saved" : "Status updated",
          description: ticket.threadId
            ? "Couldn't post it to the user's chat right now - it will go out with this ticket's next update."
            : "Couldn't reach the user by WhatsApp or email right now - it will go out with this ticket's next update.",
        });
        return;
      }
      if (update.reply && ticket?.status !== "closed") {
        notification.success({
          message: "Reply saved",
          description: ticket?.threadId
            ? "It goes to the user's chat when this ticket is closed."
            : "It goes to the user by WhatsApp and email, as written, when this ticket is closed.",
        });
        return;
      }
      notification.success({
        message: update.reply ? "Reply sent" : "Status updated",
      });
    },
    onError: (error) => {
      notification.error({
        message: errorMessage(error, "Failed to update the ticket"),
      });
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: [queryKeys.getBrickfiOfferingTickets],
      }),
  });
}
