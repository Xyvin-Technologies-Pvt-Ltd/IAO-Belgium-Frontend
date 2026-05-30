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
  passing_marks: z.coerce.number().optional(),
  passing_percentage: z.coerce.number().optional(),
  passing_type: z.enum(["marks", "percentage"]).default("percentage"),
  duration: z.coerce.number().min(1, "Duration (minutes) is required"),
}).refine((data) => {
  if (data.passing_type === "marks") {
    return data.passing_marks !== undefined && !isNaN(data.passing_marks) && data.passing_marks >= 0;
  }
  return true;
}, {
  message: "Passing marks is required",
  path: ["passing_marks"],
}).refine((data) => {
  if (data.passing_type === "percentage") {
    return data.passing_percentage !== undefined && !isNaN(data.passing_percentage) && data.passing_percentage >= 0 && data.passing_percentage <= 100;
  }
  return true;
}, {
  message: "Passing percentage must be between 0 and 100",
  path: ["passing_percentage"],
});
