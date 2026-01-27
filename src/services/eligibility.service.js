import api from "./api";

/**
 * Eligibility Service
 *
 * Handles API calls for eligibility management
 */

export const eligibilityAPI = {
  /**
   * Get all items with eligibility data
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term
   * @returns {Promise} API response
   */
  getEligibilityData: async (params = {}) => {
    const { page = 1, limit = 10, search = "" } = params;
    return api.get("/system-admin/eligibility", {
      params: {
        page,
        limit,
        search,
      },
    });
  },

  /**
   * Update eligibility for a single item
   * @param {string} itemId - Item UUID
   * @param {Array<string>} educationLevels - Array of education levels
   * @returns {Promise} API response
   */
  updateItemEligibility: async (itemId, educationLevels) => {
    return api.put(`/system-admin/eligibility/${itemId}`, {
      educationLevels,
    });
  },

  /**
   * Bulk update eligibility for multiple items
   * @param {Array<Object>} updates - Array of {itemId, educationLevels} objects
   * @returns {Promise} API response
   */
  bulkUpdateEligibility: async (updates) => {
    return api.put("/system-admin/eligibility/bulk", {
      updates,
    });
  },

  /**
   * Delete an item (soft delete)
   * @param {string} itemId - Item UUID
   * @returns {Promise} API response
   */
  deleteItem: async (itemId) => {
    return api.delete(`/system-admin/eligibility/${itemId}`);
  },
};
