import { FormInstance } from "antd";
import { ProjectField } from "../types/Project";

export function calculateProgress(
  structure: any,
  data: any,
  checkMustHave: boolean
) {
  let totalFields = 0;
  let filledFields = 0;

  const skipSection =
    data.metadata.homeType == "farmland" ? "unitDetails" : "plots";

  // loop over each section in the structure
  for (const sectionKey in structure) {
    if (sectionKey !== skipSection) {
      const fields = structure[sectionKey];

      // loop over each field in the section
      for (const field of fields) {
        if (checkMustHave ? field.mustHave : !field.mustHave) {
          totalFields++;
          if (data[sectionKey] && data[sectionKey][field.dbField]) {
            filledFields++;
          }
        }
      }
    }
  }

  const progress = totalFields ? (filledFields / totalFields) * 100 : 0;
  return parseFloat(progress.toFixed(0));
}

interface FieldStatus {
  totalVisibleFields: number;
  filledFieldsCount: number;
  mustHaveFieldsCount: number;
  filledMustHaveFieldsCount: number;
  badgeStatus: "success" | "warning" | "error";
}

export const calculateFieldStatus = (
  fields: ProjectField[],
  key: string,
  form: FormInstance
): FieldStatus => {
  const isNotOthersField = (field: ProjectField) => field.dbField !== "others";

  const totalVisibleFields = fields.filter(
    (field) => !field.hide && isNotOthersField(field)
  ).length;

  const filledFieldsCount = fields.reduce(
    (count: number, field: ProjectField) => {
      if (field.hide || !isNotOthersField(field)) return count;

      const fieldValue = form.getFieldValue(
        [
          key,
          Array.isArray(field.dbField) ? field.dbField : [field.dbField],
        ].flat()
      );

      const isFilled =
        fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
      return isFilled ? count + 1 : count;
    },
    0
  );

  const mustHaveFieldsCount = fields.filter(
    (field) => field.mustHave && !field.hide && isNotOthersField(field)
  ).length;

  const filledMustHaveFieldsCount = fields.reduce(
    (count: number, field: ProjectField) => {
      if (field.hide || !field.mustHave || !isNotOthersField(field))
        return count;

      const fieldValue = form.getFieldValue(
        [
          key,
          Array.isArray(field.dbField) ? field.dbField : [field.dbField],
        ].flat()
      );

      const isFilled =
        fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
      return isFilled ? count + 1 : count;
    },
    0
  );

  let badgeStatus: "success" | "warning" | "error" = "error";
  if (filledMustHaveFieldsCount === mustHaveFieldsCount) {
    badgeStatus =
      filledFieldsCount === totalVisibleFields ? "success" : "warning";
  }

  return {
    totalVisibleFields,
    filledFieldsCount,
    mustHaveFieldsCount,
    filledMustHaveFieldsCount,
    badgeStatus,
  };
};
