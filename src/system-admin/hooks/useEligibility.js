import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { eligibilityAPI } from "../../services/eligibility.service";
import { convertDBToUI, convertUIToDB } from "../utils/eligibilityMapper";
import { ITEM_MASTER_LIST } from "../../property-custodian/constants/itemMasterList";
import { toast } from "react-hot-toast";

/** Normalize item name for comparison: lowercase, collapse spaces, trim */
function normName(s) {
  return (s || "").toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Merge canonical item names with API items:
 * - Display all canonical names; use API data when property custodian has added that item.
 * - Append any API items whose name is not in the canonical list (new items from property custodian).
 * Placeholder rows (not yet in inventory) have _placeholder: true and are read-only.
 * @param {Array} apiItems - Items returned by the API
 * @param {string} [search] - If non-empty, only include canonical/API items whose name matches (case-insensitive)
 */
function mergeCanonicalWithApiItems(apiItems, search = "") {
  const raw = Array.isArray(apiItems) ? apiItems : [];
  const searchNorm = normName(search);
  const searchActive = searchNorm.length > 0;

  // When searching, only consider canonical names and API items that match the search
  const canonicalNames = searchActive
    ? ITEM_MASTER_LIST.filter((name) => normName(name).includes(searchNorm))
    : ITEM_MASTER_LIST;
  const rawFiltered = searchActive
    ? raw.filter((it) => normName(it.name).includes(searchNorm))
    : raw;

  const canonicalNormSet = new Set(ITEM_MASTER_LIST.map(normName));
  const result = [];
  const matchedNorm = new Set();

  // One row per matching canonical name: use API item if exists, else placeholder
  for (const canonicalName of canonicalNames) {
    const n = normName(canonicalName);
    const apiItem = rawFiltered.find((it) => normName(it.name) === n);
    if (apiItem) {
      result.push(apiItem);
      matchedNorm.add(n);
    } else {
      result.push({
        id: `canonical-${n.replace(/\s+/g, "-")}`,
        name: canonicalName,
        itemIds: [],
        isPreschoolEligible: false,
        isElementaryEligible: false,
        isJHSEligible: false,
        isSHSEligible: false,
        isCollegeEligible: false,
        eligibleLevels: [],
        _placeholder: true,
      });
    }
  }

  // Append API items not in canonical list (new names added by property custodian)
  const seenNew = new Set();
  for (const item of rawFiltered) {
    const n = normName(item.name);
    if (canonicalNormSet.has(n)) continue;
    if (seenNew.has(n)) continue;
    seenNew.add(n);
    result.push(item);
  }

  // Sort: items with at least one eligibility checked first, then unchecked last; within each group keep canonical/name order
  const hasAnyEligibility = (item) =>
    !!(item.isPreschoolEligible || item.isElementaryEligible || item.isJHSEligible || item.isSHSEligible || item.isCollegeEligible);
  const orderOf = (name) => {
    const i = ITEM_MASTER_LIST.findIndex((c) => normName(c) === normName(name));
    return i >= 0 ? i : 9999;
  };
  result.sort((a, b) => {
    const hasA = hasAnyEligibility(a);
    const hasB = hasAnyEligibility(b);
    if (hasA !== hasB) return hasB ? 1 : -1; // checked first (hasA first -> return -1 when hasA)
    const oa = orderOf(a.name);
    const ob = orderOf(b.name);
    if (oa !== ob) return oa - ob;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });

  return result;
}

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
  const [saving, setSaving] = useState(false);
  const lastFetchParamsRef = useRef({ search: "", limit: 200, filter: "all" });

  /**
   * Fetch eligibility data with filters and pagination.
   * @param {Object} params - Fetch params (page, limit, search, filter)
   * @param {boolean} [params.silent] - If true, do not set loading state (for background refetch after save)
   */
  const fetchEligibilityData = useCallback(
    async (params = {}) => {
      const silent = params.silent === true;
      const search = params.search !== undefined ? params.search : lastFetchParamsRef.current.search;
      const limit = params.limit !== undefined ? params.limit : lastFetchParamsRef.current.limit;
      const filter = params.filter !== undefined ? params.filter : lastFetchParamsRef.current.filter;
      lastFetchParamsRef.current = { search, limit, filter };

      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }

        const pageToFetch = params.page ?? pagination.page;
        const limitToUse = limit || 10;

        const response = await eligibilityAPI.getEligibilityData({
          page: pageToFetch,
          limit: limitToUse,
          search: search || "",
          filter: filter || "all",
        });

        if (response.data && response.data.success) {
          const rawItems = response.data.data || [];
          const searchTerm = (search || "").trim();
          setItems(mergeCanonicalWithApiItems(rawItems, searchTerm));
          const newPagination = response.data.pagination || pagination;
          setPagination(newPagination);
        }
      } catch (err) {
        console.error("Error fetching eligibility data:", err);
        setError(err.message || "Failed to fetch eligibility data");
        if (!silent) {
          toast.error(err.message || "Failed to fetch eligibility data");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
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
      setSaving(true);
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
        // Refresh data in background without showing "Loading items..."
        await fetchEligibilityData({
          ...lastFetchParamsRef.current,
          page: 1,
          silent: true,
        });
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
      setSaving(false);
    }
  }, [fetchEligibilityData]);

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

  // Order: items with at least one eligibility checked first, unchecked last (uses effective eligibility including local changes)
  const itemsSortedByEligibility = useMemo(() => {
    const hasAny = (item) => {
      const e = localChanges[item.id] ?? {
        isPreschoolEligible: item.isPreschoolEligible,
        isElementaryEligible: item.isElementaryEligible,
        isJHSEligible: item.isJHSEligible,
        isSHSEligible: item.isSHSEligible,
        isCollegeEligible: item.isCollegeEligible,
      };
      return !!(e.isPreschoolEligible || e.isElementaryEligible || e.isJHSEligible || e.isSHSEligible || e.isCollegeEligible);
    };
    return [...items].sort((a, b) => {
      const hasA = hasAny(a);
      const hasB = hasAny(b);
      if (hasA !== hasB) return hasB ? 1 : -1;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
  }, [items, localChanges]);

  return {
    items: itemsSortedByEligibility,
    loading,
    saving,
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
