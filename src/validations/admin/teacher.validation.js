import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

export const teacherSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(20, "First name must not exceed 20 characters")
    .regex(/^[\p{L}\p{M}\s'-]+$/u, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .refine((name) => name.trim().length > 0, "First name cannot be just whitespace")
    .transform((name) => name.trim()),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(20, "Last name must not exceed 20 characters")
    .regex(/^[\p{L}\p{M}\s'-]+$/u, "Last name can only contain letters, spaces, hyphens, and apostrophes")
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
    .refine((phone) => {
      if (!phone) return false;
      return isValidPhoneNumber(phone);
    }, "Please enter a valid phone number"),
  
  // Address Section
  address: z
    .string()
    .min(1, "Address is required")
    .max(100, "Address must not exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s\-\'\.\,\u00C0-\u017F]+$/, "Address contains invalid characters"),
  postal_code: z
    .string()
    .min(1, "Postal Code is required")
    .max(20, "Postal Code must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9\-]+$/, "Postal Code can only contain alphanumeric characters and hyphens"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),

  // Teaching Preferences
  location: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).min(1, "At least one preferred city is required"),
  language: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).min(1, "At least one language of instruction is required"),

  academic_degree: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).min(1, "At least one academic degree is required"),
  teacher_role: z.string().min(1, "Lecturer role is required"),

  // Optional master-data backed fields
  mother_tongue: z.string().optional(),
  contract_type: z.string().optional(),
  department: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).optional(),
  region: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).optional(),
  teaching_regions: z.array(z.object({
    _id: z.string(),
    name: z.string()
  })).optional(),

  iao_employment_start_date: z.string().min(1, "Employment start date is required"),
  status: z.boolean().optional(),
});