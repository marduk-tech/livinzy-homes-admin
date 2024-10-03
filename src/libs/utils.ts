export function calculateProgress(
  structure: any,
  data: any,
  checkMustHave: boolean
) {
  let totalFields = 0;
  let filledFields = 0;

  // loop over each section in the structure
  for (const sectionKey in structure) {
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

  const progress = totalFields ? (filledFields / totalFields) * 100 : 0;
  return parseFloat(progress.toFixed(0));
}
