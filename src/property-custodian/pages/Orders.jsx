import { QrCode, Search, X, CheckCircle } from "lucide-react";
import { subDays, format } from "date-fns";
import AdminLayout from "../components/layouts/AdminLayout";
import DateRangePicker from "../components/common/DateRangePicker";
import OrdersStatsCards from "../components/Orders/OrdersStatsCards";
import OrdersTable from "../components/Orders/OrdersTable";
import QRCodeScannerModal from "../components/Items/QRCodeScannerModal";
import {
  useOrderQRScanner,
  useOrders,
  useSocketOrderUpdates,
  useSearchDebounce,
} from "../hooks";
import useOrdersStats from "../hooks/orders/useOrdersStats";
import useOrdersFilters from "../hooks/orders/useOrdersFilters";
import { EDUCATION_LEVELS, ORDER_STATUS } from "../constants/ordersOptions";
import { useState, useMemo, useEffect, useCallback } from "react";

/**
 * Orders Page Component
 *
 * Comprehensive orders management page for admin section with:
 * - Sidebar navigation
 * - Header with menu toggle
 * - QR code scanner for quick order lookup
 * - Search functionality
 * - Statistics cards in multiple sections:
 *   * 4-column grid: Cost Summary, Status, Education Level, Class & Year
 *   * 2-column grid: Unreleased Quantity, Released Quantity
 *   * 2-column grid: Processing, Claimed
 * - Cascading dropdown filters (Education Level → Class & Year)
 * - Status filter tabs (Processing, Claimed)
 * - Orders table with pagination
 * - Responsive layout
 *
 * Features:
 * - Real-time search filtering
 * - Cascading education level and class/year filters
 * - Status filtering
 * - Pagination with Previous/Next buttons
 * - QR code scanning for quick lookup
 */
