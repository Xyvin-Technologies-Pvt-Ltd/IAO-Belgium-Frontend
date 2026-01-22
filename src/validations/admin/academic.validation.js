import { z } from "zod";

export const academicSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .trim(),
  
  registartion_start_date: z
    .string()
    .min(1, "Registration start date is required")
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Invalid date format"),
  
  registartion_end_date: z
    .string()
    .min(1, "Registration end date is required")
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, "Invalid date format"),
  
  status: z.boolean().default(true),
}).refine((data) => {
  const startDate = new Date(data.registartion_start_date);
  const endDate = new Date(data.registartion_end_date);
  return endDate > startDate;
}, {
  message: "Registration end date must be after start date",
  path: ["registartion_end_date"],
});