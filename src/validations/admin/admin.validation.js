import { z } from "zod";

export const adminSchema = z.object({
  first_name: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be at most 50 characters")
    .regex(/^[\p{L}\p{M}\s\-'\.]+$/u, "First name can only contain letters, spaces, hyphens, apostrophes, and periods"),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters")
    .regex(/^[\p{L}\p{M}\s\-'\.]+$/u, "Last name can only contain letters, spaces, hyphens, apostrophes, and periods"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format"),
  role_access: z
    .string()
    .min(1, "Role is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid role selection"),
});