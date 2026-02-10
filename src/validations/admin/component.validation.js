import { z } from "zod";

const baseComponentSchema = z.object({
  type: z.enum(["module", "app", "resource", "exam"], {
    errorMap: () => ({ message: "Component type is required" }),
  }),
  name: z.string().min(1, "Component name is required"),
  year: z.coerce
    .number({ invalid_type_error: "Year must be a number" })
    .min(1, "Year must be at least 1")
    .max(10, "Year must be at most 10"),
  status: z.boolean(),
  files: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
});

const moduleComponentSchema = baseComponentSchema.extend({
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0, "Amount must be 0 or greater"),
  module_number: z.coerce
    .number({ invalid_type_error: "Module number must be a number" })
    .min(1, "Module number must be at least 1"),
});

const appComponentSchema = baseComponentSchema.extend({
  submission_deadline: z.string().min(1, "Submission deadline is required"),
  instruction: z.string().min(1, "Instruction is required"),
  instruction_video: z.string().min(1, "Instruction video URL is required").url("Please enter a valid URL"),
  submissions: z.object({
    case_studies: z.boolean(),
    essays: z.boolean(),
    internships: z.boolean(),
  }),
});

const resourceComponentSchema = baseComponentSchema;
const examComponentSchema = baseComponentSchema;

export const componentSchema = z.discriminatedUnion("type", [
  moduleComponentSchema.extend({ type: z.literal("module") }),
  appComponentSchema.extend({ type: z.literal("app") }),
  resourceComponentSchema.extend({ type: z.literal("resource") }),
  examComponentSchema.extend({ type: z.literal("exam") }),
]);