import api from "./api";

/**
 * Role Service
 * 
 * Handles API calls for role and permission management
 */

const roleAPI = {
  /**
   * Get all roles with stats
   * @returns {Promise} API response
   */
  getAllRoles: () => {
    return api.get("/system-admin/roles");
  },

  /**
   * Get role details with permissions
   * @param {string} role - Role name
   * @returns {Promise} API response
   */
  getRoleDetails: (role) => {
    return api.get(`/system-admin/roles/${role}`);
  },

  /**
   * Get permissions for a role
   * @param {string} role - Role name
   * @returns {Promise} API response
   */
  getRolePermissions: (role) => {
    return api.get(`/system-admin/roles/${role}/permissions`);
  },

  /**
   * Assign permission to role
   * @param {string} role - Role name
   * @param {string} permissionId - Permission ID
   * @returns {Promise} API response
   */
  assignPermission: (role, permissionId) => {
    return api.post(`/system-admin/roles/${role}/permissions`, {
      permissionId,
    });
  },

  /**
   * Remove permission from role
   * @param {string} role - Role name
   * @param {string} permissionId - Permission ID
   * @returns {Promise} API response
   */
  removePermission: (role, permissionId) => {
    return api.delete(`/system-admin/roles/${role}/permissions/${permissionId}`);
  },

  /**
   * Update role status
   * @param {string} role - Role name
   * @param {boolean} isActive - Active status
   * @returns {Promise} API response
   */
  updateRoleStatus: (role, isActive) => {
    return api.put(`/system-admin/roles/${role}/status`, {
      isActive,
    });
  },

  /**
   * Get all permissions
   * @returns {Promise} API response
   */
  getAllPermissions: () => {
    return api.get("/system-admin/roles/permissions");
  },
};

export { roleAPI };
