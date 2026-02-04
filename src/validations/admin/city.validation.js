import { z } from "zod";

const timeSchema = z.object({
  start: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm (24-hour) format"),
  end: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm (24-hour) format"),
});

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
  times: z
    .array(timeSchema)
    .min(1, "At least one time slot is required"),
  venue: z
    .array(z.string().min(1, "Venue name cannot be empty"))
    .min(1, "At least one venue is required"),
});