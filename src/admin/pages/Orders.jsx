import { QrCode, Search } from "lucide-react";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import OrdersStatsCards from "../components/OrdersStatsCards";
import OrdersTable from "../components/OrdersTable";
import QRCodeScannerModal from "../components/QRCodeScannerModal";
import { useAdminSidebar, useQRScanner } from "../hooks";
import useOrdersStats from "../hooks/useOrdersStats";
import useOrdersFilters from "../hooks/useOrdersFilters";
import { EDUCATION_LEVELS, ORDER_STATUS } from "../constants/ordersOptions";
import { useState, useMemo } from "react";

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

  // QR Scanner functionality
  const { qrScannerOpen, openQRScanner, closeQRScanner, handleQRCodeScanned } =
    useQRScanner(setSearchTerm);

  // Active status tab (Processing or Claimed)
  const [activeStatusTab, setActiveStatusTab] = useState("Processing");

  // Mock orders data (TODO: Replace with API call)
  const mockOrders = [
    {
      id: 1562,
      transactionNo: "1562",
      itemOrdered: "Blouse",
      moreItems: "more 1 item",
      description: "Small",
      size: "Small",
      name: "Lenie Jane Tinapga",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Processing",
      totalAmount: 450.0,
    },
    {
      id: 1563,
      transactionNo: "1563",
      itemOrdered: "Skirt",
      moreItems: "",
      description: "Medium",
      size: "Medium",
      name: "Astrid Borja",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Processing",
      totalAmount: 380.0,
    },
    {
      id: 1564,
      transactionNo: "1564",
      itemOrdered: "Pants",
      moreItems: "more 1 item",
      description: "Large",
      size: "Large",
      name: "Rafael Ramos",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Claimed",
      totalAmount: 520.0,
    },
    {
      id: 1565,
      transactionNo: "1565",
      itemOrdered: "Necktie",
      moreItems: "",
      description: "None",
      size: "None",
      name: "Alicia Jane Medina",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Claimed",
      totalAmount: 150.0,
    },
    {
      id: 1566,
      transactionNo: "1566",
      itemOrdered: "Logo",
      moreItems: "more 1 item",
      description: "None",
      size: "None",
      name: "Lianor Bagaooro",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Processing",
      totalAmount: 200.0,
    },
    {
      id: 1567,
      transactionNo: "1567",
      itemOrdered: "ID Lace",
      moreItems: "",
      description: "None",
      size: "None",
      name: "Kristel Magpayo",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Processing",
      totalAmount: 80.0,
    },
    {
      id: 1568,
      transactionNo: "1568",
      itemOrdered: "PE Pants",
      moreItems: "more 1 item",
      description: "Medium",
      size: "Medium",
      name: "Trisha Mae Calibog",
      gradeOrProgram: "BSIS 4",
      transactionDate: "08-02-2025",
      status: "Claimed",
      totalAmount: 420.0,
    },
  ];

  // Filter orders based on search term, filters, and active status tab
  const filteredOrders = useMemo(() => {
    return mockOrders.filter((order) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        order.transactionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.itemOrdered.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.gradeOrProgram.toLowerCase().includes(searchTerm.toLowerCase());

      // Education level filter
      const matchesEducationLevel =
        educationLevelFilter === "All Education Levels" ||
        (educationLevelFilter === "Higher Education" &&
          order.gradeOrProgram.includes("BSIS")) ||
        (educationLevelFilter === "Basic Education" &&
          order.gradeOrProgram.includes("Grade"));

      // Class and year filter
      const matchesClassAndYear =
        classAndYearFilter === "All Class & Year" ||
        order.gradeOrProgram === classAndYearFilter;

      // Status tab filter (Processing or Claimed)
      const matchesStatusTab =
        order.status.toLowerCase() === activeStatusTab.toLowerCase();

      return (
        matchesSearch &&
        matchesEducationLevel &&
        matchesClassAndYear &&
        matchesStatusTab
      );
    });
  }, [
    mockOrders,
    searchTerm,
    educationLevelFilter,
    classAndYearFilter,
    activeStatusTab,
  ]);

  // Calculate statistics
  const stats = useOrdersStats(mockOrders);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} />

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
          {/* Page Header - Title and Top-Right Controls */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Page Title - Left Side */}
            <div>
              <h1 className="text-4xl font-bold">
                <span className="text-[#0C2340]">Or</span>
                <span className="text-[#e68b00]">ders</span>
              </h1>
            </div>

            {/* Top-Right Controls - QR Scanner and Search */}
            <div className="flex items-center gap-3">
              {/* QR Code Scanner Button */}
              <button
                onClick={openQRScanner}
                className="flex items-center gap-2 px-4 py-2 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] transition-colors font-medium"
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e68b00] focus:border-transparent w-64"
                />
              </div>
            </div>
          </div>

          {/* Statistics Cards - Multiple Sections */}
          <div className="mb-8">
            <OrdersStatsCards
              stats={stats}
              educationLevelFilter={educationLevelFilter}
              classAndYearFilter={classAndYearFilter}
              onEducationLevelChange={setEducationLevelFilter}
              onClassAndYearChange={setClassAndYearFilter}
              educationLevelOptions={EDUCATION_LEVELS}
              classAndYearOptions={filteredClassAndYearOptions}
            />
          </div>

          {/* Status Tabs - Processing and Claimed */}
          <div className="mb-6 flex items-center gap-6 border-b border-gray-200">
            <button
              onClick={() => setActiveStatusTab("Processing")}
              className={`pb-3 font-medium transition-colors relative ${
                activeStatusTab === "Processing"
                  ? "text-[#0C2340]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Processing
              {activeStatusTab === "Processing" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e68b00] rounded-t-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveStatusTab("Claimed")}
              className={`pb-3 font-medium transition-colors relative ${
                activeStatusTab === "Claimed"
                  ? "text-[#0C2340]"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Claimed
              {activeStatusTab === "Claimed" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e68b00] rounded-t-full"></div>
              )}
            </button>
          </div>

          {/* Orders Table */}
          <OrdersTable
            orders={paginatedOrders}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={prevPage}
            onNextPage={nextPage}
            onGoToPage={goToPage}
          />

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
      />
    </div>
  );
};

export default Orders;

