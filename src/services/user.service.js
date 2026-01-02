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

    return api.get(`/users?${queryParams.toString()}`);
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
};

export { userAPI };

