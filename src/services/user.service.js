import api from "./api";

/**
 * User Service
 * 
 * Handles API calls for user management
 */

const userAPI = {
  /**
   * Get all users with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.role) queryParams.append("role", params.role);
    if (params.status) queryParams.append("status", params.status);
    // Always send education_level (even if empty string) so backend knows whether to filter
    if (params.education_level !== undefined) {
      queryParams.append("education_level", params.education_level);
      console.log(`[user.service] Sending education_level: "${params.education_level}" (type: ${typeof params.education_level}, length: ${params.education_level?.length})`);
    }
    // Always send course_year_level (even if empty string) so backend knows whether to filter
    if (params.course_year_level !== undefined) {
      queryParams.append("course_year_level", params.course_year_level);
    }
    // Send school_year (2-digit year prefix for filtering student_number)
    if (params.school_year !== undefined && params.school_year !== "") {
      queryParams.append("school_year", params.school_year);
    }
    // Send excludeRole to exclude specific roles (e.g., "student")
    if (params.excludeRole !== undefined && params.excludeRole !== "") {
      queryParams.append("excludeRole", params.excludeRole);
    }

    const url = `/users?${queryParams.toString()}`;
    console.log(`[user.service] Request URL: ${url}`);
    return api.get(url);
  },

  /**
   * Get a single user by ID
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  getUserById: (userId) => {
    return api.get(`/users/${userId}`);
  },

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} API response
   */
  createUser: (userData) => {
    return api.post("/users", userData);
  },

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise} API response
   */
  updateUser: (userId, updates) => {
    return api.put(`/users/${userId}`, updates);
  },

  /**
   * Delete a user (soft delete)
   * @param {string} userId - User ID
   * @returns {Promise} API response
   */
  deleteUser: (userId) => {
    return api.delete(`/users/${userId}`);
  },

  /**
   * Bulk update users
   * @param {Array<string>} userIds - Array of user IDs to update
   * @param {Object} updateData - Data to update (total_item_limit, order_lockout_period)
   * @returns {Promise} API response
   */
  bulkUpdateUsers: (userIds, updateData) => {
    return api.patch("/users/bulk-update", {
      userIds,
      updateData,
    });
  },
};

export { userAPI };

