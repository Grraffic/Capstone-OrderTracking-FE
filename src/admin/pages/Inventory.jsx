import React, { useState } from "react";
import { subDays } from "date-fns";
import Sidebar from "../components/common/Sidebar";
import AdminHeader from "../components/common/AdminHeader";
import InventoryView from "../components/Inventory/InventoryView";
import TransactionsView from "../components/Inventory/TransactionsView";
import UpdateQuantityModal from "../components/Inventory/UpdateQuantityModal";
import { useAdminSidebar } from "../hooks";

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
  // Custom hooks for UI state management
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeLevel, setGradeLevel] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all");
  // Date range state - initialize to "Last 7 days"
  const today = new Date();
  const [startDate, setStartDate] = useState(subDays(today, 6));
  const [endDate, setEndDate] = useState(today);
  const totalPages = 5;

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

  // Sample stats data
  const stats = {
    totalItems: 53,
    aboveThreshold: 10,
    atReorderPoint: 23,
    critical: 15,
    outOfStock: 8,
  };

  // Sample transaction data
  const transactionData = [
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
  ];

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

  // Sample inventory data
  const inventoryData = [
    {
      no: 1,
      item: "Kinder Girl's Dress",
      size: "XSmall",
      beginningInventory: 280,
      unreleased: 5,
      purchases: 20,
      released: 18,
      returns: 2,
      available: 277,
      endingInventory: 284,
      unitPrice: 100,
      totalAmount: 28000,
    },
    {
      no: 2,
      item: "Kinder Girl's Dress",
      size: "Small",
      beginningInventory: 320,
      unreleased: 4,
      purchases: 10,
      released: 22,
      returns: 1,
      available: 304,
      endingInventory: 309,
      unitPrice: 100,
      totalAmount: 28000,
    },
    {
      no: 3,
      item: "Kinder Girl's Dress",
      size: "Medium",
      beginningInventory: 310,
      unreleased: 3,
      purchases: 15,
      released: 25,
      returns: 0,
      available: 297,
      endingInventory: 300,
      unitPrice: 100,
      totalAmount: 28000,
    },
    {
      no: 4,
      item: "Kinder Girl's Dress",
      size: "Large",
      beginningInventory: 450,
      unreleased: 6,
      purchases: 30,
      released: 40,
      returns: 3,
      available: 434,
      endingInventory: 443,
      unitPrice: 100,
      totalAmount: 28000,
    },
    {
      no: 5,
      item: "Kinder Girl's Dress",
      size: "XLarge",
      beginningInventory: 180,
      unreleased: 2,
      purchases: 10,
      released: 12,
      returns: 1,
      available: 176,
      endingInventory: 179,
      unitPrice: 100,
      totalAmount: 28000,
    },
    {
      no: 6,
      item: "Kinder Boy's Shorts",
      size: "XSmall",
      beginningInventory: 280,
      unreleased: 8,
      purchases: 0,
      released: 35,
      returns: 4,
      available: 457,
      endingInventory: 469,
      unitPrice: 120,
      totalAmount: 28000,
    },
    {
      no: 7,
      item: "Kinder Boy's Shorts",
      size: "Small",
      beginningInventory: 320,
      unreleased: 10,
      purchases: 25,
      released: 28,
      returns: 3,
      available: 247,
      endingInventory: 260,
      unitPrice: 120,
      totalAmount: 28000,
    },
    {
      no: 8,
      item: "Kinder Boy's Shorts",
      size: "Medium",
      beginningInventory: 310,
      unreleased: 12,
      purchases: 25,
      released: 30,
      returns: 2,
      available: 323,
      endingInventory: 337,
      unitPrice: 120,
      totalAmount: 28000,
    },
    {
      no: 9,
      item: "Kinder Boy's Shorts",
      size: "Large",
      beginningInventory: 450,
      unreleased: 7,
      purchases: 10,
      released: 15,
      returns: 1,
      available: 283,
      endingInventory: 291,
      unitPrice: 120,
      totalAmount: 28000,
    },
  ];

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
        {/* Inventory Content */}
        <div className="p-8">
          {/* Page Header - Title with Search */}
          <div className="mb-6">
            {/* Desktop Layout: Title left, Tabs and Search right */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
              <h1 className="text-5xl font-extrabold tracking-tight">
                <span className="text-[#0C2340]">Inven</span>
                <span className="text-[#E68B00]">tory</span>
              </h1>

              <div className="flex items-center gap-4">
                {/* Segmented Control - Inventory and Transaction Tabs */}
                <div className="flex items-center bg-[#0C2340] rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      activeTab === "inventory"
                        ? "bg-[#E68B00] text-white"
                        : "bg-transparent text-white hover:bg-gray-700"
                    }`}
                  >
                    Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab("transaction")}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
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
                    className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent w-72 shadow-sm"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                <span className="text-[#0C2340]">Inven</span>
                <span className="text-[#E68B00]">tory</span>
              </h1>

              {/* Segmented Control - Inventory and Transaction Tabs */}
              <div className="flex items-center bg-[#0C2340] rounded-lg p-1 mb-4 w-fit">
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === "inventory"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Inventory
                </button>
                <button
                  onClick={() => setActiveTab("transaction")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === "transaction"
                      ? "bg-[#E68B00] text-white"
                      : "bg-transparent text-white hover:bg-gray-700"
                  }`}
                >
                  Transaction
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent shadow-sm"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
              inventoryData={inventoryData}
            />
          )}

          {/* Transactions View */}
          {activeTab === "transaction" && (
            <TransactionsView
              stats={stats}
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

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
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
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors duration-200 ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-[#E68B00] text-white border-[#E68B00] hover:bg-[#D67A00]"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

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
    </div>
  );
};

export default Inventory;
