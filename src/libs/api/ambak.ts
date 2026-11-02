import { axiosApiInstance } from "../axios-api-Instance";

// Proxied through services (/third-party/ambak/*) so the Ambak API key stays server-side.
// See the Ambak Partner API Integration Guide (Step 1 master data, Step 2 offers, Step 3 lead creation).

export interface AmbakMasterOption {
  id: string; // master IDs come back as strings, send them as numbers
  label: string;
}

// Every list the offers and lead forms use - getAmbakMasterdata fails unless
// each one came back non-empty, so the forms never offer made-up ids.
const MASTERDATA_LISTS = [
  "loan_type",
  "loan_sub_type",
  "profession",
  "company_type",
  "salary_credit_mode",
  "property_type",
  "usage_type",
  "agreement_type",
] as const;

export type AmbakMasterdata = Record<(typeof MASTERDATA_LISTS)[number], AmbakMasterOption[]>;

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

// create_lead's leadParams minus source/sub_source, which services adds. Master
// fields are ids; services quotes the string fields, including amounts.
export interface AmbakLeadRequest {
  loan_type: number;
  loan_sub_type?: number; // omit = fresh loan, 1 = BT, 2 = Top-up
  customer: {
    first_name: string; // letters only
    last_name: string;
    mobile: string; // 10 digits, no +91 / 0
    email: string;
    dob?: string; // YYYY-MM-DD (offers takes dd/mm/yyyy)
    gender?: string;
    pancard_no?: string;
    aadhar_no?: string;
    cra_city?: number;
    cra_pincode?: string;
  };
  lead_details?: {
    loan_amount?: number;
    tenure?: number;
    profession?: number;
    annual_income?: number;
    company_name?: string;
    company_type?: number;
    salary_credit_mode?: number;
    existing_emi?: number;
    cibil_score?: number;
    existing_bank_id?: number;
    is_property_identified?: "1" | "0";
    property_pincode?: string;
    property_type?: number;
    property_value?: number;
    usage_type?: number;
    agreement_type?: number;
  };
  lead_bt_info?: {
    previous_loan_amount?: number;
    previous_outstanding_amount?: number;
    previous_existing_emi?: number;
    previous_tenure?: number;
    previous_loan_date?: string; // ISO 8601
    previous_roi?: number;
    loan_topup_required_amount?: number;
  };
}

// id 0 means no lead was created; is_duplicate true is final, don't retry.
export interface AmbakLeadResult {
  id: number;
  is_duplicate: boolean | null;
  partner_id: number | null;
  message: string | null;
  // Added by services for a created lead: the user (matched by mobile, or
  // created) it saved leadTrail.thirdPartyAmbak.leadId on, or why that failed.
  user?: { id: string; created: boolean };
  userError?: string;
}

export const getAmbakMasterdata = async (): Promise<AmbakMasterdata> => {
  const response = await axiosApiInstance.get<Partial<AmbakMasterdata>>("/third-party/ambak/masterdata");
  const missing = MASTERDATA_LISTS.filter((list) => !response.data?.[list]?.length);
  if (missing.length) {
    throw new Error(`Ambak master data is missing: ${missing.join(", ")}`);
  }
  return response.data as AmbakMasterdata;
};

// Response is { status, statusText, message, data: AmbakOffer[] }.
export const getAmbakOffers = async (payload: AmbakOffersRequest): Promise<AmbakOffer[]> => {
  const response = await axiosApiInstance.post<{ data?: AmbakOffer[] }>("/third-party/ambak/offers", payload);
  return response.data.data ?? [];
};

export const createAmbakLead = async (payload: AmbakLeadRequest): Promise<AmbakLeadResult> => {
  const response = await axiosApiInstance.post<AmbakLeadResult>("/third-party/ambak/leads", payload);
  return response.data;
};

// get_lead_status_info_journey (Step 4 of the guide). Dates are ISO 8601 in
// UTC; amounts are strings except payout.amount. Most blocks can be null until
// the case reaches that stage.
export interface AmbakVerificationResult {
  date: string | null;
  verification_status: string | null;
  verification_failed_reason: string | null;
}

export interface AmbakLeadStatus {
  lead_id: number;
  customer_id: number | null;
  loan_type: string | null; // "HL" / "LAP"
  last_updated_at: string | null;
  status_updates: {
    stage_status: { stage: string | null; status: string | null; sub_status: string | null; remarks: string | null } | null;
    login: { login_id: string | null; login_date: string | null; login_amount: string | null } | null;
    sanction: { sanction_id: string | null; sanction_date: string | null; sanction_amount: string | null } | null;
    disbursal:
      | {
          tranch_id: number;
          disbursed_id: string | null;
          disbursed_date: string | null;
          disbursed_amount: string | null;
        }[]
      | null;
    verification: {
      status: { login_verification: string | null; sanction_verification: string | null } | null;
      reason: { login_verification: string | null; sanction_verification: string | null } | null;
    } | null;
    underwriting_updates: {
      checklists:
        | {
            checklist_name: string | null;
            checklist_status: string | null; // Initiated / Query Raised / Done
            last_updated_at: string | null;
            query: { query_type: string | null; raised_at: string | null } | null;
          }[]
        | null;
    } | null;
    lead_closure: { closure_type: string | null; lost_reason: string | null; new_lead_id: number | null } | null;
    post_disbursal_updates: {
      encashment: AmbakVerificationResult | null;
      pdd: AmbakVerificationResult | null;
      payout: {
        amount: number | null;
        currency: string | null;
        date: string | null;
        expected_date: string | null;
        status: string | null;
      } | null;
    } | null;
  } | null;
  details_updates: {
    employment_type: string | null;
    document_collection_status: {
      dre_run: boolean | null; // false = DRE not run yet; both lists are null
      documents_required: { document_name: string | null; document_id: number | string | null }[] | null;
      documents_pending:
        | {
            id: number;
            doc_id: number | string | null;
            document_status: string | null;
            coapplicant_id: number | null;
            tranche_id: number | null;
            updated_date: string | null;
            child_name: string | null;
            parent_name: string | null;
          }[]
        | null;
    } | null;
  } | null;
}

export const getAmbakLeadStatus = async (leadId: number): Promise<AmbakLeadStatus> => {
  const response = await axiosApiInstance.get<AmbakLeadStatus>(`/third-party/ambak/leads/${leadId}/status`);
  return response.data;
};
