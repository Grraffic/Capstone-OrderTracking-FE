import { useState, useCallback, useEffect } from "react";
import { useAdminSidebar } from "../common/useAdminSidebar";
import { useOrders } from "../orders/useOrders";
import { useInventoryHealthStats } from "./useInventoryHealthStats";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * useAdminDashboardData Hook
 *
 * Manages admin dashboard state including:
 * - Inventory Health statistics (total item variants, at reorder point, out of stock)
 * - Inventory Alerts (out of stock items)
 * - Order Tracking (pre-orders, claimed, orders counts)
 * - Recent Audits (transactions from inventory)
 * - Sidebar toggle state (uses useAdminSidebar hook for auto-collapse on mobile)
 * - Active tab selection
 * - Loading state for skeleton display
 */
export const useAdminDashboardData = () => {
  // Use the shared sidebar hook which includes auto-collapse on mobile
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();
  const [activeTab, setActiveTab] = useState("Year");
  const [loading, setLoading] = useState(true);

  // Fetch inventory health stats (consistent across all pages)
  const { stats: inventoryHealth } = useInventoryHealthStats();

  // Inventory Alerts (out of stock items)
  const [outOfStockItems, setOutOfStockItems] = useState([]);

  // Order Tracking Stats
  const [orderTracking, setOrderTracking] = useState({
    preOrders: 0,
    claimed: 0,
    orders: 0,
  });

  // Recent Audits (transactions)
  const [recentAudits, setRecentAudits] = useState([]);

  // Fetch all orders to calculate order counts
  const { orders: allOrders, loading: ordersLoading } = useOrders({
    page: 1,
    limit: 10000,
    status: null,
    orderType: null,
    educationLevel: null,
    search: null,
  });

  // Fetch out of stock items
  useEffect(() => {
    const fetchOutOfStockItems = async () => {
      try {
        // Fetch all items and filter by actual stock = 0
        // This ensures we get items that are truly out of stock,
        // regardless of their status field (which might be stale)
        const params = new URLSearchParams({
          limit: "1000", // Fetch more items to filter properly
        });
        const response = await fetch(
          `${API_BASE_URL}/items?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch items");

        const result = await response.json();
        if (result.success && result.data) {
          const outOfStockItems = [];

          // Process each item
          result.data.forEach((item) => {
            // Skip inactive items
            if (item.is_active === false) return;

            // Check if item has JSON size variations in note field
            let hasJsonVariations = false;
            let sizeVariations = [];

            if (item.note) {
              try {
                const parsedNote = JSON.parse(item.note);
                if (
                  parsedNote &&
                  parsedNote._type === "sizeVariations" &&
                  Array.isArray(parsedNote.sizeVariations)
                ) {
                  hasJsonVariations = true;
                  sizeVariations = parsedNote.sizeVariations;
                }
              } catch {
                // Not JSON, continue with regular processing
              }
            }

            if (hasJsonVariations && sizeVariations.length > 0) {
              // Check each size variation
              sizeVariations.forEach((variant) => {
                const variantStock = Number(variant.stock) || 0;
                if (variantStock === 0) {
                  outOfStockItems.push({
                    id: item.id,
                    name: item.name,
                    size: variant.size || "N/A",
                    education_level: item.education_level,
                    stock: 0,
                    isVariant: true,
                  });
                }
              });
            } else {
              // Regular item - check main stock
              if ((item.stock || 0) === 0) {
                outOfStockItems.push({
                  id: item.id,
                  name: item.name,
                  size: item.size || "N/A",
                  education_level: item.education_level,
                  stock: 0,
                  isVariant: false,
                });
              }
            }
          });

          // Get first 3 items for display
          setOutOfStockItems(outOfStockItems.slice(0, 3));

          console.log(
            `[Dashboard] Found ${outOfStockItems.length} out of stock items/variants (stock = 0)`
          );
        }
      } catch (error) {
        console.error("Error fetching out of stock items:", error);
      }
    };

    fetchOutOfStockItems();
  }, []);

  // Calculate order tracking stats from orders with trend calculation
  useEffect(() => {
    if (!ordersLoading && allOrders) {
      console.log(
        `[Dashboard] Calculating order stats from ${allOrders.length} orders`
      );

      // Debug: Log sample orders to check structure
      if (allOrders.length > 0) {
        console.log("[Dashboard] Sample order:", {
          id: allOrders[0].id,
          status: allOrders[0].status,
          order_type: allOrders[0].order_type,
          created_at: allOrders[0].created_at,
          claimed_date: allOrders[0].claimed_date,
        });
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      // Helper function to check if date is in a specific month/year
      const isInMonth = (dateString, month, year) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date.getMonth() === month && date.getFullYear() === year;
      };

      // Calculate current month counts
      const currentMonthPreOrders = allOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() === "pre-order";
        return (
          orderType && isInMonth(order.created_at, currentMonth, currentYear)
        );
      }).length;

      const currentMonthClaimed = allOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        return (
          (status === "claimed" || status === "completed") &&
          isInMonth(
            order.claimed_date || order.updated_at || order.created_at,
            currentMonth,
            currentYear
          )
        );
      }).length;

      const currentMonthOrders = allOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        const isRegular =
          orderType !== "pre-order" &&
          status !== "claimed" &&
          status !== "completed";
        return (
          isRegular && isInMonth(order.created_at, currentMonth, currentYear)
        );
      }).length;

      // Calculate last month counts
      const lastMonthPreOrders = allOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() === "pre-order";
        return (
          orderType && isInMonth(order.created_at, lastMonth, lastMonthYear)
        );
      }).length;

      const lastMonthClaimed = allOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        return (
          (status === "claimed" || status === "completed") &&
          isInMonth(
            order.claimed_date || order.updated_at || order.created_at,
            lastMonth,
            lastMonthYear
          )
        );
      }).length;

      const lastMonthOrders = allOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        const isRegular =
          orderType !== "pre-order" &&
          status !== "claimed" &&
          status !== "completed";
        return (
          isRegular && isInMonth(order.created_at, lastMonth, lastMonthYear)
        );
      }).length;

      // Calculate total counts (all time)
      const totalPreOrders = allOrders.filter(
        (order) => order.order_type?.toLowerCase() === "pre-order"
      ).length;

      const totalClaimed = allOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        return status === "claimed" || status === "completed";
      }).length;

      const totalOrders = allOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        return (
          orderType !== "pre-order" &&
          status !== "claimed" &&
          status !== "completed"
        );
      }).length;

      // Calculate percentage change
      const calculateTrend = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        const change = ((current - previous) / previous) * 100;
        return Math.round(change);
      };

      const trackingData = {
        preOrders: totalPreOrders,
        claimed: totalClaimed,
        orders: totalOrders,
        trends: {
          preOrders: calculateTrend(currentMonthPreOrders, lastMonthPreOrders),
          claimed: calculateTrend(currentMonthClaimed, lastMonthClaimed),
          orders: calculateTrend(currentMonthOrders, lastMonthOrders),
        },
      };

      console.log("[Dashboard] Order tracking stats:", trackingData);
      setOrderTracking(trackingData);
    }
  }, [allOrders, ordersLoading]);

  // Fetch recent transactions (using mock data for now, as transactions API may not be available)
  useEffect(() => {
    // For now, we'll use the transaction data structure from Inventory page
    // In the future, this should fetch from a transactions API endpoint
    const mockTransactions = [
      {
        id: 1,
        type: "Items",
        dateTime: "Nov 12, 2025 09:15 AM",
        user: "Jeremy Amponget (Property Custodian)",
        action: "ITEM CREATED (SHS Men's Polo)",
        details: "Beginning Inventory: 200 units at P100, With 6 Variants",
        status: "Items",
      },
      {
        id: 2,
        type: "Purchases",
        dateTime: "Nov 13, 2025 10:56 AM",
        user: "Jeremy Amponget (Property Custodian)",
        action: "PURCHASE RECORDED (SHS Men's Polo)",
        details: "+100 units at P110, New total ending inventory: 300",
        status: "Purchases",
      },
      {
        id: 3,
        type: "Returns",
        dateTime: "Nov 15, 2025 11:11 AM",
        user: "Jeremy Amponget (Property Custodian)",
        action: "RETURN RECORDED (SHS Men's Polo)",
        details: "+1 unit at P100, New total ending inventory: 301",
        status: "Returns",
      },
    ];
    setRecentAudits(mockTransactions);
  }, []);

  // Set loading to false when all data is loaded
  useEffect(() => {
    if (!ordersLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ordersLoading]);

  // Change active tab
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  return {
    sidebarOpen,
    toggleSidebar,
    activeTab,
    handleTabChange,
    inventoryHealth,
    outOfStockItems,
    orderTracking,
    recentAudits,
    loading,
  };
};
