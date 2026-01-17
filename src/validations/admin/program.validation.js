import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().min(1, "Description is required"),
  program_type: z.enum(["MSc", "BSc"], {
    errorMap: () => ({ message: "Program type must be MSc or BSc" }),
  }),
  year: z.coerce
    .number({ invalid_type_error: "Year must be a number" })
    .min(1, "Year must be at least 1")
    .max(10, "Year must be at most 10"),
  language: z.string().min(1, "Language is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
});
