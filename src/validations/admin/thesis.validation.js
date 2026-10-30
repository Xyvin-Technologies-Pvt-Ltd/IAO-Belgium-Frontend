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
    z.array(z.any()).min(1, "At least one study year is required"),
    z.coerce.number().min(1, "Study year must be at least 1"),
    z
      .string()
      .min(1, "Study year is required")
      .refine(
        (val) => !isNaN(Number(val)) && Number(val) >= 1,
        "Study year must be at least 1"
      ),
  ]),
  description: z.string().optional().default(""),
  attachments: z
    .array(
      z.object({
        name: z.string().min(1, "Document name is required"),
        file_url: z.string().min(1, "File URL is required"),
        filename: z.string().optional().nullable(),
        file_type: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),
  status: z.boolean().optional().default(true),
});
