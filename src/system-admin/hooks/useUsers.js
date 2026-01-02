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
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch users with filters
  const fetchUsers = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const pageToFetch = params.page || pagination.page;
      const limitToUse = params.limit || 10; // Always use 10 per page

      const response = await userAPI.getUsers({
        page: pageToFetch,
        limit: limitToUse,
        search: params.search || "",
        role: params.role || "",
        status: params.status || "",
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
      setError(err.message || "Failed to update user");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.deleteUser(userId);
      
      if (response.data && response.data.success) {
        // Refresh users list
        await fetchUsers();
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


