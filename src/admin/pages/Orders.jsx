import { QrCode, Search } from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import AdminHeader from "../components/common/AdminHeader";
import OrdersStatsCards from "../components/Orders/OrdersStatsCards";
import OrdersTable from "../components/Orders/OrdersTable";
import QRCodeScannerModal from "../components/Items/QRCodeScannerModal";
import {
  useAdminSidebar,
  useOrderQRScanner,
  useOrders,
  useSocketOrderUpdates,
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
  // Custom hooks for UI state management
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();

  // Orders filters management
  const {
    educationLevelFilter,
    classAndYearFilter,
    statusFilter,
    searchTerm,
    setEducationLevelFilter,
    setClassAndYearFilter,
    setStatusFilter,
    setSearchTerm,
    filteredClassAndYearOptions,
  } = useOrdersFilters();

  // QR Scanner functionality with order processing
  const {
    qrScannerOpen,
    openQRScanner,
    closeQRScanner,
    handleQRCodeScanned,
    processing: qrProcessing,
    error: qrError,
    success: qrSuccess,
  } = useOrderQRScanner();

  // Active status tab (Pre-orders, Orders, Claimed)
  const [activeStatusTab, setActiveStatusTab] = useState("Orders");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    status:
      activeStatusTab === "Claimed"
        ? "completed"
        : null,
    educationLevel:
      educationLevelFilter !== "All Education Levels"
        ? educationLevelFilter
        : null,
    search: searchTerm || null,
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
            : order.status === "completed" || order.status === "claimed"
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
  // For local filtering (class and year), we still need to filter
  const filteredOrders = useMemo(() => {
    if (classAndYearFilter === "All Class & Year") {
      return mockOrders;
    }
    return mockOrders.filter((order) => {
      return order.gradeOrProgram === classAndYearFilter;
    });
  }, [mockOrders, classAndYearFilter]);

  // Calculate statistics from all orders (not just current page)
  const stats = useOrdersStats(mockOrders);

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
  }, [searchTerm, educationLevelFilter, classAndYearFilter, activeStatusTab]);

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

  // Refetch orders after successful QR scan and close scanner
  useEffect(() => {
    if (qrSuccess) {
      console.log("✅ Order claimed successfully, refreshing orders...");
      // Refetch orders to show updated status
      refetchOrders();

      // Close scanner after 2 seconds to show success message
      const timer = setTimeout(() => {
        closeQRScanner();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [qrSuccess, refetchOrders, closeQRScanner]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onNavigate={toggleSidebar} />

      {/* Fixed Header */}
      <AdminHeader onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Main Content Area - Scrollable */}
      <main
        className={`fixed top-16 bottom-0 right-0 bg-gray-50 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? "left-64" : "left-20"
        }`}
      >
        {/* Orders Content */}
        <div className="p-8">
          {/* Page Header - Title with QR Code and Search */}
          <div className="mb-6">
            {/* Desktop Layout: Title left, Controls right */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
              <h1 className="text-5xl font-extrabold tracking-tight">
                <span className="text-[#0C2340]">Or</span>
                <span className="text-[#e68b00]">ders</span>
              </h1>

              {/* QR Scanner and Search Bar - Right Side */}
              <div className="flex items-center gap-3">
                {/* QR Code Scanner Button */}
                <button
                  onClick={openQRScanner}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium shadow-sm"
                >
                  <QrCode size={20} />
                  <span>Scan QR Code</span>
                </button>

                {/* Search Bar */}
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-72 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Mobile/Tablet Layout: Stacked */}
            <div className="lg:hidden">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                <span className="text-[#0C2340]">Or</span>
                <span className="text-[#e68b00]">ders</span>
              </h1>

              {/* QR Scanner and Search Bar - Stacked */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* QR Code Scanner Button */}
                <button
                  onClick={openQRScanner}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium shadow-sm"
                >
                  <QrCode size={20} />
                  <span>Scan QR Code</span>
                </button>

                {/* Search Bar */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-full sm:w-72 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 flex items-center gap-4 sm:gap-6 lg:gap-8 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveStatusTab("Pre-orders")}
              className={`pb-3 font-semibold transition-colors relative text-sm sm:text-base whitespace-nowrap ${
                activeStatusTab === "Pre-orders"
                  ? "text-[#0C2340]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pre-orders
              {activeStatusTab === "Pre-orders" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e68b00] rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveStatusTab("Orders")}
              className={`pb-3 font-semibold transition-colors relative text-sm sm:text-base whitespace-nowrap ${
                activeStatusTab === "Orders"
                  ? "text-[#0C2340]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Orders
              {activeStatusTab === "Orders" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e68b00] rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveStatusTab("Claimed")}
              className={`pb-3 font-semibold transition-colors relative text-sm sm:text-base whitespace-nowrap ${
                activeStatusTab === "Claimed"
                  ? "text-[#0C2340]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Claimed
              {activeStatusTab === "Claimed" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e68b00] rounded-t-full"></div>
              )}
            </button>
          </div>

          {/* Filter Dropdowns - Below Tabs */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-end gap-3 sm:gap-4">
            {/* Grade Level Dropdown */}
            <select
              value={educationLevelFilter}
              onChange={(e) => setEducationLevelFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent bg-white text-gray-700 font-medium shadow-sm cursor-pointer w-full sm:w-auto sm:min-w-[200px]"
            >
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>

            {/* Grade Level Category Dropdown */}
            <select
              value={classAndYearFilter}
              onChange={(e) => setClassAndYearFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent bg-white text-gray-700 font-medium shadow-sm cursor-pointer w-full sm:w-auto sm:min-w-[200px]"
              disabled={educationLevelFilter === "All Education Levels"}
            >
              {filteredClassAndYearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Loading State - Show loading overlay on top of existing content */}
          {ordersLoading && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center relative">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2340] mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading orders...</p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {ordersError && !ordersLoading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-medium">Error loading orders</p>
              <p className="text-red-600 text-sm mt-1">{ordersError}</p>
              <button
                onClick={refetchOrders}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
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
            />
          )}

          {/* Results Info */}
          {searchTerm && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredOrders.length} result
              {filteredOrders.length !== 1 ? "s" : ""} for "{searchTerm}"
            </div>
          )}
        </div>
      </main>

      {/* QR Code Scanner Modal */}
      <QRCodeScannerModal
        isOpen={qrScannerOpen}
        onClose={closeQRScanner}
        onScan={handleQRCodeScanned}
        processing={qrProcessing}
      />

      {/* Success Notification */}
      {qrSuccess && (
        <div className="fixed bottom-8 right-8 z-50 max-w-md animate-slide-up">
          <div className="bg-green-50 border-2 border-green-500 rounded-xl shadow-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-green-800 mb-1">
                  Order Claimed Successfully!
                </h4>
                <p className="text-sm text-green-700 mb-2">
                  {qrSuccess.message}
                </p>
                <div className="text-xs text-green-600 space-y-1">
                  <p>
                    <strong>Order:</strong> {qrSuccess.orderNumber}
                  </p>
                  <p>
                    <strong>Student:</strong> {qrSuccess.studentName}
                  </p>
                  {qrSuccess.items && qrSuccess.items.length > 0 && (
                    <div className="mt-2">
                      <strong>Items Updated:</strong>
                      <ul className="ml-4 mt-1">
                        {qrSuccess.items.map((item, idx) => (
                          <li key={idx}>
                            {item.success ? "✓" : "✗"} {item.item} (
                            {item.quantity})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeQRScanner}
                className="flex-shrink-0 text-green-600 hover:text-green-800"
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
    </div>
  );
};

export default Orders;
