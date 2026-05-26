import { z } from "zod";

const questionSourceSchema = z.object({
  question_bank: z.string().min(1, "Question bank is required"),
  count: z.coerce.number().min(1, "Count must be at least 1"),
});

export const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  language: z.string().min(1, "Language is required"),
  question_sources: z
    .array(questionSourceSchema)
    .min(1, "At least one question source is required"),
  passing_marks: z.coerce.number().min(0, "Passing marks is required"),
  passing_type: z.enum(["marks", "percentage"]).default("percentage"),
  duration: z.coerce.number().min(1, "Duration (minutes) is required"),
});
