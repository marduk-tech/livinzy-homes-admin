import { InputNumber } from "antd";
import type { AmbakMasterOption } from "../../libs/api/ambak";

// Shared by the offers form and the create lead dialog.

export const YES_NO = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

// Only Ambak's own master data - no fallback list, since a made-up id would
// be accepted by the form and rejected (or misread) by Ambak. Empty until
// master data loads; the forms block submitting until then.
export const masterOptions = (list: AmbakMasterOption[] | undefined) =>
  (list ?? []).map((o) => ({
    value: Number(o.id),
    label: o.label,
  }));

export const MASTERDATA_ERROR_TITLE = "Couldn't load Ambak master data - try again before submitting";

export const formatINR = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "-";
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : String(value);
};

export const amountInput =<InputNumber prefix="₹" min={0} style={{ width: "100%" }} />;

// Leave unset optional fields out rather than sending null/"".
export const compact = <T extends object>(obj: T): T =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "")) as T;

// The form tab holding the first invalid field, so a failed submit can jump to it.
export const sectionOfFirstError = (
  sectionFields: Record<string, string[]>,
  errorFields: { name: (string | number)[] }[],
) => {
  const first = String(errorFields[0]?.name[0] ?? "");
  return Object.keys(sectionFields).find((k) => sectionFields[k].includes(first));
};
