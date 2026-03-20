import { useState, useEffect, useCallback } from "react";
import api from "../../../services/api";

/** Dispatched after item save/update or socket item events so health cards refetch. */
export const PC_INVENTORY_HEALTH_REFRESH = "pc-inventory-health-refresh";

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

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: result } = await api.get("/items/inventory-report");

      if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
        let rows = result.data;
        if (startDate && endDate) {
          rows = rows.filter((row) => {
            if (!row.created_at) return false;
            const createdDate = new Date(row.created_at);
            return createdDate >= startDate && createdDate <= endDate;
          });
        }

        rows = rows.filter((row) => {
          return !row.is_archived || row.is_archived === false || row.is_archived === null;
        });

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
        groupStatuses.forEach((statuses) => {
          if (statuses.has("Out of Stock")) outOfStock++;
        });

        const atReorderPoint = rows.filter(
          (row) => row.status === "At Reorder Point" || row.status === "Critical",
        ).length;

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
      } else {
        setStats({
          totalItemVariants: 0,
          atReorderPoint: 0,
          outOfStock: 0,
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
  }, [startDate, endDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const handler = () => {
      loadStats();
    };
    window.addEventListener(PC_INVENTORY_HEALTH_REFRESH, handler);
    return () => window.removeEventListener(PC_INVENTORY_HEALTH_REFRESH, handler);
  }, [loadStats]);

  return { stats, loading };
};

