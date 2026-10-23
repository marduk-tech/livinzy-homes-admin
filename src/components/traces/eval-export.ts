import { message } from "antd";
import { exportEvalCases } from "../../libs/api/brickchat";
import { errorMessage } from "../../libs/api-error";

export const downloadEvalCases = async () => {
  try {
    const cases = await exportEvalCases();
    const blob = new Blob([`${JSON.stringify(cases, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "queries.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    message.error(errorMessage(error, "Failed to export cases"));
  }
};
