export const nestedPropertyAccessor = (
  record: any,
  keys: string | string[]
) => {
  if (Array.isArray(keys)) {
    return keys.reduce(
      (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
      record
    );
  } else {
    return record[keys];
  }
};
