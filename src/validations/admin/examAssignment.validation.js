import { z } from "zod";

export const examAssignmentSchema = z
  .object({
    exam: z.string().min(1, "Exam is required"),
    program: z.string().optional().nullable(),
    intake: z.string().optional().nullable(),
    batch: z.string().optional().nullable(),
    prerequisite_components: z.array(z.string()).optional().default([]),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  });
