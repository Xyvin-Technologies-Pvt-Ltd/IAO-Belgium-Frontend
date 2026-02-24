import { z } from "zod";

export const questionBankSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});
