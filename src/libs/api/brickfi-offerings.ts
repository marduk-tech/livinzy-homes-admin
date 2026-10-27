import {
  BrickfiOffering,
  BrickfiOfferingInput,
  BrickfiOfferingTicket,
  BrickfiOfferingUpdate,
} from "../../types/brickfi-offering";
import { axiosApiInstance } from "../axios-api-Instance";

export const getBrickfiOfferings = async (): Promise<BrickfiOffering[]> => {
  const { data } = await axiosApiInstance.get<BrickfiOffering[]>(
    `/brickfi-offerings`,
  );
  return data;
};

export const createBrickfiOffering = async (
  offering: BrickfiOfferingInput,
): Promise<BrickfiOffering> => {
  const { data } = await axiosApiInstance.post<BrickfiOffering>(
    `/brickfi-offerings`,
    offering,
  );
  return data;
};

export const updateBrickfiOffering = async (
  id: string,
  update: BrickfiOfferingUpdate,
): Promise<BrickfiOffering> => {
  const { data } = await axiosApiInstance.patch<BrickfiOffering>(
    `/brickfi-offerings/${id}`,
    update,
  );
  return data;
};

export const getBrickfiOfferingTickets = async (): Promise<
  BrickfiOfferingTicket[]
> => {
  const { data } = await axiosApiInstance.get<BrickfiOfferingTicket[]>(
    `/brickfi-offerings/tickets`,
  );
  return data;
};
