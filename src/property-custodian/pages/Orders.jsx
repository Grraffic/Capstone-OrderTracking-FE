import { QrCode, Search, X, CheckCircle } from "lucide-react";
import { subDays, format } from "date-fns";
import { createPortal } from "react-dom";
import AdminLayout from "../components/layouts/AdminLayout";
import DateRangePicker from "../components/common/DateRangePicker";
import OrdersStatsCards from "../components/Orders/OrdersStatsCards";
import OrdersTable from "../components/Orders/OrdersTable";
import QRCodeScannerModal from "../components/Items/QRCodeScannerModal";
import OrdersSkeleton from "../components/Skeleton/pages/OrdersSkeleton";
import {
  useOrderQRScanner,
  useOrders,
  useSocketOrderUpdates,
  useSearchDebounce,
} from "../hooks";
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
    searchTerm,
    setEducationLevelFilter,
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

  // Reset pagination when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatusTab]);

  // Date range state - initialize to null (show all orders by default)
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  // Responsive items per page: 3 for mobile, 8 for larger screens
  const [itemsPerPage, setItemsPerPage] = useState(8);
  
  // Update items per page based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth < 640 ? 3 : 8);
    };
    
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

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

  // Debug: Log API orders
  useEffect(() => {
    console.log(`[Orders] API returned ${apiOrders.length} orders for tab: ${activeStatusTab}`, {
      orderType: activeStatusTab === "Pre-orders" ? "pre-order" : activeStatusTab === "Orders" ? "regular" : null,
      status: activeStatusTab === "Claimed" ? "claimed" : null,
      orders: apiOrders.map(o => ({ id: o.id, status: o.status, order_type: o.order_type }))
    });
  }, [apiOrders, activeStatusTab]);

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

    // Apply date range filter only if both dates are set
    // If date range is not set or invalid, show all orders
    if (startDate && endDate) {
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
        if (!orderDate) {
          console.warn("Order missing date, including it:", order.id);
          return true;
        }

        try {
          const orderDateObj = new Date(orderDate);
          if (isNaN(orderDateObj.getTime())) {
            console.warn("Invalid order date, including order:", order.id, orderDate);
            return true; // Invalid date, include it
          }

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

    // Debug: Log filtered results
    console.log(`[Orders] Filtered orders: ${filtered.length} out of ${mockOrders.length} (tab: ${activeStatusTab}, date range: ${startDate ? format(startDate, 'MMM d') : 'none'} - ${endDate ? format(endDate, 'MMM d') : 'none'})`);

    return filtered;
  }, [mockOrders, startDate, endDate, activeStatusTab]);

  // Fetch all orders for accurate counts (not paginated)
  // We need to fetch orders separately by type to get accurate counts
  // because the backend filters differently when orderType is set vs null
  const { orders: allPreOrdersForCount } = useOrders({
    page: 1,
    limit: 10000,
    orderType: "pre-order", // Fetch all pre-orders (except cancelled)
    status: null,
    educationLevel: null,
    search: null,
  });

  const { orders: allRegularOrdersForCount } = useOrders({
    page: 1,
    limit: 10000,
    orderType: "regular", // Fetch all regular orders (except cancelled and claimed)
    status: null,
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
    // Count pre-orders (all pre-orders except cancelled are already fetched)
    const allPreOrders = (allPreOrdersForCount || []).filter(
      (order) => {
        const status = order.status?.toLowerCase();
        return status !== "cancelled";
      }
    ).length;

    // Count regular orders (all regular orders except cancelled and claimed are already fetched)
    const allRegularOrders = (allRegularOrdersForCount || []).filter((order) => {
      const status = order.status?.toLowerCase();
      return status !== "claimed" && status !== "cancelled";
    }).length;

    // Count claimed orders (all claimed orders are already fetched)
    const allClaimed = (allClaimedOrdersForCount || []).length;

    // Calculate total: pre-orders + regular orders + claimed orders
    const total = allPreOrders + allRegularOrders + allClaimed;

    console.log(`📊 Order Counts: Pre-orders: ${allPreOrders}, Regular: ${allRegularOrders}, Claimed: ${allClaimed}, Total: ${total}`);

    return {
      preOrders: allPreOrders,
      orders: allRegularOrders,
      claimed: allClaimed,
      total: total,
    };
  }, [allPreOrdersForCount, allRegularOrdersForCount, allClaimedOrdersForCount]);

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
      // Refetch all order queries to update counts
      refetchOrders();
      // Note: allPreOrdersForCount, allRegularOrdersForCount, and allClaimedOrdersForCount will auto-refetch
      // because they use the same useOrders hook which listens to changes
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
    <AdminLayout title="Orders" noPadding={true}>
      {ordersLoading ? (
        <OrdersSkeleton />
      ) : (
      <div className="pt-0 px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 lg:pb-8 font-sf-medium">
        {/* Page Header - Title with QR Code and Search */}
        <div className="mb-4 sm:mb-6">
          {/* Desktop Layout: Title left, Controls right */}
          <div className="hidden lg:flex lg:items-center lg:justify-between">
            <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-sf-semibold font-semibold tracking-tight">
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
                  value={searchTerm || ""}
                  onChange={(e) => {
                    console.log("[Orders] Search input changed:", e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  className="pl-9 xl:pl-10 pr-3 xl:pr-4 py-2 xl:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-64 xl:w-72 shadow-sm text-sm xl:text-base"
                />
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Layout: Stacked */}
          <div className="lg:hidden">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-sf-semibold font-semibold tracking-tight mb-3 sm:mb-4">
              <span className="text-[#0C2340]">Or</span>
              <span className="text-[#e68b00]">ders</span>
            </h1>

            {/* QR Scanner and Search Bar - Side by Side on Mobile */}
            <div className="flex flex-row items-center gap-2">
              {/* QR Code Scanner Button */}
              <button
                onClick={openQRScanner}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-3 md:px-4 py-2 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium shadow-sm text-xs sm:text-xs md:text-sm flex-shrink-0"
              >
                <QrCode size={16} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Scan QR</span>
                <span className="sm:hidden">Scan</span>
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search
                  className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-9 pr-2.5 sm:pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-full shadow-sm text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-2 sm:pt-3">
          <button
            onClick={() => setActiveStatusTab("Pre-orders")}
            className={`pb-2 sm:pb-3 font-semibold transition-colors relative text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap px-0.5 sm:px-1 md:px-2 ${
              activeStatusTab === "Pre-orders"
                ? "text-[#e68b00]"
                : "text-[#0C2340] hover:text-[#e68b00]"
            }`}
          >
            <span className="relative inline-block pr-3 sm:pr-4 md:pr-5">
              Pre-orders
              <span
                className={`absolute top-0 -right-1 sm:top-0 sm:-right-2 text-[10px] sm:text-xs md:text-sm lg:text-base font-bold leading-none ${
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
            onClick={() => {
              setActiveStatusTab("Orders");
              setCurrentPage(1); // Reset pagination
            }}
            className={`pb-2 sm:pb-3 font-semibold transition-colors relative text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap px-0.5 sm:px-1 md:px-2 ${
              activeStatusTab === "Orders"
                ? "text-[#e68b00]"
                : "text-[#0C2340] hover:text-[#e68b00]"
            }`}
          >
            <span className="relative inline-block pr-3 sm:pr-4 md:pr-5">
              Orders
              <span
                className={`absolute top-0 -right-0 sm:top-0 sm:-right-2 text-[10px] sm:text-xs md:text-sm lg:text-base font-bold leading-none ${
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
            onClick={() => {
              setActiveStatusTab("Claimed");
              setCurrentPage(1); // Reset pagination
            }}
            className={`pb-2 sm:pb-3 font-semibold transition-colors relative text-xs sm:text-sm md:text-base lg:text-lg whitespace-nowrap px-0.5 sm:px-1 md:px-2 ${
              activeStatusTab === "Claimed"
                ? "text-[#e68b00]"
                : "text-[#0C2340] hover:text-[#e68b00]"
            }`}
          >
            <span className="relative inline-block pr-3 sm:pr-4 md:pr-5">
              Claimed
              <span
                className={`absolute top-0 -right-1 sm:top-0 sm:-right-2 text-[10px] sm:text-xs md:text-sm lg:text-base font-bold leading-none ${
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
        <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Date Range Selector */}
          <div className="flex-1 min-w-0">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              className="w-full"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
            {/* Education Level Dropdown */}
            <select
              value={educationLevelFilter}
              onChange={(e) => setEducationLevelFilter(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-xs sm:text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
          <>
            {paginatedOrders.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="p-8 sm:p-12 text-center">
                  <div className="text-gray-400 mb-3 sm:mb-4">
                    <svg
                      className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                    No {activeStatusTab} Found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 px-4">
                    {startDate && endDate
                      ? `No ${activeStatusTab.toLowerCase()} found in the selected date range. Try adjusting the date filter.`
                      : `There are no ${activeStatusTab.toLowerCase()} to display at the moment.`}
                  </p>
                </div>
              </div>
            ) : (
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
          </>
        )}

        {/* Results Info */}
        {debouncedSearchTerm && (
          <div className="mt-4 text-sm text-gray-600 px-4 sm:px-0">
            Showing {filteredOrders.length} result
            {filteredOrders.length !== 1 ? "s" : ""} for "{debouncedSearchTerm}"
          </div>
        )}
      </div>
      )}

      {/* QR Code Scanner Modal */}
      <QRCodeScannerModal
        isOpen={qrScannerOpen}
        onClose={closeQRScanner}
        onScan={handleQRCodeScanned}
        processing={qrProcessing}
        scanError={qrError}
      />

      {/* Order Details Modal - shows after QR scan with design: Name, Education Level, Transaction No, Order Date, Item Ordered, Size */}
      {scannedOrder && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col relative z-[10001]" style={{ zIndex: 10001 }}>
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
        </div>,
        document.body
      )}

      {/* Release Success Modal - centered, checkmark, message, X top right */}
      {qrSuccess && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative z-[10001]" style={{ zIndex: 10001 }}>
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
        </div>,
        document.body
      )}


      {/* Processing Overlay */}
      {qrProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md relative z-[10001]">
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
