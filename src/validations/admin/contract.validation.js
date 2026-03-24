import { z } from "zod";

export const contractSchema = z.object({
  name: z.string().min(1, "Contract name is required").max(200),
  file: z.string().min(1, "Contract file is required"),
});
