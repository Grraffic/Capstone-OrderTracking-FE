import { useState, useCallback, useEffect } from "react";
import { useAdminSidebar } from "../common/useAdminSidebar";
import { useOrders } from "../orders/useOrders";
import { useInventoryHealthStats } from "./useInventoryHealthStats";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  const [recentAuditsLoading, setRecentAuditsLoading] = useState(true);

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
          status === "claimed" &&
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
          status !== "claimed";
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
          status === "claimed" &&
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
          status !== "claimed";
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
        return status === "claimed";
      }).length;

      const totalOrders = allOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        return (
          orderType !== "pre-order" &&
          status !== "claimed"
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

  // Fetch recent transactions for Recent Audits section
  const fetchRecentAudits = useCallback(async () => {
    try {
      setRecentAuditsLoading(true);
      
      // Get transactions from the last 30 days, limit to 15 most recent
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const filters = {
        startDate: startDate,
        endDate: endDate,
        limit: 5, // Show 5 most recent transactions
      };

      // Import transactionService dynamically to avoid circular dependencies
      const transactionService = (await import("../../../services/transaction.service")).default;
      const response = await transactionService.getTransactions(filters);

      if (response.success && response.data && response.data.length > 0) {
        // Transform API data to match RecentAudits component format
        const transformedTransactions = response.data.map((tx) => {
          // Format date and time
          const date = new Date(tx.created_at);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const formattedTime = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });
          const dateTime = `${formattedDate} ${formattedTime}`;

          // Format user name and role
          const userRole = tx.user_role === "property_custodian" 
            ? "Property Custodian" 
            : tx.user_role === "student" 
            ? "Student" 
            : tx.user_role === "system_admin" 
            ? "System Admin" 
            : tx.user_role || "";
          const user = tx.user_name 
            ? `${tx.user_name}${userRole ? ` (${userRole})` : ""}` 
            : userRole || "Unknown User";

          // Map transaction type to display type (for status column)
          let displayType = tx.type;
          if (tx.type === "Inventory") {
            if (tx.action?.startsWith("PURCHASE RECORDED")) {
              displayType = "Purchases";
            } else if (tx.action?.startsWith("RETURN RECORDED")) {
              displayType = "Returns";
            } else if (tx.action?.startsWith("ITEM RELEASED")) {
              displayType = "Releases";
            } else {
              displayType = "Items";
            }
          } else if (tx.type === "Item") {
            displayType = "Items";
          }

          return {
            id: tx.id,
            dateTime: dateTime,
            user: user,
            action: tx.action || "N/A",
            details: tx.details || "No details available",
            status: displayType,
          };
        });

        setRecentAudits(transformedTransactions);
      } else {
        // If no transactions, set empty array
        setRecentAudits([]);
      }
    } catch (error) {
      console.error("Error fetching recent audits:", error);
      // On error, set empty array (don't show mock data)
      setRecentAudits([]);
    } finally {
      setRecentAuditsLoading(false);
    }
  }, []);

  // Fetch recent transactions on mount
  useEffect(() => {
    fetchRecentAudits();
  }, [fetchRecentAudits]);

  // Set loading to false when all data is loaded
  useEffect(() => {
    if (!ordersLoading && !recentAuditsLoading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ordersLoading, recentAuditsLoading]);

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
