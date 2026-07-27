import { useAuthStore } from "@/store/useAuthStore";
import {
  canModifyPath,
  hasModifyPermission,
} from "@/utils/permissionUtils";

/**
 * Current admin's role permissions from profile.
 * @returns {string[]}
 */
export function useUserPermissions() {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role_access?.permissions || [];
}

/**
 * Whether the current user can modify for a module key or route path.
 * @param {string} moduleOrPath - e.g. "finance", "admin", or "/admin/program"
 * @returns {boolean}
 */
export function useCanModify(moduleOrPath) {
  const permissions = useUserPermissions();

  if (!moduleOrPath) return false;

  if (moduleOrPath.startsWith("/")) {
    return canModifyPath(moduleOrPath, permissions);
  }

  return hasModifyPermission(permissions, moduleOrPath);
}
