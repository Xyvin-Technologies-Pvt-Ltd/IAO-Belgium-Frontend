import { z } from "zod";

const timeSchema = z
  .object({
    start: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:mm (24-hour) format"),
    end: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:mm (24-hour) format"),
  })
  .refine(
    (data) => {
      if (!data.start || !data.end) return true;
      const [startHour, startMin] = data.start.split(":").map(Number);
      const [endHour, endMin] = data.end.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
      path: ["end"],
    }
  );

export const citySchema = z
  .object({
    name: z
      .string()
      .min(1, "City name is required")
      .min(2, "City name must be at least 2 characters")
      .max(100, "City name must be at most 100 characters")
      .regex(/^[\p{L}\p{M}\s\-'\.]+$/u, "City name can only contain letters, spaces, hyphens, apostrophes, and periods"),
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
  })
  .refine(
    (data) => {
      const timeStrings = data.times.map((time) => `${time.start}-${time.end}`);
      const uniqueTimes = new Set(timeStrings);
      return uniqueTimes.size === timeStrings.length;
    },
    {
      message: "Cannot add duplicate time slots",
      path: ["times"],
    }
  )
  .refine(
    (data) => {
      const venues = data.venue.filter((v) => v.trim() !== "");
      const uniqueVenues = new Set(venues);
      return uniqueVenues.size === venues.length;
    },
    {
      message: "Cannot add duplicate venues",
      path: ["venue"],
    }
  );