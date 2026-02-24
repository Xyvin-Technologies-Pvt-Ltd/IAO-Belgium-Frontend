import { z } from "zod";

const optionSchema = z.object({
  option_text: z.string().min(1, "Option text is required"),
  option_image: z.string().optional(),
  is_correct: z.boolean(),
});

export const questionSchema = z
  .object({
    question_text: z.string().min(1, "Question text is required"),
    question_image: z.string().optional(),
    options: z
      .array(optionSchema)
      .min(2, "At least 2 options are required")
      .max(6, "Maximum 6 options allowed")
      .refine(
        (opts) => opts.filter((o) => o.is_correct).length === 1,
        "Exactly one option must be marked as correct",
      ),
    explanation: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
    marks: z.coerce.number().min(0).default(1),
    tags: z.array(z.string()).optional().default([]),
  });
