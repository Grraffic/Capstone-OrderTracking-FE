import { useMemo } from "react";

/**
 * useInventoryStats Hook
 *
 * Calculates inventory statistics from filtered items:
 * - Total Items count
 * - In Stock items count
 * - Low Stock items count
 * - Out of Stock items count
 *
 * @param {Array} filteredItems - Array of filtered inventory items
 * @returns {Object} Statistics object with totalItems, inStock, lowStock, outOfStock
 *
 * Usage:
 * const stats = useInventoryStats(filteredItems);
 */
export const useInventoryStats = (filteredItems) => {
  const stats = useMemo(() => {
    const totalItems = filteredItems.length;
    const inStock = filteredItems.filter(
      (item) => item.status === "In Stock"
    ).length;
    const lowStock = filteredItems.filter(
      (item) => item.status === "Low Stock"
    ).length;
    const outOfStock = filteredItems.filter(
      (item) => item.status === "Out of Stock"
    ).length;

    return {
      totalItems,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [filteredItems]);

  return stats;
};

