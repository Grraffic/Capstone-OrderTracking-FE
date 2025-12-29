const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Inventory Service
 * Handles API calls for inventory management
 */
class InventoryService {
  /**
   * Get inventory report
   * @param {Object} filters - Filter options (educationLevel, search, etc.)
   * @returns {Promise} Inventory report data
   */
  async getInventoryReport(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (filters.educationLevel) {
        queryParams.append("educationLevel", filters.educationLevel);
      }
      if (filters.search) {
        queryParams.append("search", filters.search);
      }

      const url = `${API_BASE_URL}/items/inventory-report${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      // Add cache-busting timestamp to ensure fresh data
      const cacheBuster = `&_t=${Date.now()}`;
      const finalUrl = url.includes('?') ? `${url}${cacheBuster}` : `${url}?${cacheBuster.substring(1)}`;
      
      console.log(`[InventoryService] Fetching inventory report from: ${finalUrl}`);
      
      const response = await fetch(finalUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store", // Prevent browser caching
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch inventory report");
      }

      return await response.json();
    } catch (error) {
      console.error("Get inventory report error:", error);
      throw error;
    }
  }

  /**
   * Add stock to item (purchases)
   * @param {string} itemId - Item ID
   * @param {number} quantity - Quantity to add
   * @param {number} unitPrice - Optional unit price
   * @returns {Promise} Updated item data
   */
  async addStock(itemId, quantity, unitPrice = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${itemId}/add-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ quantity, unitPrice }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add stock");
      }

      return await response.json();
    } catch (error) {
      console.error("Add stock error:", error);
      throw error;
    }
  }

  /**
   * Reset beginning inventory manually
   * @param {string} itemId - Item ID
   * @returns {Promise} Updated item data
   */
  async resetBeginningInventory(itemId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/items/${itemId}/reset-beginning-inventory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset beginning inventory");
      }

      return await response.json();
    } catch (error) {
      console.error("Reset beginning inventory error:", error);
      throw error;
    }
  }
}

export default new InventoryService();

