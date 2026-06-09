import { z } from "zod";

export const questionBankSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  lang: z.string().min(1, "Language is required"),
});
