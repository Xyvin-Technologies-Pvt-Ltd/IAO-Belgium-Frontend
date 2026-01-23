import { z } from "zod";

export const teacherSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().min(1, "Email is required"),
  phone: z.string().min(1, "Phone number is required"),
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