const SIDEBAR_PERMISSIONS = {
  // Admin routes
  "/admin/dashboard": [],
  "/admin/program": ["operations_management_view", "operations_management_modify"],
  "/admin/admission-administration/application-review": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/admission-administration/academics": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/admission-administration/intakes": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/planning": ["operations_management_view", "operations_management_modify"],
  "/admin/teacher-management": [
    "academic_management_view",
    "academic_management_modify",
  ],
  "/admin/student-management": [
    "academic_management_view",
    "academic_management_modify",
  ],
  "/admin/notification-management": [
    "academic_management_view",
    "academic_management_modify",
  ],
  "/admin/finance-reports": [
    "finance_management_view",
    "finance_management_modify",
  ],
  "/admin/kmo-applications": [
    "finance_management_view",
    "finance_management_modify",
  ],
  "/admin/third-party-payments": [
    "finance_management_view",
    "finance_management_modify",
  ],
  "/admin/fkf": [
    "finance_management_view",
    "finance_management_modify",
  ],
  "/admin/custom-invoices": [
    "finance_management_view",
    "finance_management_modify",
  ],
  "/admin/integrations": [
    "finance_management_view",
    "finance_management_modify",
  ],
  "/admin/locations": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/languages": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/special-exceptions": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/lecturer-data": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/accounting-mappings": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/admin-management": [
    "admin_management_view",
    "admin_management_modify",
  ],
  "/admin/role-management": [
    "roles_management_view",
    "roles_management_modify",
  ],
  "/admin/lti-management": [
    "admin_management_view",
    "admin_management_modify",
  ],
  "/admin/student-corner": [
    "admin_management_view",
    "admin_management_modify",
  ],
  "/admin/admin-logs": ["logs_management_view"],
  "/admin/examination/question-banks": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/examination/exams": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/submissions": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/results": ["operations_management_view", "operations_management_modify"],
  "/admin/examination/assignments": [
    "operations_management_view",
    "operations_management_modify",
  ],
  "/admin/contracts": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/student-contracts": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/departments": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/regions": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/teaching-regions": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  "/admin/contract-types": [
    "master_data_management_view",
    "master_data_management_modify",
  ],
  // CoachView Archive — read-only historical portal. Gated behind the same
  // bucket as other operational reporting pages (results, programs).
  "/admin/archive/students": ["operations_management_view", "operations_management_modify"],
  "/admin/archive/programmes": ["operations_management_view", "operations_management_modify"],
  "/admin/archive/cohorts": ["operations_management_view", "operations_management_modify"],
  "/admin/archive/invoices": ["operations_management_view", "operations_management_modify"],
  "/admin/archive/entities": ["operations_management_view", "operations_management_modify"],
};

/** Module key → modify permission string */
export const MODULE_MODIFY_PERMISSIONS = {
  roles: "roles_management_modify",
  admin: "admin_management_modify",
  operations: "operations_management_modify",
  academic: "academic_management_modify",
  finance: "finance_management_modify",
  master_data: "master_data_management_modify",
};

/**
 * Get required permissions for a specific route
 * @param {string} path - The route path
 * @returns {string[]} - Array of required permissions
 */
export const getRequiredPermissions = (path) => {
  return SIDEBAR_PERMISSIONS[path] || [];
};

/**
 * Check if user has permission to access a specific route (VIEW or MODIFY)
 * @param {string} url - The route URL
 * @param {string[]} userPermissions - Array of user permissions
 * @returns {boolean} - Whether user has access
 */
export const hasPermission = (url, userPermissions = []) => {
  const requiredPermissions = SIDEBAR_PERMISSIONS[url];

  // If no permissions required, allow access
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Check if user has at least one of the required permissions
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

/**
 * Resolve a module key or raw permission string to a *_modify permission.
 * @param {string} moduleOrPermission - e.g. "finance" or "finance_management_modify"
 * @returns {string|null}
 */
export const resolveModifyPermission = (moduleOrPermission) => {
  if (!moduleOrPermission) return null;
  if (moduleOrPermission.endsWith("_modify")) return moduleOrPermission;
  return MODULE_MODIFY_PERMISSIONS[moduleOrPermission] || null;
};

/**
 * Check if user can modify (write) for a module or permission.
 * @param {string[]} userPermissions
 * @param {string} moduleOrPermission - module key ("finance") or full permission
 * @returns {boolean}
 */
export const hasModifyPermission = (
  userPermissions = [],
  moduleOrPermission
) => {
  const permission = resolveModifyPermission(moduleOrPermission);
  if (!permission) return false;
  return userPermissions.includes(permission);
};

/**
 * Get the modify permission string mapped to a route path, if any.
 * @param {string} path
 * @returns {string|null}
 */
export const getModifyPermissionForPath = (path) => {
  const perms = SIDEBAR_PERMISSIONS[path] || [];
  return perms.find((p) => p.endsWith("_modify")) || null;
};

/**
 * Check if user can modify resources for a given route path.
 * Routes with no mapped modify permission (e.g. dashboard, logs) → false.
 * @param {string} path
 * @param {string[]} userPermissions
 * @returns {boolean}
 */
export const canModifyPath = (path, userPermissions = []) => {
  const modifyPerm = getModifyPermissionForPath(path);
  if (!modifyPerm) return false;
  return userPermissions.includes(modifyPerm);
};

/**
 * Filter sidebar items based on user permissions
 * @param {Object} sidebarData - The sidebar configuration
 * @param {string[]} userPermissions - Array of user permissions
 * @returns {Object} - Filtered sidebar data
 */
export const filterSidebarByPermissions = (sidebarData, userPermissions = []) => {
  if (!sidebarData?.navGroups) return sidebarData;

  const filteredNavGroups = sidebarData.navGroups
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        // If item has sub-items, filter them too
        if (item.items) {
          const filteredSubItems = item.items.filter((subItem) =>
            hasPermission(subItem.url, userPermissions)
          );

          // Only include parent if it has visible sub-items
          if (filteredSubItems.length > 0) {
            item.items = filteredSubItems;
            return true;
          }
          return false;
        }

        // For regular items, check permission
        return hasPermission(item.url, userPermissions);
      });

      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group) => group.items.length > 0); // Remove empty groups

  return {
    ...sidebarData,
    navGroups: filteredNavGroups,
  };
};

export { SIDEBAR_PERMISSIONS };
