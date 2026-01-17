
const SIDEBAR_PERMISSIONS = {
  // Admin routes
  "/admin/dashboard": [], 
  "/admin/program": ["operations_management_view", "operations_management_modify"],
  "/admin/admission-administration/application-review": ["operations_management_view", "operations_management_modify"],
  "/admin/admission-administration/intakes": ["operations_management_view", "operations_management_modify"],
  "/admin/planning": ["operations_management_view", "operations_management_modify"],
  "/admin/teacher-management": ["academic_management_view", "academic_management_modify"],
  "/admin/student-management": ["academic_management_view", "academic_management_modify"],
  "/admin/locations": ["master_data_management_view", "master_data_management_modify"],
  "/admin/languages": ["master_data_management_view", "master_data_management_modify"],
  "/admin/teacher-data": ["master_data_management_view", "master_data_management_modify"],
  "/admin/admin-management": ["admin_management_view", "admin_management_modify"],
  "/admin/role-management": ["roles_management_view", "roles_management_modify"],
  "/admin/admin-logs": ["logs_management_view"],
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
 * Check if user has permission to access a specific route
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
  return requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
};

/**
 * Filter sidebar items based on user permissions
 * @param {Object} sidebarData - The sidebar configuration
 * @param {string[]} userPermissions - Array of user permissions
 * @returns {Object} - Filtered sidebar data
 */
export const filterSidebarByPermissions = (sidebarData, userPermissions = []) => {
  if (!sidebarData?.navGroups) return sidebarData;

  const filteredNavGroups = sidebarData.navGroups.map(group => {
    const filteredItems = group.items.filter(item => {
      // If item has sub-items, filter them too
      if (item.items) {
        const filteredSubItems = item.items.filter(subItem => 
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
  }).filter(group => group.items.length > 0); // Remove empty groups

  return {
    ...sidebarData,
    navGroups: filteredNavGroups,
  };
};