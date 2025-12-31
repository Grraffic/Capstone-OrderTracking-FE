import React, { useState, useEffect } from "react";
import { subDays } from "date-fns";
import AdminLayout from "../components/layouts/AdminLayout";
import { InventoryHealth } from "../components/shared";
import InventoryView from "../components/Inventory/InventoryView";
import TransactionsView from "../components/Inventory/TransactionsView";
import UpdateQuantityModal from "../components/Inventory/UpdateQuantityModal";
import { useOrders, useInventoryHealthStats } from "../hooks";
import { useSocket } from "../../context/SocketContext";
import inventoryService from "../../services/inventory.service";

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

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeLevel, setGradeLevel] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  // Date range state for transactions view only
  const today = new Date();
  const [startDate, setStartDate] = useState(subDays(today, 6));
  const [endDate, setEndDate] = useState(today);

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
  // Use a very high limit to get all orders, or fetch multiple pages if needed
  const {
    orders: allOrders,
    loading: ordersLoading,
    pagination: ordersPagination,
  } = useOrders({
    page: 1,
    limit: 10000, // Fetch a very large number to get all orders
    status: null, // Get all statuses
    orderType: null,
    educationLevel: null,
    search: null,
  });
  // Transaction data - TODO: Implement when transaction tracking is available
  // For now, using empty array - transactions will be fetched from API later
  const [transactionData, setTransactionData] = useState([
    {
      id: 1,
      type: "Items",
      dateTime: "Nov 12, 2025 09:15 AM",
      user: "Jeremy Amponget Property Custodian",
      action: "ITEM CREATED SHS Men's Polo",
      details: "Beginning Inventory: 200 units at P100 With 6 Variants",
      price: "P100",
    },
    {
      id: 2,
      type: "Purchases",
      dateTime: "Nov 13, 2025 10:56 AM",
      user: "Jeremy Amponget Property Custodian",
      action: "PURCHASE RECORDED SHS Men's Polo",
      details: "+100 units at P110 New total ending inventory: 300",
      price: "P110",
    },
    {
      id: 3,
      type: "Returns",
      dateTime: "Nov 15, 2025 11:11 AM",
      user: "Jeremy Amponget Property Custodian",
      action: "RETURN RECORDED SHS Men's Polo",
      details: "+1 unit at P100 New total ending inventory: 301",
      price: "P100",
    },
    {
      id: 4,
      type: "Items",
      dateTime: "Nov 16, 2025 02:10 PM",
      user: "Jeremy Amponget Property Custodian",
      action: "ITEM DETAILS UPDATED SHS Men's Polo",
      details: "Updated Small Variant Description",
      price: null,
    },
    {
      id: 5,
      type: "Releases",
      dateTime: "Nov 17, 2025 08:56 AM",
      user: "Rafael Ramos Student",
      action: "ITEM RELEASED College Men's Polo",
      details: "-1 unit at P120",
      price: "P120",
    },
    {
      id: 6,
      type: "Releases",
      dateTime: "Nov 17, 2025 08:56 AM",
      user: "Rafael Ramos Student",
      action: "ITEM RELEASED College Men's Pants",
      details: "-1 unit at P130",
      price: "P130",
    },
    {
      id: 7,
      type: "Releases",
      dateTime: "Nov 17, 2025 08:56 AM",
      user: "Rafael Ramos Student",
      action: "ITEM RELEASED Logo Patch",
      details: "-1 unit at P80",
      price: "P80",
    },
  ]);
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
  const [updateQuantityForm, setUpdateQuantityForm] = useState({
    itemName: "",
    fieldToEdit: "",
    quantity: "",
    variant: "",
    unitPrice: "",
  });

  // Handle Update Quantity form submission
  const handleUpdateQuantity = () => {
    console.log("Update Quantity Form:", updateQuantityForm);
    // Handle form submission here - add your API call or logic
    setIsUpdateQuantityModalOpen(false);
    // Reset form
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

  // Listen for item updates to refresh inventory data
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Listen for item updates (when stock/purchases are updated)
    const handleItemUpdate = (data) => {
      console.log("📡 [Inventory] Received item update via Socket.IO:", data);
      // Refresh inventory data to show updated purchases
      fetchInventoryData();
    };

    // Listen for order created events (which may trigger item updates)
    const handleOrderCreated = (data) => {
      console.log("📡 [Inventory] Received order created event:", data);
      // Refresh inventory data
      fetchInventoryData();
    };

    on("item:updated", handleItemUpdate);
    on("order:created", handleOrderCreated);

    // Cleanup on unmount
    return () => {
      off("item:updated", handleItemUpdate);
      off("order:created", handleOrderCreated);
    };
  }, [isConnected, on, off]);

  // Fetch inventory data
  // Only fetch when orders are loaded (or if ordersLoading is false to avoid waiting forever)
  // Include date range to filter releases by date
  useEffect(() => {
    if (!ordersLoading) {
      fetchInventoryData();
    }
  }, [gradeLevel, searchQuery, startDate, endDate, allOrders, ordersLoading]);

  // Reset to page 1 when inventory data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [inventoryData.length]);

  const fetchInventoryData = async () => {
    try {
      // Only show loading skeleton on initial load, not during search/filter
      // This prevents page shaking during search
      const isInitialLoad = inventoryData.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        // Show subtle loading indicator during search/filter
        setLoading(true);
      }
      console.log("[Inventory] 🔄 Fetching inventory data...");
      console.log(
        `[Inventory] 📦 Orders available: ${allOrders?.length || 0} orders`
      );

      const filters = {
        educationLevel: gradeLevel !== "all" ? gradeLevel : null,
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
            // For released orders (completed/claimed), use updated_at (when released)
            // For unreleased orders (pending/processing), use created_at (when created)
            // This allows comparing releases across different time periods
            if (startDate || endDate) {
              const status = order.status?.toLowerCase();
              const isReleased = status === "completed" || status === "claimed";

              // Use appropriate date based on order status
              const orderDate = isReleased
                ? order.updated_at || order.completed_at || order.created_at // When it was released
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

            // Check if this order contains the item
            const hasItem = orderItems.some((orderItem) => {
              // Normalize sizes - handle "Small (S)" vs "Small" vs "S"
              const normalizeSize = (size) => {
                if (!size) return "";
                // Extract base size from "Small (S)" format
                const match = size.match(/^(.+?)\s*\([A-Z]\)$/i);
                if (match) return match[1].trim();
                return size.trim();
              };

              // Match by name (case-insensitive)
              const nameMatch =
                orderItem.name?.toLowerCase().trim() ===
                itemName?.toLowerCase().trim();

              // Match by size (normalize both for comparison)
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
                  orderItem: { name: orderItem.name, size: orderItem.size },
                  inventoryItem: { name: itemName, size: itemSize },
                });
              }

              return nameMatch && sizeMatch;
            });

            if (hasItem) {
              const status = order.status?.toLowerCase();
              if (status === "pending" || status === "processing") {
                unreleasedCount++;
              } else if (status === "completed" || status === "claimed") {
                releasedCount++;
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
            item: item.name,
            size: item.size,
            beginningInventory: beginningInventory,
            unreleased: orderCounts.unreleased, // Number of orders (pending/processing) containing this item
            purchases: originalPurchases, // Preserve original purchases value
            released: orderCounts.released, // Number of orders (completed/claimed) containing this item
            returns: item.returns || 0,
            available: available, // Calculated: Ending Inventory - Unreleased
            endingInventory: endingInventory, // Calculated: Beginning Inventory + Purchases - Released + Returns
            unitPrice: item.unit_price || 0,
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
  };

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

      // Released orders = completed or claimed status
      const releasedCount = allOrders.filter(
        (order) =>
          order.status?.toLowerCase() === "completed" ||
          order.status?.toLowerCase() === "claimed"
      ).length;

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

  // Filter transactions by type
  const filteredTransactions = transactionData.filter((transaction) => {
    if (transactionTypeFilter === "all") return true;
    return (
      transaction.type.toLowerCase() === transactionTypeFilter.toLowerCase()
    );
  });

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

  return (
    <AdminLayout showTitle={false} noPadding={true}>
      {/* Inventory Content */}
      <div className="p-4 sm:p-5 md:p-6 lg:p-8">
        {/* Page Header - Title with Search */}
        <div className="mb-4 sm:mb-5 md:mb-6">
          {/* Desktop Layout: Title left, Tabs and Search right */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight">
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                <span className="text-[#0C2340]">Inven</span>
                <span className="text-[#E68B00]">tory</span>
              </h1>

              {/* Segmented Control - Inventory and Transaction Tabs - Right Side */}
              <div className="flex items-center bg-[#0C2340] rounded-lg p-1 w-full sm:w-fit sm:ml-0">
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 text-center ${
                    activeTab === "inventory"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab("transaction")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 text-center ${
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
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent shadow-sm transition-all duration-200 ease-in-out text-sm sm:text-base"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
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
        <div className="mb-6 sm:mb-7 md:mb-8">
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
            inventoryData={paginatedInventoryData}
            loading={loading}
          />
        )}

        {/* Transactions View */}
        {activeTab === "transaction" && (
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
            filteredTransactions={filteredTransactions}
          />
        )}

        {/* Pagination - Only show for inventory tab and when there's more than 1 page */}
        {activeTab === "inventory" && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-2 sm:px-4 py-3 mt-4 sm:mt-6">
            <div className="text-xs sm:text-sm md:text-base text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-medium rounded-lg border transition-colors duration-200 ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-medium rounded-lg border transition-colors duration-200 ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-[#E68B00] text-white border-[#E68B00] hover:bg-[#D67A00]"
                }`}
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
    </AdminLayout>
  );
};

export default Inventory;
