import React, { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import AdminHeader from "../components/common/AdminHeader";
import ItemsStatsCards from "../components/Items/ItemsStatsCards";
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
  const totalPages = 5;

  // Sample stats data
  const stats = {
    totalItems: 53,
    aboveThreshold: 10,
    atReorderPoint: 23,
    critical: 15,
    outOfStock: 8,
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
      cost: 284,
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
    },
    {
      no: 6,
      item: "Kinder Boy's Shorts",
      size: "Small",
      beginningInventory: 280,
      unreleased: 8,
      purchases: 0,
      released: 35,
      returns: 4,
      available: 457,
      endingInventory: 469,
    },
    {
      no: 7,
      item: "Kinder Boy's Shorts",
      size: "Medium",
      beginningInventory: 320,
      unreleased: 10,
      purchases: 25,
      released: 28,
      returns: 3,
      available: 247,
      endingInventory: 260,
    },
    {
      no: 8,
      item: "Kinder Boy's Shorts",
      size: "Large",
      beginningInventory: 310,
      unreleased: 12,
      purchases: 25,
      released: 30,
      returns: 2,
      available: 323,
      endingInventory: 337,
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
      <Sidebar isOpen={sidebarOpen} />

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
            {/* Desktop Layout: Title left, Search right */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
              <h1 className="text-5xl font-extrabold tracking-tight">
                <span className="text-[#0C2340]">Invent</span>
                <span className="text-[#FF6B35]">tory</span>
              </h1>

              {/* Search Bar - Right Side */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent w-72 shadow-sm"
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

            {/* Mobile/Tablet Layout: Stacked */}
            <div className="lg:hidden">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                <span className="text-[#0C2340]">Invent</span>
                <span className="text-[#FF6B35]">tory</span>
              </h1>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent shadow-sm"
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

          {/* Stats Cards */}
          <div className="mb-6">
            <ItemsStatsCards stats={stats} />
          </div>

          {/* Control Bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left Side - Date Range and Save Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Date Range Selector */}
                <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Last 7 days</span>
                  <span className="text-sm text-gray-500">12 Nov - 19 Nov</span>
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Save Input Button */}
                <button className="px-6 py-2 bg-[#FF6B35] text-white font-medium rounded-lg hover:bg-[#E55A28] transition-colors duration-200 shadow-sm">
                  Save Input
                </button>
              </div>

              {/* Right Side - Grade Level Dropdown */}
              <div className="w-full sm:w-auto">
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent cursor-pointer"
                >
                  <option value="all">Grade Level Category</option>
                  <option value="kinder">Kindergarten</option>
                  <option value="elementary">Elementary</option>
                  <option value="junior">Junior High</option>
                  <option value="senior">Senior High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0C2340]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">No.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <span className="text-white">Beginning <br /> Inventory</span>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Unreleased</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Purchases</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <span className="text-white">Released</span>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Returns</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      <span className="text-white">Available</span>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Ending <br />Inventory</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((row, index) => (
                    <tr
                      key={row.no}
                      className={`${
                        index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                      } hover:bg-gray-50 transition-colors duration-150`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{row.no}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{row.item}</span>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full w-fit">
                            {row.size}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#FF6B35]">
                        {row.beginningInventory}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.unreleased}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.purchases}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#4A90E2]">{row.released}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.returns}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#4A90E2]">{row.available}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.endingInventory}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Table - Horizontally Scrollable with Fixed First Column */}
            <div className="md:hidden overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-[#0C2340]">
                      <tr>
                        <th className="sticky left-0 z-10 bg-[#0C2340] px-3 py-3 text-left text-xs font-semibold text-white">
                          No.
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          Item
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          <span className="text-[#FF6B35]">Beginning Inv.</span>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          Unreleased
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          Purchases
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          <span className="text-[#4A90E2]">Released</span>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          Returns
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          <span className="text-[#4A90E2]">Available</span>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-white whitespace-nowrap">
                          Ending Inv.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryData.map((row, index) => (
                        <tr
                          key={row.no}
                          className={`${
                            index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                          }`}
                        >
                          <td className="sticky left-0 z-10 px-3 py-3 text-xs text-gray-900 bg-inherit">
                            {row.no}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-900">{row.item}</span>
                              <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full w-fit">
                                {row.size}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs font-semibold text-[#FF6B35] whitespace-nowrap">
                            {row.beginningInventory}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                            {row.unreleased}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                            {row.purchases}
                          </td>
                          <td className="px-3 py-3 text-xs font-semibold text-[#4A90E2] whitespace-nowrap">
                            {row.released}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                            {row.returns}
                          </td>
                          <td className="px-3 py-3 text-xs font-semibold text-[#4A90E2] whitespace-nowrap">
                            {row.available}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-900 whitespace-nowrap">
                            {row.endingInventory}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

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
                    : "bg-[#FF6B35] text-white border-[#FF6B35] hover:bg-[#E55A28]"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inventory;
