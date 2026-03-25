import { useCallback, useEffect, useMemo, useState } from "react";
import inventoryService from "../../../services/inventory.service";

const normalizeSizeLabel = (size) => {
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

/**
 * Inventory computed rows used by InventoryHealth sections on Items/Dashboard.
 *
 * Mirrors the Inventory page approach:
 * - Items fetched with startDate/endDate (filtered by created_at on backend)
 * - Released/unreleased counts filtered by the same date range
 */
export function useInventoryComputedRows(startDate, endDate, allOrders) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderQtyIndex = useMemo(() => {
    const orders = Array.isArray(allOrders) ? allOrders : [];
    const unreleased = new Map();
    const released = new Map();

    for (const order of orders) {
      // Filter orders by the same date range as the inventory report API call
      if (!isOrderInRange(order, startDate, endDate)) continue;
      const status = String(order?.status || "").toLowerCase();
      const isUnreleased = status === "pending" || status === "processing";
      const isReleased = status === "claimed" || status === "completed";
      if (!isUnreleased && !isReleased) continue;

      const items = parseOrderItems(order.items);
      for (const it of items) {
        const nameKey = normalizeForMatch(it?.name || "");
        const sizeKey = normalizeForMatch(normalizeSizeLabel(it?.size || "N/A"));
        const key = `${nameKey}|${sizeKey}`;
        const qty = Number(it?.quantity) || 0;
        if (qty <= 0) continue;
        if (isUnreleased) {
          unreleased.set(key, (unreleased.get(key) || 0) + qty);
        } else if (isReleased) {
          released.set(key, (released.get(key) || 0) + qty);
        }
      }
    }
    return { unreleased, released };
  }, [allOrders, startDate, endDate]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Pass date params — matches how Inventory page calls getInventoryReport
      const result = await inventoryService.getInventoryReport({
        startDate: startDate || null,
        endDate: endDate || null,
      });
      const apiRows = Array.isArray(result?.data) ? result.data : [];

      const transformed = apiRows.map((item, index) => {
        const beginningInventory = Number(item.beginning_inventory) || 0;
        const purchases = Number(item.purchases) || 0;
        const returns = Number(item.returns) || 0;

        const nameKey = normalizeForMatch(item.name || "");
        const sizeKey = normalizeForMatch(normalizeSizeLabel(item.size || "N/A"));
        const idxKey = `${nameKey}|${sizeKey}`;
        const releasedQty = orderQtyIndex.released.get(idxKey) || 0;
        const unreleasedQty = orderQtyIndex.unreleased.get(idxKey) || 0;

        const rawEnding =
          beginningInventory + purchases - releasedQty + (Number(returns) || 0);
        const endingInventory = Math.max(rawEnding, 0);
        const available = Math.max(endingInventory - unreleasedQty, 0);

        return {
          no: index + 1,
          id: item.id || item.item_id || `${item.name}-${item.size}-${index}`,
          item_id: item.item_id || item.id,
          item: item.name,
          educationLevel: item.education_level || "",
          size: item.size || "N/A",
          beginningInventory,
          purchases,
          released: releasedQty,
          unreleased: unreleasedQty,
          returns: Number(item.returns) || 0,
          available,
          endingInventory,
          unitPrice: item.unit_price != null ? Number(item.unit_price) : 0,
          price: item.price != null ? Number(item.price) : 0,
          status: item.status || "",
        };
      });

      setRows(transformed);
    } catch (e) {
      setError(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, orderQtyIndex.released, orderQtyIndex.unreleased]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, refetch: load };
}
