import { useState, useEffect, useCallback } from "react";
import inventoryService from "../../../services/inventory.service";

/** Dispatched after item save/update or socket item events so health cards refetch. */
export const PC_INVENTORY_HEALTH_REFRESH = "pc-inventory-health-refresh";

// ─── helpers ─────────────────────────────────────────────────────────────────

const normalizeSize = (size) => {
  if (!size) return "";
  const s = String(size).trim();
  const match = s.match(/^(.+?)\s*\([A-Z]\)$/i);
  return match ? match[1].trim() : s;
};

const normalizeForMatch = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, "")
    .trim();

const parseOrderItems = (items) => {
  if (!items) return [];
  if (Array.isArray(items)) return items;
  if (typeof items === "string") {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const isOrderInRange = (order, startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const status = String(order?.status || "").toLowerCase();
  const isReleased = status === "claimed" || status === "completed";
  const orderDate = isReleased
    ? order?.claimed_date ||
      order?.updated_at ||
      order?.completed_at ||
      order?.created_at
    : order?.created_at;
  if (!orderDate) return false;
  const d = new Date(orderDate);
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const sDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return dDay >= sDay && dDay <= eDay;
};

/** Build released/unreleased index from orders, optionally filtered by date range. */
const buildOrderQtyIndex = (allOrders, startDate, endDate) => {
  const unreleased = new Map();
  const released = new Map();
  const orders = Array.isArray(allOrders) ? allOrders : [];

  for (const order of orders) {
    if (!isOrderInRange(order, startDate, endDate)) continue;
    const status = String(order?.status || "").toLowerCase();
    const isUnreleased = status === "pending" || status === "processing";
    const isReleased = status === "claimed" || status === "completed";
    if (!isUnreleased && !isReleased) continue;

    const items = parseOrderItems(order.items);
    for (const it of items) {
      const key =
        `${normalizeForMatch(it?.name || "")}|` +
        `${normalizeForMatch(normalizeSize(it?.size || "N/A"))}`;
      const qty = Number(it?.quantity) || 0;
      if (qty <= 0) continue;
      if (isUnreleased) unreleased.set(key, (unreleased.get(key) || 0) + qty);
      else released.set(key, (released.get(key) || 0) + qty);
    }
  }

  return { unreleased, released };
};

// ─── hook ─────────────────────────────────────────────────────────────────────

/**
 * useInventoryHealthStats
 *
 * Mirrors the Inventory page's inventory health computation:
 * - Fetches inventory report with the same startDate/endDate (items filtered by created_at)
 * - Computes releasedQty from orders within the date range
 * - OOS  : endingInventory (beginning + purchases − releasedInRange + returns) ≤ 0
 * - ARP  : not OOS AND status Critical/At Reorder Point AND ending > 0
 *
 * @param {Date|null}  startDate – date range start
 * @param {Date|null}  endDate   – date range end
 * @param {Array|null} allOrders – combined active + claimed orders array
 */
export const useInventoryHealthStats = (
  startDate = null,
  endDate = null,
  allOrders = null,
) => {
  const [stats, setStats] = useState({
    totalItemVariants: 0,
    atReorderPoint: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      // Use the same API call as the Inventory page (items filtered by created_at)
      const result = await inventoryService.getInventoryReport({
        startDate: startDate || null,
        endDate: endDate || null,
      });

      if (result?.success && Array.isArray(result.data) && result.data.length > 0) {
        const rows = result.data.filter(
          (row) =>
            !row.is_archived ||
            row.is_archived === false ||
            row.is_archived === null,
        );

        const totalItemVariants = new Set(
          rows.map((r) => `${r.name || ""}_${r.education_level || ""}`),
        ).size;

        // Filter orders by the same date range (matches Inventory page calculateItemOrderCounts)
        const { released } = buildOrderQtyIndex(allOrders, startDate, endDate);

        const classify = (row) => {
          const beginning = Number(row.beginning_inventory) || 0;
          const purchases = Number(row.purchases) || 0;
          const returns = Number(row.returns) || 0;

          const key =
            `${normalizeForMatch(row.name || "")}|` +
            `${normalizeForMatch(normalizeSize(row.size || "N/A"))}`;
          const releasedQty = released.get(key) || 0;

          // Same rule as Inventory page local useMemo
          const ending = Math.max(beginning + purchases - releasedQty + returns, 0);
          const isOOS = ending <= 0;
          const isARP =
            !isOOS &&
            (row.status === "At Reorder Point" || row.status === "Critical") &&
            ending > 0;

          return { isOOS, isARP };
        };

        const outOfStock = rows.filter((r) => classify(r).isOOS).length;
        const atReorderPoint = rows.filter((r) => classify(r).isARP).length;

        setStats({ totalItemVariants, atReorderPoint, outOfStock });

        console.log("[InventoryHealth] Stats:", { totalItemVariants, atReorderPoint, outOfStock });
      } else {
        setStats({ totalItemVariants: 0, atReorderPoint: 0, outOfStock: 0 });
      }
    } catch (error) {
      console.error("Error fetching inventory health stats:", error);
      setStats({ totalItemVariants: 0, atReorderPoint: 0, outOfStock: 0 });
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, allOrders]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const handler = () => loadStats();
    window.addEventListener(PC_INVENTORY_HEALTH_REFRESH, handler);
    return () => window.removeEventListener(PC_INVENTORY_HEALTH_REFRESH, handler);
  }, [loadStats]);

  return { stats, loading };
};
