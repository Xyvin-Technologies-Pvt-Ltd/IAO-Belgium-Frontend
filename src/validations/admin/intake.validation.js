import { z } from "zod";

export const intakeSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    program: z.string().min(1, "Program is required"),
    admission_fee: z.coerce
      .number({ invalid_type_error: "Admission fee must be a number" })
      .min(0, "Must be a positive number"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    registration_deadline: z
      .string()
      .min(1, "Registration deadline is required"),
    student_per_batch: z.coerce
      .number({ invalid_type_error: "Students per batch must be a number" })
      .min(1, "Must be at least 1"),
    max_student_enrollment: z.coerce
      .number({
        invalid_type_error: "Max student enrollment must be a number",
      })
      .min(1, "Must be at least 1"),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  })
  .refine(
    (data) => new Date(data.registration_deadline) < new Date(data.start_date),
    {
      message: "Registration deadline must be before start date",
      path: ["registration_deadline"],
    }
  )
  .refine((data) => data.student_per_batch <= data.max_student_enrollment, {
    message: "Cannot exceed max student enrollment",
    path: ["student_per_batch"],
  });
