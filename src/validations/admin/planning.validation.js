import { z } from "zod";

const teacherSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  session_date: z.string().min(1, "Session date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  teachers: z.array(teacherSchema).optional(),
  assistants: z.array(teacherSchema).optional(),
  trainees: z.array(teacherSchema).optional(),
});

export const planningSchema = z.object({
  program: z.string().min(1, "Program is required"),
  batch: z.string().min(1, "Batch is required"),
  component: z.string().min(1, "Component is required"),
  venue: z.string().min(1, "Venue is required"),
  description: z.string().optional(),
  teachers: z.array(teacherSchema).optional(),
  assistants: z.array(teacherSchema).optional(),
  trainees: z.array(teacherSchema).optional(),
  sessions: z.array(sessionSchema).min(1, "At least one session is required"),
});