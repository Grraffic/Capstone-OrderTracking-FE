import { useState, useCallback, useEffect, useMemo } from "react";
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
 * 
 * @param {Date} startDate - Start date for filtering data
 * @param {Date} endDate - End date for filtering data
 */
export const useAdminDashboardData = (startDate, endDate) => {
  // Use the shared sidebar hook which includes auto-collapse on mobile
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();
  const [activeTab, setActiveTab] = useState("Year");
  const [loading, setLoading] = useState(true);

  // Fetch inventory health stats (consistent across all pages) with date range
  const { stats: inventoryHealth } = useInventoryHealthStats(startDate, endDate);

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

  // Fetch active orders (pending, processing, ready, payment_pending)
  const { orders: allActiveOrders, loading: activeOrdersLoading } = useOrders({
    page: 1,
    limit: 10000,
    orderType: null,
    status: null, // Gets active orders: pending, processing, ready, payment_pending
    educationLevel: null,
    search: null,
  });

  // Fetch claimed orders separately (they're excluded when status is null)
  const { orders: allClaimedOrders, loading: claimedOrdersLoading } = useOrders({
    page: 1,
    limit: 10000,
    orderType: null,
    status: "claimed", // Explicitly fetch claimed orders
    educationLevel: null,
    search: null,
  });

  // Combine active and claimed orders for dashboard calculations
  const allOrders = useMemo(() => {
    return [
      ...(allActiveOrders || []),
      ...(allClaimedOrders || []),
    ];
  }, [allActiveOrders, allClaimedOrders]);

  const ordersLoading = activeOrdersLoading || claimedOrdersLoading;

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

            // Filter by date range if provided
            if (startDate && endDate && item.created_at) {
              if (!isDateInRange(item.created_at, startDate, endDate)) {
                return; // Skip items outside date range
              }
            }

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
  }, [startDate, endDate]);

  // Helper function to normalize date to start of day (00:00:00.000)
  const normalizeToStartOfDay = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  };

  // Helper function to normalize date to end of day (23:59:59.999)
  const normalizeToEndOfDay = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  };

  // Helper function to check if date is within range
  const isDateInRange = (dateString, start, end) => {
    if (!dateString || !start || !end) return true; // If no date range, include all
    const date = new Date(dateString);
    const normalizedStart = normalizeToStartOfDay(start);
    const normalizedEnd = normalizeToEndOfDay(end);
    const normalizedDate = normalizeToStartOfDay(date);
    // Compare dates at day level (ignore time)
    return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!allOrders || !startDate || !endDate) return allOrders || [];
    return allOrders.filter((order) => {
      // For pre-orders and regular orders, use created_at
      // For claimed orders, use claimed_date or updated_at or created_at
      const orderDate = order.status?.toLowerCase() === "claimed"
        ? (order.claimed_date || order.updated_at || order.created_at)
        : order.created_at;
      return isDateInRange(orderDate, startDate, endDate);
    });
  }, [allOrders, startDate, endDate]);

  // Calculate order tracking stats from orders with trend calculation
  useEffect(() => {
    if (!ordersLoading && filteredOrders) {
      console.log(
        `[Dashboard] Calculating order stats from ${filteredOrders.length} orders (filtered by date range)`
      );

      // Debug: Log sample orders to check structure
      if (filteredOrders.length > 0) {
        console.log("[Dashboard] Sample order:", {
          id: filteredOrders[0].id,
          status: filteredOrders[0].status,
          order_type: filteredOrders[0].order_type,
          created_at: filteredOrders[0].created_at,
          claimed_date: filteredOrders[0].claimed_date,
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

      // Calculate current month counts (from filtered orders)
      const currentMonthPreOrders = filteredOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() === "pre-order";
        return (
          orderType && isInMonth(order.created_at, currentMonth, currentYear)
        );
      }).length;

      const currentMonthClaimed = filteredOrders.filter((order) => {
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

      const currentMonthOrders = filteredOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        const isRegular =
          orderType !== "pre-order" &&
          status !== "claimed";
        return (
          isRegular && isInMonth(order.created_at, currentMonth, currentYear)
        );
      }).length;

      // Calculate last month counts (from filtered orders)
      const lastMonthPreOrders = filteredOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() === "pre-order";
        return (
          orderType && isInMonth(order.created_at, lastMonth, lastMonthYear)
        );
      }).length;

      const lastMonthClaimed = filteredOrders.filter((order) => {
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

      const lastMonthOrders = filteredOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        const isRegular =
          orderType !== "pre-order" &&
          status !== "claimed";
        return (
          isRegular && isInMonth(order.created_at, lastMonth, lastMonthYear)
        );
      }).length;

      // Calculate total counts (from filtered orders within date range)
      const totalPreOrders = filteredOrders.filter(
        (order) => order.order_type?.toLowerCase() === "pre-order"
      ).length;

      const totalClaimed = filteredOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        return status === "claimed";
      }).length;

      const totalOrders = filteredOrders.filter((order) => {
        const orderType = order.order_type?.toLowerCase() || "regular";
        const status = order.status?.toLowerCase();
        return (
          orderType !== "pre-order" &&
          status !== "claimed"
        );
      }).length;

      // Calculate percentage change (capped at 100% maximum for increases only)
      const calculateTrend = (current, previous) => {
        if (previous === 0) {
          const result = current > 0 ? 100 : 0;
          console.log(`[Trend] Previous=0, Current=${current}, Result=${result}`);
          return result;
        }
        const change = ((current - previous) / previous) * 100;
        const rounded = Math.round(change);
        // Only cap positive increases at 100%, negative values (decreases) are not capped
        const result = rounded > 0 ? Math.min(100, rounded) : rounded;
        console.log(`[Trend] Current=${current}, Previous=${previous}, Change=${change.toFixed(2)}%, Rounded=${rounded}, Final=${result}`);
        return result;
      };

      const preOrdersTrend = calculateTrend(currentMonthPreOrders, lastMonthPreOrders);
      const claimedTrend = calculateTrend(currentMonthClaimed, lastMonthClaimed);
      const ordersTrend = calculateTrend(currentMonthOrders, lastMonthOrders);

      const trackingData = {
        preOrders: totalPreOrders,
        claimed: totalClaimed,
        orders: totalOrders,
        trends: {
          preOrders: preOrdersTrend,
          claimed: claimedTrend,
          orders: ordersTrend,
        },
      };

      console.log("[Dashboard] Order tracking stats:", trackingData);
      console.log("[Dashboard] Trend details:", {
        preOrders: { current: currentMonthPreOrders, last: lastMonthPreOrders, trend: preOrdersTrend },
        claimed: { current: currentMonthClaimed, last: lastMonthClaimed, trend: claimedTrend },
        orders: { current: currentMonthOrders, last: lastMonthOrders, trend: ordersTrend },
      });
      setOrderTracking(trackingData);
    }
  }, [filteredOrders, ordersLoading]);

  // Fetch recent transactions for Recent Audits section
  const fetchRecentAudits = useCallback(async () => {
    try {
      setRecentAuditsLoading(true);
      
      // Use the date range from props, or default to last 30 days
      const filterStartDate = startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d;
      })();
      const filterEndDate = endDate || new Date();
      
      // Normalize dates to ensure proper comparison
      // Use local dates to match the date picker's timezone
      // Set startDate to beginning of day (00:00:00.000) in local time
      const normalizedStartDate = new Date(
        filterStartDate.getFullYear(),
        filterStartDate.getMonth(),
        filterStartDate.getDate(),
        0, 0, 0, 0
      );
      
      // Set endDate to end of day (23:59:59.999) in local time
      const normalizedEndDate = new Date(
        filterEndDate.getFullYear(),
        filterEndDate.getMonth(),
        filterEndDate.getDate(),
        23, 59, 59, 999
      );
      
      console.log("[Dashboard] 📅 Filtering Recent Audits by date range:", {
        originalStartDate: filterStartDate.toISOString(),
        originalEndDate: filterEndDate.toISOString(),
        normalizedStartDate: normalizedStartDate.toISOString(),
        normalizedEndDate: normalizedEndDate.toISOString(),
        startDateLocal: normalizedStartDate.toLocaleString(),
        endDateLocal: normalizedEndDate.toLocaleString(),
      });
      
      const filters = {
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        limit: 100, // Fetch more to filter client-side if needed
      };

      // Import transactionService dynamically to avoid circular dependencies
      const transactionService = (await import("../../../services/transaction.service")).default;
      const response = await transactionService.getTransactions(filters);

      if (response.success && response.data && response.data.length > 0) {
        console.log("[Dashboard] 📥 Received transactions from API:", response.data.length);
        
        // Additional client-side filtering to ensure dates are within range
        // Use the isDateInRange helper function for consistent date comparison
        const filteredTransactions = response.data.filter((tx) => {
          if (!tx.created_at) return false;
          
          // Use the same date range helper function for consistency
          const isInRange = isDateInRange(tx.created_at, normalizedStartDate, normalizedEndDate);
          
          if (!isInRange) {
            console.log("[Dashboard] ⚠️ Transaction filtered out:", {
              txDate: tx.created_at,
              txDateLocal: new Date(tx.created_at).toLocaleString(),
              startDateLocal: normalizedStartDate.toLocaleString(),
              endDateLocal: normalizedEndDate.toLocaleString(),
            });
          }
          
          return isInRange;
        });
        
        console.log("[Dashboard] ✅ Filtered transactions count:", filteredTransactions.length);

        // Limit to 5 most recent after filtering
        const limitedTransactions = filteredTransactions.slice(0, 5);
        
        // Transform API data to match RecentAudits component format
        const transformedTransactions = limitedTransactions.map((tx) => {
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

          // Format user name and role - keep them separate for display
          const userName = tx.user_name || "System";
          const userRole = tx.user_role || "system";

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
            user: userName, // Keep for backward compatibility
            user_name: userName, // Pass separately for new display format
            user_role: userRole, // Pass separately for new display format
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

  // Fetch recent transactions on mount and when date range changes
  useEffect(() => {
    fetchRecentAudits();
  }, [fetchRecentAudits, startDate, endDate]);

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
