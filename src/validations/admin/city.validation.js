import { z } from "zod";

export const citySchema = z.object({
  name: z
    .string()
    .min(1, "City name is required")
    .min(2, "City name must be at least 2 characters")
    .max(100, "City name must be at most 100 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "City name can only contain letters, spaces, hyphens, apostrophes, and periods"),
  country: z
    .string()
    .min(1, "Country is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid country selection"),
});