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
    type: z.string().optional(),
  })).optional(),
  resources: z.array(
    z.object({
      type: z.enum(["file", "link"]),
      name: z.string().optional(),
      url: z.string().optional(),
      file: z.any().optional(),
    }).superRefine((data, ctx) => {
      if (data.type === "file" && !data.file && !data.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "File is required",
          path: ["file"],
        });
      }
      if (data.type === "link" && !data.url) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "URL is required",
          path: ["url"],
        });
      }
    })
  ).optional(),
});

const moduleComponentSchema = baseComponentSchema.extend({
  is_free: z.boolean().optional(),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a number" })
    .min(0, "Amount must be at least 0"),
  module_number: z.coerce
    .number({ invalid_type_error: "Module number must be a number" })
    .min(1, "Module number must be at least 1"),
});

const appComponentSchema = baseComponentSchema.extend({
  name: z.string().optional().or(z.literal("")),
  submission_deadline: z.string().min(1, "Submission deadline is required"),
  instruction: z.string().min(1, "Instruction is required"),
  instruction_video: z.string().optional().or(z.literal("")),
  submissions: z.object({
    case_studies: z.boolean(),
    essays: z.boolean(),
    internships: z.boolean(),
  }),
});

const resourceComponentSchema = baseComponentSchema;
const examComponentSchema = z.object({
  type: z.literal("exam"),
  linked_module: z.string().min(1, "Module selection is required"),
  linked_exam: z.string().min(1, "Exam selection is required"),
  status: z.boolean(),
});

export const componentSchema = z.discriminatedUnion("type", [
  moduleComponentSchema.extend({ type: z.literal("module") }),
  appComponentSchema.extend({ type: z.literal("app") }),
  resourceComponentSchema.extend({ type: z.literal("resource") }),
  examComponentSchema,
]).superRefine((data, ctx) => {
  if (data.type === "module" && data.is_free === false && (data.amount === undefined || data.amount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount must be greater than 0",
      path: ["amount"],
    });
  }
});