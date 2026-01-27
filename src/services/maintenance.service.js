import api from "./api";

/**
 * Maintenance Service
 *
 * Handles API calls for maintenance mode management
 */

export const maintenanceAPI = {
  /**
   * Get current maintenance mode settings
   * @returns {Promise} API response
   */
  getMaintenanceMode: async () => {
    return api.get("/system-admin/maintenance");
  },

  /**
   * Update maintenance mode settings
   * @param {Object} settings - Maintenance mode settings
   * @param {boolean} settings.is_enabled - Whether maintenance is enabled
   * @param {string} settings.display_message - Message to display to users
   * @param {string} settings.scheduled_date - Date in YYYY-MM-DD format
   * @param {string} settings.start_time - Start time in HH:MM format
   * @param {string} settings.end_time - End time in HH:MM format
   * @param {boolean} settings.is_all_day - Whether maintenance runs all day
   * @returns {Promise} API response
   */
  updateMaintenanceMode: async (settings) => {
    return api.put("/system-admin/maintenance", settings);
  },

  /**
   * Check if maintenance mode is currently active (public endpoint)
   * @returns {Promise} API response with {isActive: boolean, message: string | null}
   */
  checkMaintenanceStatus: async () => {
    return api.get("/maintenance/status");
  },
};
