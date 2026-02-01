import api from "./api";

/**
 * Student Permissions Service
 *
 * Handles API calls for student item permissions management
 */

const studentPermissionsAPI = {
  /**
   * Get items for permission management for a student
   * @param {string} studentId - Student UUID
   * @param {string} educationLevel - Student's education level
   * @returns {Promise} API response with items grouped by education level
   */
  getItemsForStudentPermission: (studentId, educationLevel) => {
    return api.get(
      `/system-admin/student-permissions/${studentId}/items?educationLevel=${encodeURIComponent(educationLevel)}`
    );
  },

  /**
   * Get all permissions for a student
   * @param {string} studentId - Student UUID
   * @returns {Promise} API response with permissions map
   */
  getStudentItemPermissions: (studentId) => {
    return api.get(`/system-admin/student-permissions/${studentId}`);
  },

  /**
   * Update permissions for a single student
   * @param {string} studentId - Student UUID
   * @param {Object} permissions - Object mapping item_name (normalized) -> enabled (boolean)
   * @returns {Promise} API response
   */
  updateStudentItemPermissions: (studentId, permissions) => {
    return api.post(`/system-admin/student-permissions/${studentId}`, {
      permissions,
    });
  },

  /**
   * Bulk update permissions for multiple students
   * @param {Array<string>} studentIds - Array of student UUIDs
   * @param {Object} permissions - Object mapping item_name (normalized) -> enabled (boolean)
   * @returns {Promise} API response
   */
  bulkUpdateStudentItemPermissions: (studentIds, permissions) => {
    return api.post("/system-admin/student-permissions/bulk", {
      studentIds,
      permissions,
    });
  },
};

export default studentPermissionsAPI;
