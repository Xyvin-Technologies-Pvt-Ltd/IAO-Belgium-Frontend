import { z } from "zod";

export const contractSchema = z.object({
  name: z.string().min(1, "Contract name is required").max(200),
  file: z.string().min(1, "Contract file is required"),
  program_type: z.string().min(1, "Program type is required"),
  language: z.string().min(1, "Language is required"),
  contract_type: z.enum(["student_contract", "internal_regulations"], {
    required_error: "Contract type is required",
  }),
});
