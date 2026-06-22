import { z } from "zod";

export const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  program_code: z.string().min(1, "Program code is required").max(10, "Program code must be at most 10 characters"),
  program_type: z.enum([
    "Master of Science",
    "Lateral Entry Master of Science", 
    "Diploma",
    "Manual Therapie",
    "Post Academic Module"
  ], {
    errorMap: () => ({ message: "Please select a valid program type" }),
  }),
  year: z.coerce
    .number({ invalid_type_error: "Duration must be a number" })
    .min(1, "Duration must be at least 1")
    .max(1000, "Duration must be at most 1000"),
  duration_unit: z.enum(["years", "months", "weeks", "days"], {
    errorMap: () => ({ message: "Please select a valid duration unit" }),
  }).optional().default("years"),
  language: z.string().min(1, "Language is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  is_online: z.boolean().optional().default(false),
  document_required: z.boolean().optional().default(true),
});