const Orders = () => {
  // Note: AdminLayout handles sidebar state internally

  // Orders filters management
  const {
    educationLevelFilter,
    statusFilter,
    searchTerm,
    setEducationLevelFilter,
    setStatusFilter,
    setSearchTerm,
  } = useOrdersFilters();

  // Debounce search term to avoid excessive API calls
  // Trim and ensure it's not empty before debouncing
  const trimmedSearch = searchTerm ? searchTerm.trim() : "";
  const debouncedSearchTerm = useSearchDebounce(trimmedSearch, 500);

  // QR Scanner functionality: scan shows order popup, then user confirms to release
  const {
    qrScannerOpen,
    openQRScanner,
    closeQRScanner,
    closeScannerOnly,
    handleQRCodeScanned,
    processing: qrProcessing,
    error: qrError,
    success: qrSuccess,
    scannedOrder,
    confirmReleaseOrder,
    dismissScannedOrder,
    clearSuccess,
  } = useOrderQRScanner();

  // Active status tab (Pre-orders, Orders, Claimed)
  const [activeStatusTab, setActiveStatusTab] = useState("Orders");

  // Date range state - initialize to "Last 7 days"
  const today = new Date();
  const [startDate, setStartDate] = useState(subDays(today, 6));
  const [endDate, setEndDate] = useState(today);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Match inventory pagination

  // Fetch orders from API with filters
  const {
    orders: apiOrders,
    loading: ordersLoading,
    error: ordersError,
    pagination: apiPagination,
    refetch: refetchOrders,
  } = useOrders({
    page: currentPage,
    limit: itemsPerPage,
    orderType:
      activeStatusTab === "Pre-orders"
        ? "pre-order"
        : activeStatusTab === "Orders"
        ? "regular"
        : null,
    status: activeStatusTab === "Claimed" ? "claimed" : null,
    educationLevel:
      educationLevelFilter !== "All Education Levels"
        ? educationLevelFilter
        : null,
    search: debouncedSearchTerm || null,
  });

  // Transform API orders to match the expected format for the table
  const transformedOrders = useMemo(() => {
    return apiOrders.map((order) => {
      // Get first item for display
      const firstItem =
        order.items && order.items.length > 0 ? order.items[0] : {};
      const hasMoreItems = order.items && order.items.length > 1;

      return {
        id: order.id,
        transactionNo: order.order_number || order.id,
        itemOrdered: firstItem.name || "N/A",
        moreItems: hasMoreItems
          ? `more ${order.items.length - 1} item${
              order.items.length - 1 > 1 ? "s" : ""
            }`
          : "",
        description: firstItem.size || "N/A",
        size: firstItem.size || "N/A",
        name: order.student_name || "N/A",
        gradeOrProgram: order.education_level || "N/A",
        transactionDate: order.order_date
          ? new Date(order.order_date).toLocaleDateString()
          : new Date(order.created_at).toLocaleDateString(),
        status:
          order.status === "pending"
            ? "Processing"
            : order.status === "claimed"
            ? "Claimed"
            : order.status,
        totalAmount: order.total_amount || 0,
        // Keep original data for reference
        originalOrder: order,
      };
    });
  }, [apiOrders]);

  // For backward compatibility, use transformedOrders as mockOrders
  const mockOrders = transformedOrders;

  // API already handles filtering, so we use the orders directly
  // For local filtering (class and year, and date range), we still need to filter
  const filteredOrders = useMemo(() => {
    let filtered = mockOrders;

    // Apply date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((order) => {
        // Use appropriate date based on order status
        // For claimed orders, use claimed_date or updated_at
        // For other orders, use created_at
        const originalOrder = order.originalOrder || {};
        const status = originalOrder.status?.toLowerCase() || order.status?.toLowerCase();
        const isClaimed = status === "claimed";
        
        // Get the date from the original order object
        let orderDate = null;
        if (isClaimed) {
          orderDate = originalOrder.claimed_date || originalOrder.updated_at || originalOrder.created_at;
        } else {
          orderDate = originalOrder.created_at || originalOrder.order_date;
        }

        // If no date found, include the order (don't filter out)
        if (!orderDate) return true;

        try {
          const orderDateObj = new Date(orderDate);
          if (isNaN(orderDateObj.getTime())) return true; // Invalid date, include it

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
              return false; // Exclude orders before start date
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
              return false; // Exclude orders after end date
            }
          }

          return true;
        } catch (e) {
          console.warn("Error parsing order date:", orderDate, e);
          return true; // Include if date parsing fails
        }
      });
    }

    return filtered;
  }, [mockOrders, startDate, endDate]);

  // Calculate statistics from all orders (not just current page)
  const stats = useOrdersStats(mockOrders);

  // Fetch all orders for accurate counts (not paginated)
  // We need to fetch orders with different statuses separately to get accurate counts
  // because the backend filters out claimed/cancelled when status is null
  const { orders: allActiveOrdersForCount } = useOrders({
    page: 1,
    limit: 10000,
    orderType: null,
    status: null, // This gets active orders: pending, processing, ready, payment_pending
    educationLevel: null,
    search: null,
  });

  const { orders: allClaimedOrdersForCount } = useOrders({
    page: 1,
    limit: 10000,
    orderType: null,
    status: "claimed", // Explicitly fetch claimed orders
    educationLevel: null,
    search: null,
  });

  // Calculate order counts for tabs
  const orderCounts = useMemo(() => {
    // Combine active and claimed orders for counting
    const allOrdersForCount = [
      ...(allActiveOrdersForCount || []),
      ...(allClaimedOrdersForCount || []),
    ];

    if (!allOrdersForCount || allOrdersForCount.length === 0) {
      return {
        preOrders: 0,
        orders: 0,
        claimed: 0,
      };
    }

    const allPreOrders = allOrdersForCount.filter(
      (order) => order.order_type === "pre-order"
    ).length;

    const allRegularOrders = allOrdersForCount.filter((order) => {
      const orderType = order.order_type?.toLowerCase() || "regular";
      const status = order.status?.toLowerCase();
      return (
        orderType !== "pre-order" &&
        status !== "claimed" &&
        status !== "cancelled" // Exclude cancelled/voided orders
      );
    }).length;

    const allClaimed = allOrdersForCount.filter((order) => {
      const status = order.status?.toLowerCase();
      return status === "claimed";
    }).length;

    return {
      preOrders: allPreOrders,
      orders: allRegularOrders,
      claimed: allClaimed,
    };
  }, [allActiveOrdersForCount, allClaimedOrdersForCount]);

  // Use API pagination
  const totalPages = apiPagination.totalPages || 1;
  const paginatedOrders = filteredOrders;

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    educationLevelFilter,
    activeStatusTab,
  ]);

  // Handle Socket.IO real-time order updates
  const handleOrderUpdate = useCallback(
    (data) => {
      console.log("📡 Real-time order update received:", data);
      // Refetch orders to show the updated data
      refetchOrders();
    },
    [refetchOrders]
  );

  // Connect to Socket.IO for real-time updates
  useSocketOrderUpdates(handleOrderUpdate);

  // When order is scanned, close only the scanner overlay (keep scannedOrder so confirmation modal shows)
  useEffect(() => {
    if (scannedOrder) {
      closeScannerOnly();
    }
  }, [scannedOrder, closeScannerOnly]);

  // Refetch orders when release succeeds so the order appears under Claimed
  useEffect(() => {
    if (qrSuccess) {
      refetchOrders();
    }
  }, [qrSuccess, refetchOrders]);

  // Close scanner on error after 5 seconds
  useEffect(() => {
    if (qrError) {
      console.log("❌ QR scan error, will close scanner in 5 seconds");
      const timer = setTimeout(() => {
        closeQRScanner();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [qrError, closeQRScanner]);

  return (
    <AdminLayout title="Orders">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header - Title with QR Code and Search */}
        <div className="mb-4 sm:mb-6">
          {/* Desktop Layout: Title left, Controls right */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight">
              <span className="text-[#0C2340]">Or</span>
              <span className="text-[#e68b00]">ders</span>
            </h1>

            {/* QR Scanner and Search Bar - Right Side */}
            <div className="flex items-center gap-3">
              {/* QR Code Scanner Button */}
              <button
                onClick={openQRScanner}
                className="flex items-center justify-center gap-2 px-4 xl:px-5 py-2 xl:py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium shadow-sm text-sm xl:text-base"
              >
                <QrCode size={18} className="xl:w-5 xl:h-5" />
                <span className="hidden xl:inline">Scan QR Code</span>
                <span className="xl:hidden">Scan</span>
              </button>

              {/* Search Bar */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 xl:pl-10 pr-3 xl:pr-4 py-2 xl:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-64 xl:w-72 shadow-sm text-sm xl:text-base"
                />
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout: Stacked */}
          <div className="lg:hidden">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4">
              <span className="text-[#0C2340]">Or</span>
              <span className="text-[#e68b00]">ders</span>
            </h1>

            {/* QR Scanner and Search Bar - Stacked */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              {/* QR Code Scanner Button */}
              <button
                onClick={openQRScanner}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium shadow-sm text-sm sm:text-base"
              >
                <QrCode size={18} className="sm:w-5 sm:h-5" />
                <span>Scan QR Code</span>
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-full shadow-sm text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 sm:mb-6 flex items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setActiveStatusTab("Pre-orders")}
            className={`pb-2 sm:pb-3 font-semibold transition-colors relative text-xs sm:text-sm lg:text-base whitespace-nowrap px-1 sm:px-2 ${
              activeStatusTab === "Pre-orders"
                ? "text-[#e68b00]"
                : "text-[#0C2340] hover:text-[#e68b00]"
            }`}
          >
            <span className="relative inline-block pr-4 sm:pr-5">
              Pre-orders
              <span
                className={`absolute -top-1 -right-0 sm:-top-1.5 sm:-right-1 text-[11px] sm:text-sm font-bold leading-none ${
                  activeStatusTab === "Pre-orders"
                    ? "text-[#e68b00]"
                    : "text-[#0C2340]"
                }`}
              >
                {orderCounts.preOrders}
              </span>
            </span>
            {activeStatusTab === "Pre-orders" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] sm:h-[3px] bg-[#e68b00] rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveStatusTab("Orders")}
            className={`pb-2 sm:pb-3 font-semibold transition-colors relative text-xs sm:text-sm lg:text-base whitespace-nowrap px-1 sm:px-2 ${
              activeStatusTab === "Orders"
                ? "text-[#e68b00]"
                : "text-[#0C2340] hover:text-[#e68b00]"
            }`}
          >
            <span className="relative inline-block pr-4 sm:pr-5">
              Orders
              <span
                className={`absolute -top-1 -right-0 sm:-top-1.5 sm:-right-1 text-[11px] sm:text-sm font-bold leading-none ${
                  activeStatusTab === "Orders"
                    ? "text-[#e68b00]"
                    : "text-[#0C2340]"
                }`}
              >
                {orderCounts.orders}
              </span>
            </span>
            {activeStatusTab === "Orders" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] sm:h-[3px] bg-[#e68b00] rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveStatusTab("Claimed")}
            className={`pb-2 sm:pb-3 font-semibold transition-colors relative text-xs sm:text-sm lg:text-base whitespace-nowrap px-1 sm:px-2 ${
              activeStatusTab === "Claimed"
                ? "text-[#e68b00]"
                : "text-[#0C2340] hover:text-[#e68b00]"
            }`}
          >
            <span className="relative inline-block pr-4 sm:pr-5">
              Claimed
              <span
                className={`absolute -top-1 -right-0 sm:-top-1.5 sm:-right-1 text-[11px] sm:text-sm font-bold leading-none ${
                  activeStatusTab === "Claimed"
                    ? "text-[#e68b00]"
                    : "text-[#0C2340]"
                }`}
              >
                {orderCounts.claimed}
              </span>
            </span>
            {activeStatusTab === "Claimed" && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] sm:h-[3px] bg-[#e68b00] rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* Date Range Selector and Filter Dropdowns - Below Tabs */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Left Side - Date Range Selector */}
          <div className="flex justify-start">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              className="w-full sm:w-auto"
            />
          </div>

          {/* Right Side - Filter Dropdowns */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 sm:gap-4">
            {/* Education Level Dropdown */}
            <select
              value={educationLevelFilter}
              onChange={(e) => setEducationLevelFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto"
              title="Filter by education level"
              aria-label="Education Level"
            >
              {EDUCATION_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State - Show loading overlay on top of existing content */}
        {ordersLoading && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center relative">
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#0C2340] mx-auto mb-3 sm:mb-4"></div>
                <p className="text-sm sm:text-base text-gray-600">
                  Loading orders...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {ordersError && !ordersLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-800 font-medium text-sm sm:text-base">
              Error loading orders
            </p>
            <p className="text-red-600 text-xs sm:text-sm mt-1">
              {ordersError}
            </p>
            <button
              onClick={refetchOrders}
              className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Orders Table - Always shown */}
        {!ordersLoading && !ordersError && (
          <OrdersTable
            orders={paginatedOrders}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            onGoToPage={goToPage}
            onOrderUpdated={refetchOrders}
            onOpenQRScanner={openQRScanner}
          />
        )}

        {/* Results Info */}
        {debouncedSearchTerm && (
          <div className="mt-4 text-sm text-gray-600 px-4 sm:px-0">
            Showing {filteredOrders.length} result
            {filteredOrders.length !== 1 ? "s" : ""} for "{debouncedSearchTerm}"
          </div>
        )}
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScannerModal
        isOpen={qrScannerOpen}
        onClose={closeQRScanner}
        onScan={handleQRCodeScanned}
        processing={qrProcessing}
      />

      {/* Order Details Modal - shows after QR scan with design: Name, Education Level, Transaction No, Order Date, Item Ordered, Size */}
      {scannedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-center px-6 pt-8 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-bold tracking-tight text-center">
                <span className="text-[#0C2340]">Order</span>{" "}
                <span className="text-[#e68b00]">details</span>
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4 pl-6 pr-10 space-y-4">
              {qrError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {qrError}
                </div>
              )}
              <div className="space-y-3 max-w-full">
                <div className="flex gap-4 items-baseline">
                  <span className="text-sm font-semibold text-gray-600 w-[140px] shrink-0">Name:</span>
                  <span className="text-gray-900 text-left">
                    {scannedOrder.student_name ?? scannedOrder.studentName ?? "—"}
                  </span>
                </div>
                <div className="flex gap-4 items-baseline">
                  <span className="text-sm font-semibold text-gray-600 w-[140px] shrink-0">Education Level:</span>
                  <span className="text-gray-900 text-left">
                    {scannedOrder.education_level ?? scannedOrder.educationLevel ?? "—"}
                  </span>
                </div>
                <div className="flex gap-4 items-baseline">
                  <span className="text-sm font-semibold text-gray-600 w-[140px] shrink-0">Transaction No:</span>
                  <span className="font-mono text-gray-900 text-left">
                    {scannedOrder.order_number ?? scannedOrder.orderNumber ?? "—"}
                  </span>
                </div>
                <div className="flex gap-4 items-baseline">
                  <span className="text-sm font-semibold text-gray-600 w-[140px] shrink-0">Order Date:</span>
                  <span className="text-gray-900 text-left">
                    {scannedOrder.order_date || scannedOrder.created_at
                      ? format(
                          new Date(scannedOrder.order_date || scannedOrder.created_at),
                          "MMM d, yyyy"
                        )
                      : "—"}
                  </span>
                </div>
                <div className="flex gap-4 items-start">
                  <span className="text-sm font-semibold text-gray-600 w-[140px] shrink-0 pt-0.5">Item Ordered</span>
                  <div className="text-left">
                    {(() => {
                      const items = scannedOrder.items ?? [];
                      const itemList = Array.isArray(items) ? items : [];
                      if (itemList.length === 0) return <span className="text-gray-500">—</span>;
                      return (
                        <ul className="list-none space-y-0.5 text-gray-900">
                          {itemList.map((item, index) => (
                            <li key={index}>
                              {(item.quantity ?? 0) > 1 && `${item.quantity ?? 0}x `}
                              {item.name ?? item.item_name ?? "Item"}
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex gap-4 items-baseline">
                  <span className="text-sm font-semibold text-gray-600 w-[140px] shrink-0">Size:</span>
                  <span className="text-gray-900 text-left">
                    {(() => {
                      const items = scannedOrder.items ?? [];
                      const itemList = Array.isArray(items) ? items : [];
                      const sizes = itemList
                        .map((i) => i.size)
                        .filter((s) => s && s !== "N/A");
                      const uniqueSizes = [...new Set(sizes)];
                      return uniqueSizes.length > 0 ? uniqueSizes.join(", ") : "—";
                    })()}
                  </span>
                </div>
              </div>
              <div className="pt-2 text-sm text-gray-700 font-medium">
                This size is eligible for releasing.
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={dismissScannedOrder}
                disabled={qrProcessing}
                className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={confirmReleaseOrder}
                disabled={qrProcessing}
                className="px-5 py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {qrProcessing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Release Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Release Success Modal - centered, checkmark, message, X top right */}
      {qrSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button
              onClick={() => {
                clearSuccess();
                refetchOrders();
              }}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <div className="pt-12 pb-8 px-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <p className="text-gray-900 mb-2">
                <strong>{qrSuccess.studentName ?? "—"}</strong> order has been marked as Released on{" "}
                {qrSuccess.releasedAt
                  ? format(new Date(qrSuccess.releasedAt), "MMMM d, yyyy")
                  : format(new Date(), "MMMM d, yyyy")}
                .
              </p>
              <p className="text-gray-600 text-sm">
                Inventory and order records have been updated automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {qrError && (
        <div className="fixed bottom-8 right-8 z-50 max-w-md animate-slide-up">
          <div className="bg-red-50 border-2 border-red-500 rounded-xl shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-red-800 mb-1">
                  QR Scan Failed
                </h4>
                <p className="text-sm text-red-700">{qrError}</p>
              </div>
              <button
                onClick={closeQRScanner}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {qrProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#0C2340] mx-auto mb-4"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Processing Order...
              </h3>
              <p className="text-gray-600 text-sm">
                Updating order status and inventory
              </p>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Orders;
