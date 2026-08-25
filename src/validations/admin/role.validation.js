import { z } from "zod";

const VALID_PERMISSIONS = [
  "roles_management_view",
  "roles_management_modify",
  "admin_management_view",
  "admin_management_modify",
  "operations_management_view",
  "operations_management_modify",
  "academic_management_view",
  "academic_management_modify",
  "finance_management_view",
  "finance_management_modify",
  "master_data_management_view",
  "master_data_management_modify",
  "queue_management_view",
  "queue_management_modify",
  "logs_management_view"
];

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, "Role name is required")
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be at most 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Role name can only contain letters, numbers, spaces, hyphens, and underscores"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be at most 500 characters"),
  permissions: z
    .array(z.string())
    .min(1, "At least one permission must be selected")
    .refine(
      (permissions) => permissions.every(permission => VALID_PERMISSIONS.includes(permission)),
      {
        message: "Invalid permission selected",
      }
    ),
});