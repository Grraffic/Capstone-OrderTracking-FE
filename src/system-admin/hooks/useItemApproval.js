import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";

// API base URL - adjust based on your environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * useItemApproval Hook
 * 
 * Manages item approval workflow for system administrators
 */
export const useItemApproval = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
  });

  /**
   * Get auth token from localStorage
   */
  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  /**
   * Fetch items with optional filters
   */
  const fetchItems = useCallback(async (filters = {}, page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.pendingOnly) {
        params.append("pendingOnly", "true");
      }
      if (filters.search) {
        params.append("search", filters.search);
      }

      const response = await fetch(
        `${API_BASE_URL}/system-admin/items?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const result = await response.json();

      if (result.success) {
        // Transform snake_case to camelCase
        const transformedData = result.data.map((item) => ({
          id: item.id,
          name: item.name,
          educationLevel: item.education_level,
          category: item.category,
          itemType: item.item_type,
          description: item.description,
          descriptionText: item.description_text,
          material: item.material,
          size: item.size,
          stock: item.stock,
          price: item.price,
          image: item.image,
          status: item.status,
          isApproved: item.is_approved,
          approvedBy: item.approved_by,
          approvedAt: item.approved_at,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setItems(transformedData);
        setPagination(result.pagination || {
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      } else {
        throw new Error(result.message || "Failed to fetch items");
      }
    } catch (err) {
      console.error("Fetch items error:", err);
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch approval statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/system-admin/items/stats`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    }
  }, []);

  /**
   * Approve a single item
   */
  const approveItem = useCallback(async (itemId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/system-admin/items/${itemId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve item");
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Item approved successfully");
        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isApproved: true,
                  approvedAt: new Date().toISOString(),
                }
              : item
          )
        );
        // Refresh stats
        await fetchStats();
        return result;
      } else {
        throw new Error(result.message || "Failed to approve item");
      }
    } catch (err) {
      console.error("Approve item error:", err);
      toast.error(err.message || "Failed to approve item");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  /**
   * Approve multiple items
   */
  const approveItems = useCallback(async (itemIds) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/system-admin/items/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemIds }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to approve items");
      }

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Items approved successfully");
        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            itemIds.includes(item.id)
              ? {
                  ...item,
                  isApproved: true,
                  approvedAt: new Date().toISOString(),
                }
              : item
          )
        );
        // Refresh stats
        await fetchStats();
        return result;
      } else {
        throw new Error(result.message || "Failed to approve items");
      }
    } catch (err) {
      console.error("Approve items error:", err);
      toast.error(err.message || "Failed to approve items");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  /**
   * Reject an item (set back to pending)
   */
  const rejectItem = useCallback(async (itemId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/system-admin/items/${itemId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject item");
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Item rejected successfully");
        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isApproved: false,
                  approvedBy: null,
                  approvedAt: null,
                }
              : item
          )
        );
        // Refresh stats
        await fetchStats();
        return result;
      } else {
        throw new Error(result.message || "Failed to reject item");
      }
    } catch (err) {
      console.error("Reject item error:", err);
      toast.error(err.message || "Failed to reject item");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStats]);

  return {
    items,
    loading,
    error,
    pagination,
    stats,
    fetchItems,
    fetchStats,
    approveItem,
    approveItems,
    rejectItem,
  };
};
