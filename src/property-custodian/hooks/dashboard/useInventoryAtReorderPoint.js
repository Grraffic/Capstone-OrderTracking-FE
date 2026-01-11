import { useState, useEffect, useCallback } from "react";
import inventoryService from "../../../services/inventory.service";
import { itemsAPI } from "../../../services/api";

/**
 * useInventoryAtReorderPoint Hook
 *
 * Fetches filtered inventory data for items that need reordering attention.
 * Includes items with status "Critical" (stock 1-19) and "At Reorder Point" (stock 20-49).
 * Handles education level filtering and data transformation.
 *
 * @param {string} educationLevel - Selected education level filter
 * @returns {Object} { data, loading, error, refetch }
 */
export const useInventoryAtReorderPoint = (educationLevel = "College") => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Map frontend education level names to backend API values
   */
  const mapEducationLevelToAPI = (level) => {
    const mapping = {
      "Preschool": "Kindergarten",
      "Elementary": "Elementary",
      "Junior High School": "Junior High School",
      "Senior High School": "Senior High School",
      "College": "College",
    };
    return mapping[level] || null;
  };

  /**
   * Transform API response to table format
   * Returns one row per size variant (not grouped)
   * Filters to include items with status "Critical" (1-19) or "At Reorder Point" (20-49)
   * Both statuses indicate items that need reordering attention
   */
  const transformData = useCallback((apiData) => {
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    // Filter items that need reordering attention (Critical or At Reorder Point)
    // Critical: stock 1-19, At Reorder Point: stock 20-49
    const atReorderPointItems = apiData.filter(
      (item) => 
        item.status === "At Reorder Point" || 
        item.status === "Critical"
    );

    // Transform to flat array - one row per size variant
    const transformedItems = atReorderPointItems.map((item) => {
      // Use the actual stock field from the API response
      // This is the variant's actual stock, not the calculated ending_inventory
      // which may incorrectly use item-level values when per-variant tracking isn't available
      const currentStock = item.stock !== undefined ? item.stock : (item.ending_inventory || 0);

      return {
        id: item.id || item.item_id,
        itemName: item.name || "",
        educationLevel: item.education_level || "",
        size: item.size || "N/A",
        currentStock: currentStock,
        reorderPoint: item.reorder_point || 0,
        status: item.status || "", // Include status to distinguish Critical vs At Reorder Point
        itemId: item.item_id || item.id, // For action button
      };
    });

    // Sort by item name, then education level, then size
    return transformedItems.sort((a, b) => {
      if (a.itemName !== b.itemName) {
        return a.itemName.localeCompare(b.itemName);
      }
      if (a.educationLevel !== b.educationLevel) {
        return a.educationLevel.localeCompare(b.educationLevel);
      }
      return a.size.localeCompare(b.size);
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiEducationLevel = mapEducationLevelToAPI(educationLevel);
      const filters = {
        educationLevel: apiEducationLevel,
      };

      const response = await inventoryService.getInventoryReport(filters);

      if (response.success && response.data) {
        const transformedData = transformData(response.data);
        setData(transformedData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching inventory at reorder point:", err);
      setError(err.message || "Failed to fetch inventory data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [educationLevel, transformData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};
