import { useState, useEffect } from "react";
import { userAPI } from "../../services/user.service";

/**
 * useUsers Hook
 * 
 * Handles user data fetching and management:
 * - Fetches users with pagination, search, and filters
 * - CRUD operations for users
 * - Manages loading and error states
 * 
 * Usage:
 * const { users, loading, error, fetchUsers, createUser, updateUser, deleteUser } = useUsers();
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0,
  });

  // Fetch users with filters
  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const pageToFetch = params.page || pagination.page;
      const limitToUse = params.limit || 8; // Always use 8 per page

      const response = await userAPI.getUsers({
        page: pageToFetch,
        limit: limitToUse,
        search: params.search || "",
        role: params.role || "",
        status: params.status || "",
        education_level: params.education_level || "",
        course_year_level: params.course_year_level || "",
        school_year: params.school_year || "", // Pass school_year for filtering by enrollment year
        excludeRole: params.excludeRole || "", // Pass excludeRole to exclude specific roles (e.g., "student")
      });

      if (response.data && response.data.success) {
        setUsers(response.data.data || []);
        const newPagination = response.data.pagination || pagination;
        setPagination(newPagination);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const createUser = async (userData, refreshParams = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.createUser(userData);
      
      if (response.data && response.data.success) {
        // Refresh users list with provided params or default
        if (refreshParams) {
          await fetchUsers(refreshParams);
        } else {
          await fetchUsers();
        }
        return response.data.data;
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (userId, updates, refreshParams = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.updateUser(userId, updates);
      
      if (response.data && response.data.success) {
        // Refresh users list with provided params or default
        if (refreshParams) {
          await fetchUsers(refreshParams);
        } else {
          await fetchUsers();
        }
        return response.data.data;
      }
    } catch (err) {
      console.error("Error updating user:", err);
      // Extract error message from response if available
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          "Failed to update user";
      console.error("Error details:", {
        message: errorMessage,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId, refreshParams = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.deleteUser(userId);
      
      if (response.data && response.data.success) {
        // Refresh users list with provided params or default (excluding students)
        if (refreshParams) {
          await fetchUsers(refreshParams);
        } else {
          await fetchUsers({ excludeRole: "student" });
        }
        return response.data.data;
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message || "Failed to delete user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    pagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};


