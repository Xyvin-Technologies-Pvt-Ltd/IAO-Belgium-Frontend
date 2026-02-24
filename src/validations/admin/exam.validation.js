import { z } from "zod";

const questionSourceSchema = z.object({
  question_bank: z.string().min(1, "Question bank is required"),
  count: z.coerce.number().min(1, "Count must be at least 1"),
});

const examSettingsSchema = z.object({
  randomize_questions: z.boolean().default(true),
  randomize_options: z.boolean().default(true),
  show_result_immediately: z.boolean().default(false),
  show_correct_answers: z.boolean().default(false),
  allow_review: z.boolean().default(false),
  max_attempts: z.coerce.number().min(1).default(1),
  auto_submit_on_timeout: z.boolean().default(true),
  question_navigation: z.enum(["sequential", "free"]).default("free"),
});

export const examSchema = z.object({
  name: z.string().min(1, "Exam name is required"),
  description: z.string().optional(),
  instructions: z.string().optional(),
  question_sources: z
    .array(questionSourceSchema)
    .min(1, "At least one question source is required"),
  marks_per_question: z.coerce.number().min(0).default(1),
  negative_marks_per_question: z.coerce.number().min(0).default(0),
  passing_marks: z.coerce.number().min(0, "Passing marks is required"),
  passing_type: z.enum(["marks", "percentage"]).default("percentage"),
  duration: z.coerce.number().min(1, "Duration (minutes) is required"),
  settings: examSettingsSchema.optional(),
});
