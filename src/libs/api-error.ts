import { AxiosError } from "axios";

// The script server shapes every error as { error }, the services API as
// { message } - take whichever is there before falling back.
export const errorMessage = (error: unknown, fallback: string): string => {
  const err = error as AxiosError<{ error?: string; message?: string }>;
  return err.response?.data?.error || err.response?.data?.message || fallback;
};
