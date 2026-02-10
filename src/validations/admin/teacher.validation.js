import { z } from "zod";

export const teacherSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(20, "First name must not exceed 20 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .refine((name) => name.trim().length > 0, "First name cannot be just whitespace")
    .transform((name) => name.trim()),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(20, "Last name must not exceed 20 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes")
    .refine((name) => name.trim().length > 0, "Last name cannot be just whitespace")
    .transform((name) => name.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .transform((email) => email.trim().toLowerCase()),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  country: z.string().min(1, "Country is required"),
  location: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).min(1, "At least one location is required"),
  language: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).min(1, "At least one language is required"),
  academic_degree: z.string().min(1, "Academic degree is required"),
  teacher_role: z.string().min(1, "Teacher role is required"),
  iao_employment_start_date: z.string().min(1, "Employment start date is required"),
  status: z.boolean().optional(),
});