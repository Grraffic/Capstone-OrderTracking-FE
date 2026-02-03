import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { subDays } from "date-fns";
import AdminLayout from "../components/layouts/AdminLayout";
import { InventoryHealth } from "../components/shared";
import InventoryView from "../components/Inventory/InventoryView";
import TransactionsView from "../components/Inventory/TransactionsView";
import UpdateQuantityModal from "../components/Inventory/UpdateQuantityModal";
import { useOrders, useInventoryHealthStats } from "../hooks";
import { useSocket } from "../../context/SocketContext";
import inventoryService from "../../services/inventory.service";
import transactionService from "../../services/transaction.service";
import { userAPI } from "../../services/user.service";

/**
 * Inventory Page Component
 *
 * A comprehensive inventory management page featuring:
 * - Sidebar navigation
 * - Header with menu toggle
 * - Stats cards showing inventory metrics
 * - Control bar with date range, Save Input button, and Grade Level dropdown
 * - Data table with inventory items
 * - Pagination controls
 * - Fully responsive design for mobile, tablet, and desktop
 */
const Inventory = () => {
  // Note: AdminLayout handles sidebar state internally
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState(""); // For page number input
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeLevel, setGradeLevel] = useState("all");
  // Initialize activeTab from URL param if present
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get("tab");
    return tabParam === "transaction" ? "transaction" : "inventory";
  });
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  // Transaction pagination state
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const transactionItemsPerPage = 8;
  // Date range state for transactions view only
  // Default to last 30 days to show more transactions
  const today = new Date();
  // Set startDate to beginning of day 30 days ago
  const defaultStartDate = subDays(today, 29);
  defaultStartDate.setHours(0, 0, 0, 0);
  // Set endDate to end of today
  const defaultEndDate = new Date(today);
  defaultEndDate.setHours(23, 59, 59, 999);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  // Inventory data state
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    aboveThreshold: 0,
    atReorderPoint: 0,
    critical: 0,
    outOfStock: 0,
    unreleasedOrders: 0,
    releasedOrders: 0,
  });

  // Fetch all orders to calculate unreleased and released counts
  // Fetch active orders (pending, processing, ready, payment_pending)
  const {
    orders: allActiveOrders,
    loading: activeOrdersLoading,
  } = useOrders({
    page: 1,
    limit: 10000,
    status: null, // Gets active orders: pending, processing, ready, payment_pending
    orderType: null,
    educationLevel: null,
    search: null,
  });

  // Fetch claimed/completed orders separately (backend filters them out when status is null)
  const {
    orders: allClaimedOrders,
    loading: claimedOrdersLoading,
  } = useOrders({
    page: 1,
    limit: 10000,
    status: "claimed", // Explicitly fetch claimed orders
    orderType: null,
    educationLevel: null,
    search: null,
  });

  // Combine all orders for calculations
  const allOrders = useMemo(() => {
    return [
      ...(allActiveOrders || []),
      ...(allClaimedOrders || []),
    ];
  }, [allActiveOrders, allClaimedOrders]);

  const ordersLoading = activeOrdersLoading || claimedOrdersLoading;
  // Transaction data - fetched from API
  const [transactionData, setTransactionData] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  // Calculate pagination for inventory (8 items per page)
  const itemsPerPage = 8;
  const totalPages = Math.ceil(inventoryData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInventoryData = inventoryData.slice(startIndex, endIndex);

  // Fetch inventory health stats (consistent across all pages)
  const { stats: inventoryHealthStats } = useInventoryHealthStats();

  // Update Quantity Modal state
  const [isUpdateQuantityModalOpen, setIsUpdateQuantityModalOpen] =
    useState(false);
  // Set item reorder point Modal state
  const [isSetReorderPointModalOpen, setIsSetReorderPointModalOpen] =
    useState(false);
  const [setReorderPointForm, setSetReorderPointForm] = useState({
    itemName: "",
    variant: "",
    reorderPoint: "",
  });
  const [setReorderPointSaving, setSetReorderPointSaving] = useState(false);
  const [setReorderPointError, setSetReorderPointError] = useState(null);
  const [updateQuantityForm, setUpdateQuantityForm] = useState({
    itemName: "",
    fieldToEdit: "",
    quantity: "",
    variant: "",
    unitPrice: "",
  });

  // Handle Update Quantity form submission
  const handleUpdateQuantity = async () => {
    const form = updateQuantityForm;
    if (form.fieldToEdit === "return") {
      const quantity = Number(form.quantity);
      if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity (greater than 0).");
        return;
      }
      const itemName = (form.itemName || "").trim();
      if (!itemName) {
        alert("Please enter the item name for the return.");
        return;
      }
      const variant = (form.variant || "").trim().toLowerCase();
      const sizeForApi = variant ? form.variant : null;
      const unitPrice = form.unitPrice ? Number(form.unitPrice) : null;

      const normalizeSize = (s) => (s || "").toLowerCase().trim().replace(/\s*\([^)]*\)/g, "").trim();
      const match = inventoryData.find((row) => {
        const nameMatch = (row.item || "").trim().toLowerCase() === itemName.toLowerCase();
        if (!nameMatch) return false;
        const rowSize = (row.size || "N/A").trim();
        if (!variant) return true;
        return normalizeSize(rowSize) === normalizeSize(variant) || rowSize.toLowerCase() === variant;
      });
      if (!match || !match.item_id) {
        alert("Item not found in current inventory. Please enter an item name from the inventory list and select the correct variant.");
        return;
      }

      try {
        const result = await inventoryService.recordReturn(
          match.item_id,
          quantity,
          sizeForApi,
          unitPrice
        );
        if (result?.success) {
          setIsUpdateQuantityModalOpen(false);
          setUpdateQuantityForm({
            itemName: "",
            fieldToEdit: "",
            quantity: "",
            variant: "",
            unitPrice: "",
          });
          fetchInventoryData();
          setTransactionRefreshKey((prev) => prev + 1);
        }
      } catch (err) {
        alert(err.message || "Failed to record return.");
      }
      return;
    }

    console.log("Update Quantity Form:", form);
    setIsUpdateQuantityModalOpen(false);
    setUpdateQuantityForm({
      itemName: "",
      fieldToEdit: "",
      quantity: "",
      variant: "",
      unitPrice: "",
    });
  };

  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateQuantityForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Socket connection for real-time updates
  const { on, off, isConnected } = useSocket();

  // Handle URL search param for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "transaction" && activeTab !== "transaction") {
      setActiveTab("transaction");
    } else if (!tabParam && activeTab === "transaction") {
      // If no tab param and we're on transaction, keep it (don't reset)
      // This allows the tab to persist when navigating
    }
  }, [searchParams, activeTab]);

  // State to trigger transaction refresh
  const [transactionRefreshKey, setTransactionRefreshKey] = useState(0);

  // Function to refresh transactions
  const refreshTransactions = useCallback(() => {
    // Always increment refresh key to trigger fetch when on transaction tab
    setTransactionRefreshKey((prev) => prev + 1);
    console.log("[Inventory] 🔄 Transaction refresh triggered");
  }, []);

  // Map Inventory grade-level dropdown values to DB education_level (so filter matches Items)
  const gradeLevelToEducationLevel = {
    all: null,
    kinder: "Kindergarten",
    elementary: "Elementary",
    junior: "Junior High School",
    senior: "Senior High School",
    college: "College",
  };

  // Fetch inventory data - wrapped in useCallback to fix initialization order
  const fetchInventoryData = useCallback(async () => {
    try {
      setLoading(true);
      console.log("[Inventory] 🔄 Fetching inventory data...");
      console.log(
        `[Inventory] 📦 Orders available: ${allOrders?.length || 0} orders`
      );

      const filters = {
        educationLevel:
          gradeLevelToEducationLevel[gradeLevel] ??
          (gradeLevel !== "all" ? gradeLevel : null),
        search: searchQuery || null,
      };

      const response = await inventoryService.getInventoryReport(filters);

      // Enhanced logging: Log raw response data with all purchases values
      console.log("[Inventory] 📥 Received inventory report response:", {
        success: response.success,
        dataLength: response.data?.length || 0,
        sampleItem: response.data?.[0]
          ? {
              name: response.data[0].name,
              purchases: response.data[0].purchases,
              beginning_inventory: response.data[0].beginning_inventory,
              stock: response.data[0].stock,
            }
          : null,
      });

      // Log all items with purchases > 0 from raw response
      if (response.data && response.data.length > 0) {
        const rawItemsWithPurchases = response.data.filter(
          (item) => (item.purchases || 0) > 0
        );
        if (rawItemsWithPurchases.length > 0) {
          console.log(
            `[Inventory] 📊 Raw response: ${rawItemsWithPurchases.length} items with purchases > 0:`,
            rawItemsWithPurchases.map((item) => ({
              id: item.id,
              name: item.name,
              size: item.size,
              purchases: item.purchases,
              beginning_inventory: item.beginning_inventory,
              stock: item.stock,
            }))
          );
        } else {
          console.log(
            `[Inventory] ⚠️ WARNING: Raw response has ${response.data.length} items but NONE have purchases > 0!`
          );
          // Log first few items to debug
          console.log(
            `[Inventory] 🔍 First 3 items from raw response:`,
            response.data.slice(0, 3).map((item) => ({
              name: item.name,
              size: item.size,
              purchases: item.purchases,
              beginning_inventory: item.beginning_inventory,
            }))
          );
        }
      }

      if (response.success) {
        // Transform API data to match component format
        // Sort by created_at DESC to show newest first (already sorted in backend, but ensure here too)
        const sortedData = [...response.data].sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA; // Descending order (newest first)
        });

        // Calculate order counts per item with date range filtering
        const calculateItemOrderCounts = (itemName, itemSize) => {
          if (!allOrders || allOrders.length === 0) {
            console.log(
              `[Inventory] ⚠️ No orders available for counting (item: ${itemName}, size: ${itemSize})`
            );
            return { unreleased: 0, released: 0 };
          }

          console.log(
            `[Inventory] 🔍 Calculating order counts for "${itemName}" (${itemSize}) - Checking ${allOrders.length} orders`
          );
          console.log(
            `[Inventory] 📅 Date range filter: ${
              startDate ? startDate.toISOString().split("T")[0] : "none"
            } to ${endDate ? endDate.toISOString().split("T")[0] : "none"}`
          );

          let unreleasedCount = 0;
          let releasedCount = 0;
          let matchLog = [];

          allOrders.forEach((order, orderIndex) => {
            // Filter orders by date range if dates are provided
            // For released orders (claimed), use updated_at (when released)
            // For unreleased orders (pending/processing), use created_at (when created)
            // This allows comparing releases across different time periods
            if (startDate || endDate) {
              const status = order.status?.toLowerCase();
              const isReleased = status === "claimed" || status === "completed";

              // Use appropriate date based on order status
              const orderDate = isReleased
                ? order.claimed_date || order.updated_at || order.completed_at || order.created_at // When it was released
                : order.created_at; // When it was created

              if (orderDate) {
                const orderDateObj = new Date(orderDate);
                // Set time to start of day for comparison
                const orderDateOnly = new Date(
                  orderDateObj.getFullYear(),
                  orderDateObj.getMonth(),
                  orderDateObj.getDate()
                );

                if (startDate) {
                  const startDateOnly = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate()
                  );
                  if (orderDateOnly < startDateOnly) {
                    return; // Skip orders before start date
                  }
                }

                if (endDate) {
                  const endDateOnly = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate()
                  );
                  // Include the end date (add 1 day and compare with <)
                  const endDateInclusive = new Date(endDateOnly);
                  endDateInclusive.setDate(endDateInclusive.getDate() + 1);
                  if (orderDateOnly >= endDateInclusive) {
                    return; // Skip orders after end date
                  }
                }
              }
            }
            // Handle both string and array formats for items
            let orderItems = [];
            if (order.items) {
              if (typeof order.items === "string") {
                try {
                  orderItems = JSON.parse(order.items);
                } catch (e) {
                  console.warn(
                    "[Inventory] Failed to parse order items:",
                    e,
                    order.items
                  );
                  orderItems = [];
                }
              } else if (Array.isArray(order.items)) {
                orderItems = order.items;
              }
            }

            // Normalize sizes - handle "Small (S)" vs "Small" vs "S"
            const normalizeSize = (size) => {
              if (!size) return "";
              const match = size.match(/^(.+?)\s*\([A-Z]\)$/i);
              if (match) return match[1].trim();
              return size.trim();
            };

            // Sum quantity of matching items in this order (Unreleased/Released = total quantity, not order count)
            const matchingQuantity = orderItems.reduce((sum, orderItem) => {
              const nameMatch =
                orderItem.name?.toLowerCase().trim() ===
                itemName?.toLowerCase().trim();
              const normalizedOrderSize = normalizeSize(orderItem.size);
              const normalizedItemSize = normalizeSize(itemSize);
              const sizeMatch =
                normalizedOrderSize.toLowerCase() ===
                  normalizedItemSize.toLowerCase() ||
                orderItem.size?.toLowerCase().trim() ===
                  itemSize?.toLowerCase().trim();
              if (nameMatch && sizeMatch) {
                matchLog.push({
                  orderIndex,
                  orderStatus: order.status,
                  orderItem: { name: orderItem.name, size: orderItem.size, quantity: orderItem.quantity },
                  inventoryItem: { name: itemName, size: itemSize },
                });
                return sum + (Number(orderItem.quantity) || 0);
              }
              return sum;
            }, 0);

            if (matchingQuantity > 0) {
              const status = order.status?.toLowerCase();
              // Unreleased: pending or processing orders
              if (status === "pending" || status === "processing") {
                unreleasedCount += matchingQuantity;
              } 
              // Released: claimed or completed orders (both count as released)
              else if (status === "claimed" || status === "completed") {
                releasedCount += matchingQuantity;
              }
            }
          });

          if (matchLog.length > 0 || unreleasedCount > 0 || releasedCount > 0) {
            console.log(
              `[Inventory] ✅ Found matches for "${itemName}" (${itemSize}):`,
              {
                unreleased: unreleasedCount,
                released: releasedCount,
                matches: matchLog,
              }
            );
          }

          return { unreleased: unreleasedCount, released: releasedCount };
        };

        const transformedData = sortedData.map((item, index) => {
          // Store original purchases value before transformation
          const originalPurchases = item.purchases || 0;

          // Log ALL items with purchases > 0 to verify they're being preserved
          if (originalPurchases > 0) {
            console.log(
              `[Inventory] ✅ Item with purchases > 0 (before transformation):`,
              {
                id: item.id,
                name: item.name,
                size: item.size,
                beginning_inventory: item.beginning_inventory,
                purchases: originalPurchases,
                stock: item.stock,
              }
            );
          }

          // Also log items matching Jersey or Dress for debugging
          if (
            item.name?.toLowerCase().includes("jersey") ||
            item.name?.toLowerCase().includes("junior dress") ||
            item.name?.toLowerCase().includes("dress")
          ) {
            console.log(
              `[Inventory] 🔍 Transforming item ${index + 1} (Jersey/Dress):`,
              {
                id: item.id,
                name: item.name,
                size: item.size,
                beginning_inventory: item.beginning_inventory,
                purchases: originalPurchases,
                stock: item.stock,
              }
            );
          }

          // Calculate order counts for this item
          const orderCounts = calculateItemOrderCounts(item.name, item.size);

          // Log order counts for debugging (only for first few items or items with orders)
          if (
            index < 3 ||
            orderCounts.unreleased > 0 ||
            orderCounts.released > 0
          ) {
            console.log(
              `[Inventory] 📦 Order counts for "${item.name}" (${item.size}):`,
              {
                unreleased: orderCounts.unreleased,
                released: orderCounts.released,
                totalOrders: allOrders?.length || 0,
              }
            );
          }

          // Calculate ending inventory: Beginning Inventory + Purchases - Released + Returns
          const beginningInventory = item.beginning_inventory || 0;
          const endingInventory =
            beginningInventory +
            originalPurchases -
            orderCounts.released +
            (item.returns || 0);

          // Calculate available: Ending Inventory - Unreleased
          const available = Math.max(
            endingInventory - orderCounts.unreleased,
            0
          );

          const transformedItem = {
            no: index + 1,
            id: item.id || item.item_id || `${item.name}-${item.size}-${index}`, // Use unique id from backend
            item_id: item.item_id || item.id, // Actual item id for API (set reorder point, etc.)
            item: item.name,
            size: item.size,
            beginningInventory: beginningInventory,
            unreleased: orderCounts.unreleased, // Number of orders (pending/processing) containing this item
            purchases: originalPurchases, // Preserve original purchases value
            released: orderCounts.released, // Number of orders (claimed) containing this item
            returns: item.returns || 0,
            available: available, // Calculated: Ending Inventory - Unreleased
            endingInventory: endingInventory, // Calculated: Beginning Inventory + Purchases - Released + Returns
            unitPrice: item.unit_price || 0,
            unitPriceBeginning: item.unit_price_beginning ?? item.unit_price ?? 0,
            price: item.price != null ? Number(item.price) : undefined,
            totalAmount: item.total_amount || 0,
            status: item.status,
          };

          // Verify purchases were preserved during transformation
          if (
            originalPurchases > 0 &&
            transformedItem.purchases !== originalPurchases
          ) {
            console.error(
              `[Inventory] ❌ CRITICAL: Purchases lost during transformation! Original: ${originalPurchases}, Transformed: ${transformedItem.purchases}`,
              {
                name: item.name,
                size: item.size,
              }
            );
          }

          return transformedItem;
        });

        // Log the final transformed data to verify purchases are included
        const itemsWithPurchases = transformedData.filter(
          (item) => item.purchases > 0
        );
        if (itemsWithPurchases.length > 0) {
          console.log(
            `[Inventory] ✅ Final transformed data - ${itemsWithPurchases.length} items with purchases > 0:`,
            itemsWithPurchases.map((item) => ({
              name: item.item,
              size: item.size,
              purchases: item.purchases,
              beginningInventory: item.beginningInventory,
            }))
          );
        } else {
          console.log(
            `[Inventory] ⚠️ WARNING: No items with purchases > 0 in transformed data!`
          );
          // Additional debugging: Check if raw data had purchases
          const rawItemsWithPurchases =
            response.data?.filter((item) => (item.purchases || 0) > 0) || [];
          if (rawItemsWithPurchases.length > 0) {
            console.error(
              `[Inventory] ❌ CRITICAL: Raw data had ${rawItemsWithPurchases.length} items with purchases, but transformation lost them!`
            );
          }
        }

        // Log summary comparison: raw vs transformed
        const rawPurchasesCount =
          response.data?.filter((item) => (item.purchases || 0) > 0).length ||
          0;
        const transformedPurchasesCount = itemsWithPurchases.length;
        if (rawPurchasesCount !== transformedPurchasesCount) {
          console.error(
            `[Inventory] ❌ Purchases count mismatch: Raw=${rawPurchasesCount}, Transformed=${transformedPurchasesCount}`
          );
        } else if (rawPurchasesCount > 0) {
          console.log(
            `[Inventory] ✅ Purchases count verified: ${rawPurchasesCount} items with purchases preserved through transformation`
          );
        }

        setInventoryData(transformedData);

        // Calculate stats from data
        const calculatedStats = {
          totalItems: response.data.length,
          aboveThreshold: response.data.filter(
            (item) => item.status === "Above Threshold"
          ).length,
          atReorderPoint: response.data.filter(
            (item) => item.status === "At Reorder Point"
          ).length,
          critical: response.data.filter((item) => item.status === "Critical")
            .length,
          outOfStock: response.data.filter(
            (item) => item.status === "Out of Stock"
          ).length,
          unreleasedOrders: 0, // Will be calculated from orders
          releasedOrders: 0, // Will be calculated from orders
        };
        setStats(calculatedStats);
      }
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      // Set empty data on error
      setInventoryData([]);
      setStats({
        totalItems: 0,
        aboveThreshold: 0,
        atReorderPoint: 0,
        critical: 0,
        outOfStock: 0,
        unreleasedOrders: 0,
        releasedOrders: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [gradeLevel, searchQuery, startDate, endDate, allOrders]);

  // Listen for item updates to refresh inventory data and transactions
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Listen for item updates (when stock/purchases are updated)
    const handleItemUpdate = (data) => {
      console.log("📡 [Inventory] Received item update via Socket.IO:", data);
      // Refresh inventory data to show updated purchases
      fetchInventoryData();
      // Refresh transactions if on transaction tab
      if (activeTab === "transaction") {
        refreshTransactions();
      }
    };

    // Listen for item created events (when new items are added)
    const handleItemCreated = (data) => {
      console.log("📡 [Inventory] Received item created event:", data);
      // Refresh inventory data to show new item
      fetchInventoryData();
      // Always refresh transactions (will fetch when user switches to transaction tab)
      // This ensures transactions are ready when user views the tab
      refreshTransactions();
    };

    // Listen for order created events (which may trigger item updates)
    const handleOrderCreated = (data) => {
      console.log("📡 [Inventory] Received order created event:", data);
      // Refresh inventory data
      fetchInventoryData();
      // Refresh transactions if on transaction tab
      if (activeTab === "transaction") {
        refreshTransactions();
      }
    };

    // Listen for order claimed events (when QR code is scanned)
    const handleOrderClaimed = (data) => {
      console.log("📡 [Inventory] Received order claimed event:", data);
      // Refresh inventory data to show updated stock
      fetchInventoryData();
      // Refresh transactions if on transaction tab
      if (activeTab === "transaction") {
        refreshTransactions();
      }
    };

    // Listen for order updated events (when order status changes)
    const handleOrderUpdated = (data) => {
      console.log("📡 [Inventory] Received order updated event:", data);
      // Refresh inventory data to show updated stock
      fetchInventoryData();
      // Refresh transactions if on transaction tab
      if (activeTab === "transaction") {
        refreshTransactions();
      }
    };

    // Listen for item archived events (when items are archived)
    const handleItemArchived = (data) => {
      console.log("📡 [Inventory] Received item archived event:", data);
      // Refresh inventory data to remove archived items
      fetchInventoryData();
    };

    // Register all socket event listeners
    on("item:updated", handleItemUpdate);
    on("item:created", handleItemCreated);
    on("item:archived", handleItemArchived);
    on("order:created", handleOrderCreated);
    on("order:claimed", handleOrderClaimed);
    on("order:updated", handleOrderUpdated);

    // Cleanup on unmount
    return () => {
      off("item:updated", handleItemUpdate);
      off("item:created", handleItemCreated);
      off("item:archived", handleItemArchived);
      off("order:created", handleOrderCreated);
      off("order:claimed", handleOrderClaimed);
      off("order:updated", handleOrderUpdated);
    };
  }, [isConnected, on, off, activeTab, fetchInventoryData, refreshTransactions]);

  // Fetch inventory data
  // Only fetch when orders are loaded (or if ordersLoading is false to avoid waiting forever)
  // Include date range to filter releases by date
  useEffect(() => {
    if (!ordersLoading) {
      fetchInventoryData();
    }
  }, [gradeLevel, searchQuery, startDate, endDate, allOrders, ordersLoading, fetchInventoryData]);

  // Reset to page 1 when inventory data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [inventoryData.length]);

  // Calculate unreleased and released order counts
  useEffect(() => {
    if (allOrders && allOrders.length > 0) {
      console.log(
        `[Inventory] 📦 Loaded ${allOrders.length} orders for counting`
      );

      // Log sample orders to see their structure
      if (allOrders.length > 0) {
        console.log("[Inventory] 📋 Sample order structure:", {
          firstOrder: {
            id: allOrders[0].id,
            status: allOrders[0].status,
            items: allOrders[0].items,
            itemsType: typeof allOrders[0].items,
            itemsIsArray: Array.isArray(allOrders[0].items),
          },
        });
      }

      // Unreleased orders = pending or processing status
      const unreleasedCount = allOrders.filter(
        (order) =>
          order.status?.toLowerCase() === "pending" ||
          order.status?.toLowerCase() === "processing"
      ).length;

      // Released orders = claimed or completed status
      const releasedCount = allOrders.filter((order) => {
        const status = order.status?.toLowerCase();
        return status === "claimed" || status === "completed";
      }).length;

      console.log(
        `[Inventory] 📊 Total order counts - Unreleased: ${unreleasedCount}, Released: ${releasedCount}`
      );

      // Update stats with order counts
      setStats((prevStats) => ({
        ...prevStats,
        unreleasedOrders: unreleasedCount,
        releasedOrders: releasedCount,
      }));
    } else {
      console.log("[Inventory] ⚠️ No orders loaded yet");
      // Reset to 0 if no orders
      setStats((prevStats) => ({
        ...prevStats,
        unreleasedOrders: 0,
        releasedOrders: 0,
      }));
    }
  }, [allOrders]);

  // Refresh inventory data after updates
  const handleInventoryUpdate = () => {
    fetchInventoryData();
  };

  // Helper function to extract item name from action string
  const extractItemNameFromAction = (action) => {
    // Extract item name from action: "ITEM CREATED SHS Men's Polo"
    const itemMatch = action.match(/(?:ITEM CREATED|PURCHASE RECORDED|RETURN RECORDED|ITEM RELEASED|ITEM DETAILS UPDATED)\s+(.+)$/i);
    return itemMatch ? itemMatch[1].trim() : "";
  };

  // Fetch transactions from API
  useEffect(() => {
    console.log("[Inventory] 🔄 Transaction fetch useEffect triggered", {
      activeTab,
      transactionRefreshKey,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
    
    // Early return if not on transaction tab
    if (activeTab !== "transaction") {
      console.log("[Inventory] ⏸️ Not on transaction tab, skipping fetch. Current tab:", activeTab);
      return;
    }
    
    const fetchTransactions = async () => {
      try {
        console.log("[Inventory] 🚀 Starting transaction fetch...");
        setTransactionsLoading(true);
        // Set endDate to end of day to include all transactions created today
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const filters = {
          startDate: startDate,
          endDate: endOfDay,
          limit: 1000, // Get a large number of transactions
        };
        
        console.log("[Inventory] 📤 Fetching transactions with filters:", {
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
          limit: filters.limit,
        });
        
        const response = await transactionService.getTransactions(filters);
        
        console.log("[Inventory] 📊 Transaction fetch response:", {
          success: response.success,
          dataLength: response.data?.length || 0,
          filters: filters,
        });
        
        if (response.success && response.data) {
          console.log("[Inventory] ✅ Received transactions:", response.data.length);
          console.log("[Inventory] 📋 Sample transaction from API:", response.data[0]);
          
          // Helper function to fetch user name with multiple fallback methods
          const fetchUserName = async (tx) => {
            // Try 1: Use stored user_name if valid
            if (tx.user_name && tx.user_name !== "System" && tx.user_name.trim() !== "") {
              return { name: tx.user_name, role: tx.user_role || null };
            }
            
            // Try 2: Fetch by user_id
            if (tx.user_id) {
              try {
                const userResponse = await userAPI.getUserById(tx.user_id);
                if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                  const fetchedName = userResponse.data.data.name;
                  const fetchedRole = userResponse.data.data.role;
                  if (fetchedName && fetchedName !== "System" && fetchedName.trim() !== "") {
                    return { 
                      name: fetchedName, 
                      role: fetchedRole || tx.user_role || null 
                    };
                  }
                }
              } catch (err) {
                console.warn(`[Inventory] Failed to fetch user by ID ${tx.user_id}:`, err);
              }
            }
            
            // Try 3: Fetch by email from metadata
            const emailFromMetadata = tx.metadata?.email || tx.metadata?.student_email;
            if (emailFromMetadata && typeof emailFromMetadata === "string") {
              try {
                // getUserById now supports email lookup if userId is an email
                const userResponse = await userAPI.getUserById(emailFromMetadata);
                if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                  const fetchedName = userResponse.data.data.name;
                  const fetchedRole = userResponse.data.data.role;
                  if (fetchedName && fetchedName !== "System" && fetchedName.trim() !== "") {
                    console.log(`[Inventory] ✅ Found user by email from metadata: ${emailFromMetadata}`);
                    return { 
                      name: fetchedName, 
                      role: fetchedRole || tx.user_role || null 
                    };
                  }
                }
              } catch (err) {
                console.warn(`[Inventory] Failed to fetch user by email ${emailFromMetadata}:`, err);
              }
            }
            
            // Try 4: If user_id looks like an email, try fetching by it
            if (tx.user_id && typeof tx.user_id === "string" && tx.user_id.includes("@")) {
              try {
                const userResponse = await userAPI.getUserById(tx.user_id);
                if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                  const fetchedName = userResponse.data.data.name;
                  const fetchedRole = userResponse.data.data.role;
                  if (fetchedName && fetchedName !== "System" && fetchedName.trim() !== "") {
                    console.log(`[Inventory] ✅ Found user by email (user_id): ${tx.user_id}`);
                    return { 
                      name: fetchedName, 
                      role: fetchedRole || tx.user_role || null 
                    };
                  }
                }
              } catch (err) {
                console.warn(`[Inventory] Failed to fetch user by email (user_id) ${tx.user_id}:`, err);
              }
            }
            
            // Fallback: return stored values or System
            return { 
              name: tx.user_name || "System", 
              role: tx.user_role || null 
            };
          };
          
          // Fetch user names and roles for transactions
          const transactionsWithUsers = await Promise.all(
            response.data.map(async (tx) => {
              const userInfo = await fetchUserName(tx);
              const userName = userInfo.name;
              const userRole = userInfo.role;
              
              // Format role for display
              const formatRole = (role) => {
                if (!role || role === "system" || role === "unknown") return null;
                if (role === "property_custodian") {
                  return "Property Custodian";
                }
                if (role === "finance_staff") {
                  return "Finance Staff";
                }
                if (role === "accounting_staff") {
                  return "Accounting Staff";
                }
                if (role === "department_head") {
                  return "Department Head";
                }
                if (role === "system_admin") {
                  return "System Admin";
                }
                if (role === "student") {
                  return "Student";
                }
                return role
                  .split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
              };
              
              // Transform API data to match component format
              const date = new Date(tx.created_at);
              const formattedDate = date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              });
              const dateTime = `${formattedDate} ${formattedTime}`;

              // Map transaction type to display type (for filtering purposes)
              let displayType = tx.type;
              if (tx.type === "Inventory") {
                if (tx.action.startsWith("PURCHASE RECORDED")) {
                  displayType = "Purchases";
                } else if (tx.action.startsWith("RETURN RECORDED")) {
                  displayType = "Returns";
                } else if (tx.action.startsWith("ITEM RELEASED")) {
                  displayType = "Releases";
                }
              } else if (tx.type === "Item") {
                displayType = "Items";
              }

              // Extract price from metadata if available
              const price = tx.metadata?.unit_price 
                ? `P${tx.metadata.unit_price}` 
                : tx.metadata?.price 
                ? `P${tx.metadata.price}` 
                : null;

              return {
                id: tx.id,
                type: displayType, // Keep for filtering
                dateTime: dateTime,
                user_name: userName, // Preserve user_name field
                user_role: userRole, // Preserve user_role field
                user: `${userName} ${userRole ? formatRole(userRole) : ""}`, // Keep for backward compatibility
                action: tx.action,
                details: tx.details,
                price: price,
                status: displayType, // Use displayType for status (Items, Purchases, Returns, Releases)
                metadata: tx.metadata || {}, // Pass metadata for dynamic formatting
                itemName: tx.metadata?.item_name || extractItemNameFromAction(tx.action),
              };
            })
          );
          
          // Use transactionsWithUsers directly (already transformed with user_name and user_role)
          const transformedTransactions = transactionsWithUsers;

          setTransactionData(transformedTransactions);
          console.log("[Inventory] ✅ Transformed transactions:", transformedTransactions.length);
        } else {
          console.warn("[Inventory] ⚠️ No transaction data in response:", response);
          setTransactionData([]);
        }
      } catch (error) {
        console.error("[Inventory] ❌ Failed to fetch transactions:", error);
        console.error("[Inventory] Error details:", {
          message: error.message,
          stack: error.stack,
        });
        
        // Handle 403 Forbidden errors with user-friendly message
        if (error.message === "Forbidden" || error.message.includes("Forbidden")) {
          console.error("[Inventory] 🔒 Access denied - 403 Forbidden error");
          // Show user-friendly error message
          alert(
            "Access Denied\n\n" +
            "You don't have permission to view transactions. " +
            "Please ensure you are logged in with a Property Custodian account.\n\n" +
            "If you believe this is an error, please contact your administrator."
          );
        } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
          console.error("[Inventory] 🔐 Authentication error - 401 Unauthorized");
          alert(
            "Authentication Error\n\n" +
            "Your session may have expired. Please log out and log back in."
          );
        }
        
        setTransactionData([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    // Always call fetchTransactions since we already checked activeTab above
    console.log("[Inventory] ✅ Calling fetchTransactions...");
    fetchTransactions();
  }, [startDate, endDate, activeTab, transactionRefreshKey]);

  // Filter transactions by type
  const filteredTransactions = transactionData.filter((transaction) => {
    if (transactionTypeFilter === "all") return true;
    // Map filter values to transaction types
    const typeMap = {
      purchases: "Purchases",
      returns: "Returns",
      releases: "Releases",
      items: "Items",
    };
    const filterType = typeMap[transactionTypeFilter] || transactionTypeFilter;
    return (
      transaction.type.toLowerCase() === filterType.toLowerCase()
    );
  });

  // Paginate filtered transactions (8 items per page)
  const transactionTotalPages = Math.ceil(filteredTransactions.length / transactionItemsPerPage);
  const transactionStartIndex = (transactionCurrentPage - 1) * transactionItemsPerPage;
  const transactionEndIndex = transactionStartIndex + transactionItemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(transactionStartIndex, transactionEndIndex);

  // Reset transaction page to 1 when filter changes
  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [transactionTypeFilter, startDate, endDate]);
  
  // Log filtered transactions for debugging
  useEffect(() => {
    if (activeTab === "transaction") {
      console.log("[Inventory] 📊 Transaction display state:", {
        transactionDataCount: transactionData.length,
        filteredTransactionsCount: filteredTransactions.length,
        transactionTypeFilter,
        transactionsLoading,
      });
      if (filteredTransactions.length > 0) {
        console.log("[Inventory] 📋 Sample filtered transaction:", filteredTransactions[0]);
      }
    }
  }, [transactionData, filteredTransactions, transactionTypeFilter, transactionsLoading, activeTab]);

  // Count transactions by type
  const transactionCounts = {
    all: transactionData.length,
    purchases: transactionData.filter((t) => t.type === "Purchases").length,
    returns: transactionData.filter((t) => t.type === "Returns").length,
    releases: transactionData.filter((t) => t.type === "Releases").length,
    items: transactionData.filter((t) => t.type === "Items").length,
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Sync page input value when currentPage changes
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  // Handle page input change
  const handlePageInputChange = (e) => {
    const value = e.target.value;
    // Allow empty string or valid numbers
    if (value === "" || /^\d+$/.test(value)) {
      setPageInputValue(value);
    }
  };

  // Handle page input submission
  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(pageInputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    } else {
      // Reset to current page if invalid
      setPageInputValue(currentPage.toString());
    }
  };

  // Handle page input blur (when user clicks away)
  const handlePageInputBlur = () => {
    const page = parseInt(pageInputValue, 10);
    if (isNaN(page) || page < 1 || page > totalPages) {
      setPageInputValue(currentPage.toString());
    }
  };

  return (
    <AdminLayout showTitle={false} noPadding={true}>
      {/* Inventory Content - SF Pro Medium font */}
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 font-sf-medium">
        {/* Page Header - Title with Search */}
        <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6">
          {/* Desktop Layout: Title left, Tabs and Search right */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-sf-semibold font-semibold tracking-tight">
              <span className="text-[#0C2340]">Inven</span>
              <span className="text-[#E68B00]">tory</span>
            </h1>

            <div className="flex items-center gap-3 xl:gap-4">
              {/* Segmented Control - Inventory and Transaction Tabs */}
              <div className="flex items-center bg-[#0C2340] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-3 xl:px-4 py-1.5 xl:py-2 text-xs xl:text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === "inventory"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab("transaction")}
                  className={`px-3 xl:px-4 py-1.5 xl:py-2 text-xs xl:text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === "transaction"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Transaction
                </button>
              </div>

              {/* Search Bar - Right Side */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 xl:pl-10 pr-3 xl:pr-4 py-2 xl:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent w-64 xl:w-72 shadow-sm text-sm xl:text-base"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 xl:w-5 xl:h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout: Stacked */}
          <div className="lg:hidden">
            <div className="flex flex-col gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-sf-semibold font-semibold tracking-tight">
                <span className="text-[#0C2340]">Inven</span>
                <span className="text-[#E68B00]">tory</span>
              </h1>

              {/* Segmented Control - Inventory and Transaction Tabs */}
              <div className="flex items-center bg-[#0C2340] rounded-lg p-0.5 sm:p-1 w-full">
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`flex-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium rounded-md transition-colors duration-200 text-center ${
                    activeTab === "inventory"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab("transaction")}
                  className={`flex-1 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium rounded-md transition-colors duration-200 text-center ${
                    activeTab === "transaction"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Transaction
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-9 md:pl-10 pr-2.5 sm:pr-3 md:pr-4 py-1.5 sm:py-2 md:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent shadow-sm transition-all duration-200 ease-in-out text-xs sm:text-sm md:text-base"
              />
              <svg
                className="absolute left-2.5 sm:left-3 md:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Inventory Health Section */}
        <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-7 xl:mb-8">
          <InventoryHealth stats={inventoryHealthStats} />
        </div>

        {/* Inventory View */}
        {activeTab === "inventory" && (
          <InventoryView
            stats={stats}
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            gradeLevel={gradeLevel}
            onGradeLevelChange={setGradeLevel}
            onUpdateQuantityClick={() => setIsUpdateQuantityModalOpen(true)}
            onSetReorderPointClick={() => setIsSetReorderPointModalOpen(true)}
            inventoryData={paginatedInventoryData}
            allInventoryData={inventoryData}
            loading={loading}
          />
        )}

        {/* Transactions View */}
        {activeTab === "transaction" && (() => {
          console.log("[Inventory] 🎨 Rendering TransactionsView with props:", {
            filteredTransactionsCount: filteredTransactions.length,
            transactionDataCount: transactionData.length,
            transactionTypeFilter,
            transactionCounts,
            transactionsLoading,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          });
          return (
            <TransactionsView
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              transactionTypeFilter={transactionTypeFilter}
              onTransactionTypeFilterChange={setTransactionTypeFilter}
              transactionCounts={transactionCounts}
              filteredTransactions={paginatedTransactions}
              transactionCurrentPage={transactionCurrentPage}
              transactionPagination={{
                page: transactionCurrentPage,
                limit: transactionItemsPerPage,
                total: filteredTransactions.length,
                totalPages: transactionTotalPages,
              }}
              onTransactionPageChange={setTransactionCurrentPage}
            />
          );
        })()}

        {/* Pagination - Only show for inventory tab and when there's more than 1 page */}
        {activeTab === "inventory" && totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between mt-4">
            {/* Left side - Page info */}
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            
            {/* Right side - Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 text-sm font-medium text-white bg-[#e68b00] border border-[#e68b00] rounded-lg hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e68b00] transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Quantity Modal */}
      <UpdateQuantityModal
        isOpen={isUpdateQuantityModalOpen}
        formData={updateQuantityForm}
        onFormChange={handleFormChange}
        onClose={() => {
          setIsUpdateQuantityModalOpen(false);
          setUpdateQuantityForm({
            itemName: "",
            fieldToEdit: "",
            quantity: "",
            variant: "",
            unitPrice: "",
          });
        }}
        onSubmit={handleUpdateQuantity}
      />

      {/* Set item reorder point Modal */}
      {isSetReorderPointModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col font-sf-medium">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#0C2340]">
                  Set Item Reorder Point
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsSetReorderPointModalOpen(false);
                    setSetReorderPointForm({
                      itemName: "",
                      variant: "",
                      reorderPoint: "",
                    });
                    setSetReorderPointError(null);
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex-shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <form
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setSetReorderPointError(null);
                setSetReorderPointSaving(true);
                try {
                  const row = inventoryData.find(
                    (r) => r.item === setReorderPointForm.itemName && r.size === setReorderPointForm.variant
                  );
                  const itemId = row ? row.item_id || row.id : null;
                  if (!itemId) {
                    throw new Error("Please select an item and variant");
                  }
                  await inventoryService.setReorderPoint(
                    itemId,
                    setReorderPointForm.reorderPoint,
                    setReorderPointForm.variant || undefined
                  );
                  setIsSetReorderPointModalOpen(false);
                  setSetReorderPointForm({ itemName: "", variant: "", reorderPoint: "" });
                  fetchInventoryData();
                  window.dispatchEvent(new CustomEvent("inventory-reorder-point-updated"));
                } catch (err) {
                  setSetReorderPointError(err.message || "Failed to set reorder point");
                } finally {
                  setSetReorderPointSaving(false);
                }
              }}
            >
              {setReorderPointError && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {setReorderPointError}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Item Name</label>
                  <select
                    value={setReorderPointForm.itemName}
                    onChange={(e) => {
                      setSetReorderPointForm((prev) => ({
                        ...prev,
                        itemName: e.target.value,
                        variant: "",
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent"
                    required
                  >
                    <option value="">Enter Item Name</option>
                    {[...new Set(inventoryData.map((r) => r.item))].sort().map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Variant</label>
                  <select
                    value={setReorderPointForm.variant}
                    onChange={(e) =>
                      setSetReorderPointForm((prev) => ({ ...prev, variant: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent"
                    required
                    disabled={!setReorderPointForm.itemName}
                  >
                    <option value="">Choose Variant</option>
                    {setReorderPointForm.itemName &&
                      [...new Set(
                        inventoryData
                          .filter((r) => r.item === setReorderPointForm.itemName)
                          .map((r) => r.size)
                      )].sort().map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Reorder Point</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={setReorderPointForm.reorderPoint}
                    onChange={(e) =>
                      setSetReorderPointForm((prev) => ({
                        ...prev,
                        reorderPoint: e.target.value,
                      }))
                    }
                    placeholder="Enter Reorder Point"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 sm:gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsSetReorderPointModalOpen(false);
                    setSetReorderPointForm({ itemName: "", variant: "", reorderPoint: "" });
                    setSetReorderPointError(null);
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                  disabled={setReorderPointSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#E68B00] text-white rounded-lg hover:bg-[#D67A00] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={setReorderPointSaving}
                >
                  {setReorderPointSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Inventory;
