import { z } from "zod";

export const thesisSchema = z.object({
  name: z.string().min(1, "Thesis name is required"),
  academic: z
    .array(z.any())
    .min(1, "At least one academic year is required"),
  program_type: z.string().optional().default(""),
  program: z
    .array(z.any())
    .min(1, "At least one programme is required"),
  price: z.union([
    z
      .string()
      .min(1, "Price is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 0,
        "Price must be a valid number (min 0)"
      ),
    z.number().min(0, "Price must be at least 0"),
  ]),
  current_year: z.union([
    z
      .string()
      .min(1, "Study year is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 1,
        "Study year must be at least 1"
      ),
    z.number().min(1, "Study year must be at least 1"),
  ]),
  description: z.string().optional().default(""),
  status: z.boolean().optional().default(true),
});
