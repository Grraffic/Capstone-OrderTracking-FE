import { useState, useEffect } from "react";
import api from "../../../services/api";

/**
 * useInventoryHealthStats Hook
 *
 * Uses the inventory report API (same source as OutOfStockSection) to compute stats.
 * One API call, and the Out of Stock count matches exactly what the section displays.
 *
 * - Total Item Variants: unique (name, education_level) groups in the report
 * - At Reorder Point: groups with at least one row "At Reorder Point" and not fully out of stock
 * - Out of Stock: groups with at least one row "Out of Stock" (same as section list)
 *
 * @param {Date} startDate - Start date for filtering items by created_at
 * @param {Date} endDate - End date for filtering items by created_at
 * @returns {Object} { stats, loading } - stats object with totalItemVariants, atReorderPoint, outOfStock
 */
export const useInventoryHealthStats = (startDate, endDate) => {
  const [stats, setStats] = useState({
    totalItemVariants: 0,
    atReorderPoint: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryStats = async () => {
      try {
        setLoading(true);
        // Single call: inventory report (no education filter) = same source as OutOfStockSection
        const { data: result } = await api.get("/items/inventory-report");

        if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
          // Filter rows by date range if provided
          let rows = result.data;
          if (startDate && endDate) {
            rows = rows.filter((row) => {
              if (!row.created_at) return false;
              const createdDate = new Date(row.created_at);
              return createdDate >= startDate && createdDate <= endDate;
            });
          }

          // Group rows by (name, education_level) - same grouping as OutOfStockSection
          const groupStatuses = new Map();
          rows.forEach((row) => {
            const key = `${row.name || ""}_${row.education_level || ""}`;
            if (!groupStatuses.has(key)) {
              groupStatuses.set(key, new Set());
            }
            groupStatuses.get(key).add(row.status);
          });

          let totalItemVariants = groupStatuses.size;
          let outOfStock = 0;
          let atReorderPoint = 0;

          groupStatuses.forEach((statuses) => {
            const hasOutOfStock = statuses.has("Out of Stock");
            const hasAtReorderPoint = statuses.has("At Reorder Point");

            if (hasOutOfStock) {
              outOfStock++;
            } else if (hasAtReorderPoint) {
              atReorderPoint++;
            }
          });

          setStats({
            totalItemVariants,
            atReorderPoint,
            outOfStock,
          });

          console.log(`[InventoryHealth] Stats from report:`, {
            totalItemVariants,
            atReorderPoint,
            outOfStock,
          });
        }
      } catch (error) {
        console.error("Error fetching inventory health stats:", error);
        setStats({
          totalItemVariants: 0,
          atReorderPoint: 0,
          outOfStock: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryStats();
  }, [startDate, endDate]);

  return { stats, loading };
};


