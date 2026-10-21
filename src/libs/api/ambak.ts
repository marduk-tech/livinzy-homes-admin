import { axiosApiInstance } from "../axios-api-Instance";

// Proxied through services (/third-party/ambak/*) so the Ambak API key stays server-side.
// See the Ambak Partner API Integration Guide (Step 1 master data, Step 2 offers).

export interface AmbakMasterOption {
  id: string; // master IDs come back as strings, send them as numbers
  label: string;
}

export interface AmbakMasterdata {
  loan_type?: AmbakMasterOption[];
  profession?: AmbakMasterOption[];
}

type YesNo = "Yes" | "No";

// The guide lists the offers fields flat, but the endpoint validates a nested
// body (worked out against it, Oct 2026): loan_type as "1"/"2" at the top,
// applicant/income fields in lead_details, property fields in property_details
// (required for LAP, with property_usage), co-applicants as an array, and dob
// under customer. Field names match the API exactly, including casing/spelling.
export interface AmbakOffersRequest {
  loan_type: "1" | "2";
  lead_details: {
    loan_amount: number;
    cibil_score: number;
    max_tenure: number;
    monthly_salary: number;
    gross_monthly_salary: number;
    profession: number;
    Fullfilment_type: "Self";
    existing_emi_amount?: number;
    emi_ending_six_month?: number;
    is_property_decided?: YesNo;
    is_additional_income?: YesNo;
    rent_amount?: number;
    monthly_incentives_amount?: number;
    annual_bonus_amount?: number;
    monthly_reimbursements_amount?: number;
    payment_mode?: string;
  };
  property_details?: {
    expected_market_value?: number; // HL
    property_city?: number; // HL
    Property_city?: number; // LAP
    property_type?: string; // HL
    property_sub_type?: string;
    agreement_type?: string; // HL
    property_usage?: string; // LAP, required
    occupancy_status?: string; // LAP
  };
  co_applicant?: {
    is_co_additional_income: YesNo;
    ca_profession?: number;
    ca_gross_monthly_salary?: number;
  }[];
  customer: { dob: string }; // dd/mm/yyyy
}

// Field names (and their misspellings) are Ambak's. Fees other than
// processingFee come back as display text ("Rs.9,500 + GST", "Waived", "").
export interface AmbakOffer {
  bankName: string;
  bankId?: number;
  bankLogo?: string;
  eligibalLoanAmount?: number;
  maxEligibalLoanAmount?: number;
  minAmountCapping?: number | string;
  monthlyEMI?: number;
  minRoi?: number;
  maxRoi?: number;
  maxTenure?: number;
  finalMaxTenure?: number;
  netMonthlyIncome?: number;
  propValue?: number;
  calculationBase?: string; // "Income based" / "Property based"
  is_apf_approved?: boolean;
  uspData?: { logo?: string; usp_text: string }[];
  roiConcessions?: { appliedConcessions?: { key: string; label: string; concession: number }[] } | null;
  processingFee?: number | string;
  processingText?: string;
  login_fee?: string;
  ac_handling_charge?: string;
  legal_technical_fee?: string;
  e_stamp_charge?: string;
  due_diligence_charge?: string;
  CERSAI_charge?: string;
  MODT_charge?: string;
  NOI_charge?: string;
  foreclosure_charge?: string;
}

export const getAmbakMasterdata = async (): Promise<AmbakMasterdata> => {
  const response = await axiosApiInstance.get<AmbakMasterdata>("/third-party/ambak/masterdata");
  return response.data;
};

// Response is { status, statusText, message, data: AmbakOffer[] }.
export const getAmbakOffers = async (payload: AmbakOffersRequest): Promise<AmbakOffer[]> => {
  const response = await axiosApiInstance.post<{ data?: AmbakOffer[] }>("/third-party/ambak/offers", payload);
  return response.data.data ?? [];
};
