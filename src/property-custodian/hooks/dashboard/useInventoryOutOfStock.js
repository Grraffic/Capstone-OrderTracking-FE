import { useState, useEffect, useCallback } from "react";
import inventoryService from "../../../services/inventory.service";
import { itemsAPI } from "../../../services/api";

/**
 * useInventoryOutOfStock Hook
 *
 * Fetches filtered inventory data for items that are out of stock.
 * Handles education level filtering and data transformation.
 *
 * @param {string} educationLevel - Selected education level filter
 * @returns {Object} { data, loading, error, refetch }
 */
export const useInventoryOutOfStock = (educationLevel = "College") => {
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
   * Groups items by name and education_level, with each size as a variant row
   * Filters to only include items with status "Out of Stock"
   */
  const transformData = useCallback((apiData) => {
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    // Filter items out of stock
    const outOfStockItems = apiData.filter(
      (item) => item.status === "Out of Stock"
    );

    // Group items by name and education_level
    const groupedMap = new Map();

    outOfStockItems.forEach((item) => {
      const key = `${item.name || ""}_${item.education_level || ""}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          itemName: item.name || "",
          educationLevel: item.education_level || "",
          variants: [],
        });
      }

      const group = groupedMap.get(key);

      // Calculate ending inventory: beginning_inventory + purchases - released + returns
      const beginningInventory = item.beginning_inventory || 0;
      const purchases = item.purchases || 0;
      const released = item.released || 0;
      const returns = item.returns || 0;
      const endingInventory = beginningInventory + purchases - released + returns;

      group.variants.push({
        id: item.id,
        variant: item.size || "N/A",
        beginningInventory,
        purchase: purchases,
        releases: released,
        returns,
        endingInventory,
        unit: item.unit_price || item.price || 0,
      });
    });

    // Convert map to array and sort
    return Array.from(groupedMap.values()).sort((a, b) => {
      if (a.itemName !== b.itemName) {
        return a.itemName.localeCompare(b.itemName);
      }
      return a.educationLevel.localeCompare(b.educationLevel);
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
        
        // Fetch available sizes for each unique item
        // Note: Use the API education level format (already mapped in transformData uses item.education_level from API)
        const itemsWithSizes = await Promise.all(
          transformedData.map(async (item) => {
            try {
              // item.educationLevel is already in the format from the API (e.g., "Junior High School")
              // which matches what the backend expects
              const sizesResponse = await itemsAPI.getAvailableSizes(
                item.itemName,
                item.educationLevel
              );
              
              if (sizesResponse.success && sizesResponse.data && Array.isArray(sizesResponse.data)) {
                // Ensure we have valid size data
                const validSizes = sizesResponse.data.filter(
                  (s) => s && s.size && s.size !== "N/A"
                );
                
                if (validSizes.length > 0) {
                  return {
                    ...item,
                    availableSizes: validSizes,
                  };
                }
              }
            } catch (err) {
              console.warn(
                `Failed to fetch available sizes for ${item.itemName} (${item.educationLevel}):`,
                err.message
              );
              // Fallback: use current variants if API fails
            }
            
            // Fallback to current variants if API call failed
            return item;
          })
        );
        
        setData(itemsWithSizes);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching inventory out of stock:", err);
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
