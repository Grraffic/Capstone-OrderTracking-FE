import { useState, useEffect, useCallback } from "react";
import { eligibilityAPI } from "../../services/eligibility.service";
import { convertDBToUI, convertUIToDB } from "../utils/eligibilityMapper";
import { toast } from "react-hot-toast";

/**
 * useEligibility Hook
 *
 * Handles eligibility data fetching and management:
 * - Fetches items with eligibility data with pagination and search
 * - CRUD operations for eligibility
 * - Manages loading and error states
 * - Tracks edit mode and changes
 *
 * Usage:
 * const { items, loading, error, fetchEligibilityData, updateEligibility, deleteItem, isEditMode, toggleEditMode } = useEligibility();
 */
export const useEligibility = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [localChanges, setLocalChanges] = useState({}); // Track changes before saving
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Fetch eligibility data with filters and pagination
   */
  const fetchEligibilityData = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const pageToFetch = params.page || pagination.page;
        const limitToUse = params.limit || 10;

        const response = await eligibilityAPI.getEligibilityData({
          page: pageToFetch,
          limit: limitToUse,
          search: params.search || "",
        });

        if (response.data && response.data.success) {
          setItems(response.data.data || []);
          const newPagination = response.data.pagination || pagination;
          setPagination(newPagination);
        }
      } catch (err) {
        console.error("Error fetching eligibility data:", err);
        setError(err.message || "Failed to fetch eligibility data");
        toast.error(err.message || "Failed to fetch eligibility data");
      } finally {
        setLoading(false);
      }
    },
    [pagination.page]
  );

  /**
   * Update eligibility for a single item
   */
  const updateEligibility = useCallback(async (itemId, educationLevels) => {
    try {
      setLoading(true);
      setError(null);

      const response = await eligibilityAPI.updateItemEligibility(
        itemId,
        educationLevels
      );

      if (response.data && response.data.success) {
        // Refresh data after update
        await fetchEligibilityData({ page: pagination.page });
        toast.success("Eligibility updated successfully");
        return response.data.data;
      }
    } catch (err) {
      console.error("Error updating eligibility:", err);
      setError(err.message || "Failed to update eligibility");
      toast.error(err.message || "Failed to update eligibility");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEligibilityData, pagination.page]);

  /**
   * Bulk update eligibility for multiple items
   */
  const bulkUpdateEligibility = useCallback(async (updates) => {
    try {
      setLoading(true);
      setError(null);

      // Validate updates
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error("Updates array is required and cannot be empty");
      }

      // Convert UI format to DB format for each update
      const dbUpdates = updates.map((update) => {
        if (!update.itemId) {
          throw new Error("Each update must have an itemId");
        }
        if (!update.eligibility || typeof update.eligibility !== "object") {
          throw new Error("Each update must have an eligibility object");
        }
        
        const educationLevels = convertUIToDB(update.eligibility);
        console.log("Converting eligibility:", {
          itemId: update.itemId,
          eligibility: update.eligibility,
          converted: educationLevels,
          isArray: Array.isArray(educationLevels),
        });
        
        return {
          itemId: update.itemId,
          educationLevels: educationLevels,
        };
      });

      console.log("Sending bulk update:", JSON.stringify(dbUpdates, null, 2));
      console.log("dbUpdates details:", {
        length: dbUpdates.length,
        firstItem: dbUpdates[0],
        firstItemItemId: dbUpdates[0]?.itemId,
        firstItemEducationLevels: dbUpdates[0]?.educationLevels,
        firstItemEducationLevelsType: typeof dbUpdates[0]?.educationLevels,
        firstItemEducationLevelsIsArray: Array.isArray(dbUpdates[0]?.educationLevels),
      });

      const response = await eligibilityAPI.bulkUpdateEligibility(dbUpdates);

      if (response.data && response.data.success) {
        // Refresh data after bulk update
        await fetchEligibilityData({ page: pagination.page });
        toast.success("Eligibility updated successfully");
        return response.data.data;
      } else {
        throw new Error(response.data?.message || "Bulk update failed");
      }
    } catch (err) {
      console.error("Error bulk updating eligibility:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error response (stringified):", JSON.stringify(err.response?.data, null, 2));
      console.error("Error status:", err.response?.status);
      console.error("Error message:", err.response?.data?.message);
      console.error("Error errors array:", err.response?.data?.errors);
      const errorMessage = err.response?.data?.message || err.message || "Failed to bulk update eligibility";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchEligibilityData, pagination.page]);

  /**
   * Delete an item
   */
  const deleteItem = useCallback(
    async (itemId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await eligibilityAPI.deleteItem(itemId);

        if (response.data && response.data.success) {
          // Refresh data after deletion
          await fetchEligibilityData({ page: pagination.page });
          toast.success("Item deleted successfully");
          return true;
        }
      } catch (err) {
        console.error("Error deleting item:", err);
        setError(err.message || "Failed to delete item");
        toast.error(err.message || "Failed to delete item");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchEligibilityData, pagination.page]
  );

  /**
   * Toggle edit mode
   */
  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      const newMode = !prev;
      if (!newMode) {
        // Exiting edit mode - discard changes
        setLocalChanges({});
        setHasChanges(false);
      }
      return newMode;
    });
  }, []);

  /**
   * Update local changes (for edit mode)
   */
  const updateLocalChange = useCallback((itemId, eligibility) => {
    setLocalChanges((prev) => {
      const newChanges = {
        ...prev,
        [itemId]: eligibility,
      };
      setHasChanges(Object.keys(newChanges).length > 0);
      return newChanges;
    });
  }, []);

  /**
   * Save all local changes
   */
  const saveChanges = useCallback(async () => {
    if (!hasChanges || Object.keys(localChanges).length === 0) {
      toast.error("No changes to save");
      return;
    }

    try {
      const updates = Object.keys(localChanges).map((itemId) => {
        const eligibility = localChanges[itemId];
        // Ensure eligibility is a valid object
        if (!eligibility || typeof eligibility !== "object") {
          throw new Error(`Invalid eligibility data for item ${itemId}`);
        }
        
        return {
          itemId,
          eligibility,
        };
      });

      console.log("Preparing to save changes:", updates);

      await bulkUpdateEligibility(updates);

      // Clear changes and exit edit mode
      setLocalChanges({});
      setHasChanges(false);
      setIsEditMode(false);
    } catch (err) {
      // Error already handled in bulkUpdateEligibility
      console.error("Error saving changes:", err);
    }
  }, [hasChanges, localChanges, bulkUpdateEligibility]);

  /**
   * Cancel changes and exit edit mode
   */
  const cancelChanges = useCallback(() => {
    setLocalChanges({});
    setHasChanges(false);
    setIsEditMode(false);
  }, []);

  /**
   * Get current eligibility for an item (including local changes)
   */
  const getItemEligibility = useCallback(
    (item) => {
      // If there are local changes for this item, use those
      if (localChanges[item.id]) {
        return localChanges[item.id];
      }

      // Otherwise, use the item's current eligibility
      return {
        isPreschoolEligible: item.isPreschoolEligible || false,
        isElementaryEligible: item.isElementaryEligible || false,
        isJHSEligible: item.isJHSEligible || false,
        isSHSEligible: item.isSHSEligible || false,
        isCollegeEligible: item.isCollegeEligible || false,
      };
    },
    [localChanges]
  );

  return {
    items,
    loading,
    error,
    pagination,
    isEditMode,
    hasChanges,
    fetchEligibilityData,
    updateEligibility,
    bulkUpdateEligibility,
    deleteItem,
    toggleEditMode,
    updateLocalChange,
    saveChanges,
    cancelChanges,
    getItemEligibility,
  };
};
