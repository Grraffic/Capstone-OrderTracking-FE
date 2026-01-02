import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
} from "lucide-react";
import { subDays } from "date-fns";
import AdminLayout from "../components/layouts/AdminLayout";
import DateRangePicker from "../components/common/DateRangePicker";
import { InventoryHealth } from "../components/shared";
import { ItemsStatsCards } from "../components/shared/stats";
import ItemsModals from "../components/Items/ItemsModals";
import ItemDetailsModal from "../components/Items/ItemDetailsModal";
import ItemAdjustmentModal from "../components/Items/ItemAdjustmentModal";
import QRCodeScannerModal from "../components/Items/QRCodeScannerModal";
import { ItemsSkeleton } from "../components/Skeleton";
import { groupItemsByVariations } from "../../utils/groupItems";
import {
  useQRScanner,
  useItems,
  useItemDetailsModal,
  useInventoryHealthStats,
} from "../hooks";

/**
 * Items Page Component
 *
 * Main items management page for admin section with:
 * - Sidebar navigation
 * - Header with menu toggle
 * - Search functionality
 * - Statistics cards (Total Items, In Stock, Low Stock, Out of Stock)
 * - Add new item button
 * - Education level and item type filters
 * - Items table with CRUD operations
 * - Modal dialogs for add/edit/view/delete
 * - QR code scanner for quick item lookup
 *
 * Features:
 * - Real-time search filtering
 * - Add new items
 * - Edit existing items
 * - View item details
 * - Delete items with confirmation
 * - Responsive layout with proper visual hierarchy
 */
const Items = () => {
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  // Date range state - initialize to "Last 7 days"
  const today = new Date();
  const [startDate, setStartDate] = useState(subDays(today, 6));
  const [endDate, setEndDate] = useState(today);
  // Local state for the horizontal education level tabs
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [showFilters, setShowFilters] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which item's menu is open
  const menuRef = useRef(null);
  // Note: AdminLayout handles sidebar state internally

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  // Inventory data and operations
  const {
    items,
    paginatedItems,
    filteredItems,
    searchTerm,
    setSearchTerm,
    selectedItem,
    modalState,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModal,
    addItem,
    updateItem,
    deleteItem,
    // Filters
    educationLevelFilter,
    setEducationLevelFilter,
    itemTypeFilter,
    setItemTypeFilter,
    gradeLevelFilter,
    setGradeLevelFilter,
    getGradeLevelOptions,
    // Item Adjustment Modal
    adjustmentModalState,
    closeAdjustmentModal,
    // API state
    loading,
    // Pagination
    currentPage,
  } = useItems();

  // Apply date filtering to filtered items
  const dateFilteredItems = useMemo(() => {
    if (!startDate) {
      return filteredItems;
    }

    // If only startDate is selected (no endDate), treat it as a single day
    const effectiveEndDate = endDate || startDate;

    // Normalize dates to start and end of day for proper comparison
    const startOfStartDate = new Date(startDate);
    startOfStartDate.setHours(0, 0, 0, 0);

    const endOfEndDate = new Date(effectiveEndDate);
    endOfEndDate.setHours(23, 59, 59, 999);

    return filteredItems.filter((item) => {
      if (!item.createdAt) {
        return false; // Exclude items without creation date
      }

      // Parse the item's creation date and normalize to start of day for comparison
      const itemDate = new Date(item.createdAt);
      const itemDateOnly = new Date(
        itemDate.getFullYear(),
        itemDate.getMonth(),
        itemDate.getDate()
      );
      
      const startDateOnly = new Date(
        startOfStartDate.getFullYear(),
        startOfStartDate.getMonth(),
        startOfStartDate.getDate()
      );
      
      const endDateOnly = new Date(
        endOfEndDate.getFullYear(),
        endOfEndDate.getMonth(),
        endOfEndDate.getDate()
      );
      
      // Check if item date is within the selected range (inclusive)
      return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
    });
  }, [filteredItems, startDate, endDate]);

  // Group filtered items by name and item_type to avoid duplicates
  const groupedItems = useMemo(() => {
    return groupItemsByVariations(dateFilteredItems);
  }, [dateFilteredItems]);

  // Paginate grouped items
  const itemsPerPage = 12; // Match the itemsPerPage from useItems hook
  const paginatedGroupedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return groupedItems.slice(startIndex, endIndex);
  }, [groupedItems, currentPage, itemsPerPage]);

  // Item Details Modal (new enhanced view modal)
  const {
    isOpen: itemDetailsOpen,
    selectedItem: detailsSelectedItem,
    variations,
    selectedVariation,
    loadingVariations,
    totalCostSummary,
    totalStock,
    openModal: openItemDetailsModal,
    closeModal: closeItemDetailsModal,
    selectVariation,
  } = useItemDetailsModal(items);

  // QR Scanner functionality
  const { qrScannerOpen, closeQRScanner, handleQRCodeScanned } =
    useQRScanner(setSearchTerm);

  // Use the shared hook for consistent inventory health stats across all pages
  const { stats: inventoryHealthStats } = useInventoryHealthStats();

  // Helper function to format item type for display
  const formatItemType = (itemType) => {
    return itemType === "Uniforms" ? "Uniform" : itemType;
  };

  // Sync tab state with filter (reverse mapping: database value → tab label)
  useEffect(() => {
    const mapEducationLevelToTabLabel = (dbValue) => {
      const reverseMapping = {
        All: "All",
        Kindergarten: "Preschool", // DB has "Kindergarten", tab shows "Preschool"
        Elementary: "Elementary",
        "Junior High School": "Junior Highschool", // DB has space, tab has no space
        "Senior High School": "Senior Highschool", // DB has space, tab has no space
        College: "College",
      };
      return reverseMapping[dbValue] || dbValue;
    };

    // Update tab state when filter changes (e.g., from dropdown)
    const tabLabel = mapEducationLevelToTabLabel(educationLevelFilter);
    if (
      tabLabel &&
      [
        "All",
        "Preschool",
        "Elementary",
        "Junior Highschool",
        "Senior Highschool",
        "College",
        "Accessories",
      ].includes(tabLabel)
    ) {
      setSelectedLevel(tabLabel);
    }
  }, [educationLevelFilter]);

  return (
    <AdminLayout title="Items">
      {loading ? (
        <ItemsSkeleton viewMode={viewMode} />
      ) : (
        <>
          {/* Page Header - Title */}
          <div className="mb-8">
            {/* Page Title */}
            <h1 className="text-4xl font-bold">
              <span className="text-[#0C2340]">Ite</span>
              <span className="text-[#e68b00]">ms</span>
            </h1>
          </div>

          {/* Inventory Health Section */}
          <div className="mb-8">
            <InventoryHealth stats={inventoryHealthStats} />
          </div>

          {/* Date Range Selector */}
          <div className="mb-6 flex justify-end">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              className="w-auto"
            />
          </div>

          {/* Horizontal Level Selection Tabs - Desktop / Dropdown - Mobile */}
          <div className="mb-8 border-b border-gray-200 pb-2">
            {/* Mobile Dropdown */}
            <div className="md:hidden">
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    const level = e.target.value;
                    setSelectedLevel(level);
                    setEducationLevelFilter(level);
                  }}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-[#0C2340] focus:outline-none focus:border-[#e68b00] focus:ring-2 focus:ring-[#e68b00]/20 transition-colors"
                >
                  {[
                    "All",
                    "Preschool",
                    "Elementary",
                    "Junior Highschool",
                    "Senior Highschool",
                    "College",
                    "Accessories",
                  ].map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex flex-wrap gap-x-12 gap-y-4">
              {[
                "All",
                "Preschool",
                "Elementary",
                "Junior Highschool",
                "Senior Highschool",
                "College",
                "Accessories",
              ].map((level) => {
                const isActive = selectedLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      // Update local tab state
                      setSelectedLevel(level);
                      // Sync with items filter so clicking a tab actually filters the list
                      setEducationLevelFilter(level);
                    }}
                    className={`relative pb-3 text-sm md:text-base font-medium transition-colors ${
                      isActive
                        ? "text-[#e68b00]"
                        : "text-[#0C2340] hover:text-[#e68b00]"
                    }`}
                  >
                    <span>{level}</span>
                    <span
                      className={`absolute left-0 -bottom-px h-0.5 rounded-full transition-all duration-200 ${
                        isActive ? "w-full bg-[#e68b00]" : "w-0 bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Items header + controls */}
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Left: List of items title */}
              <h2 className="text-2xl font-semibold text-[#0C2340]">
                List of{" "}
                <span className="text-[#e68b00] underline decoration-[#e68b00]/40">
                  Items
                </span>
              </h2>

              {/* Right: Add Item, Search, Filter Button */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Add New Item Button */}
                <button
                  onClick={openAddModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d67a00] transition-colors shadow-sm whitespace-nowrap font-medium text-sm"
                  title="Add New Item"
                  aria-label="Add New Item"
                >
                  <Plus size={18} />
                  <span>Add Item</span>
                </button>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-sm bg-white"
                  />
                </div>

                {/* Filter Button */}
                <button
                  type="button"
                  onClick={() => setShowFilters((prev) => !prev)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <Filter size={18} />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* Expandable Filters Row */}
            {showFilters && (
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                {/* Grade Level Filter */}
                <select
                  value={gradeLevelFilter}
                  onChange={(e) => setGradeLevelFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  title="Filter by grade level"
                  aria-label="Grade Level"
                >
                  {getGradeLevelOptions(educationLevelFilter).map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === "All" ? "Grade Level" : grade}
                    </option>
                  ))}
                </select>

                {/* Item Type Filter */}
                <select
                  value={itemTypeFilter}
                  onChange={(e) => setItemTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  title="Filter by item type"
                  aria-label="Item Type"
                >
                  <option value="All Types">Item Type</option>
                  <option value="All Types">All Types</option>
                  <option value="Uniforms">Uniform</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            )}

            {/* View Mode Toggles - Below Filters */}
            <div className="flex justify-end">
              <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 flex items-center gap-1 text-xs font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#0C2340] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <LayoutGrid size={16} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 flex items-center gap-1 text-xs font-medium transition-colors border-l border-gray-300 ${
                    viewMode === "list"
                      ? "bg-[#0C2340] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <List size={16} />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Item Grid or List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedItems.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    No items found
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Try adjusting your filters or add a new item.
                  </p>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d67a00] text-sm font-medium shadow-sm transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Item</span>
                  </button>
                </div>
              ) : (
                paginatedGroupedItems.map((group) => {
                  // Use first variation as representative item for operations
                  const representativeItem = group.variations[0];

                  return (
                    <div
                      key={group.groupKey}
                      className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                    >
                      {/* Three-dot menu (horizontal) */}
                      <div
                        className="absolute top-3 right-3"
                        ref={openMenuId === group.groupKey ? menuRef : null}
                      >
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === group.groupKey
                                  ? null
                                  : group.groupKey
                              )
                            }
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            aria-label="More options"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openMenuId === group.groupKey && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  openEditModal(representativeItem);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                              >
                                Edit Item
                              </button>
                              <button
                                onClick={() => {
                                  openDeleteModal(representativeItem);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg transition-colors"
                              >
                                Delete Item
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Image */}
                      <div className="mb-4">
                        <div className="w-full h-48 sm:h-56 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                          {group.image ? (
                            <img
                              src={group.image}
                              alt={group.name}
                              className="max-h-full w-auto object-contain"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/400x300";
                              }}
                            />
                          ) : (
                            <div className="text-xs text-gray-400">
                              No Image Available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="flex-1 flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-[#0C2340] line-clamp-2">
                          {group.name}
                        </h3>

                        {/* Item Type Label */}
                        <p className="text-xs text-gray-500 font-medium">
                          {formatItemType(group.itemType)}
                        </p>

                        {/* Horizontal Divider */}
                        <hr className="border-gray-200 my-1" />

                        {/* View Details Link - Centered */}
                        <button
                          type="button"
                          onClick={() =>
                            openItemDetailsModal(representativeItem)
                          }
                          className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-[#0C2340] hover:text-[#e68b00]"
                        >
                          <span>View Details</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* List View - Desktop/table layout + mobile cards */
            <div className="space-y-4">
              {/* Desktop/Tablet Table View */}
              <div className="hidden md:block rounded-xl overflow-hidden shadow-sm">
                {/* Table Header - Dark Blue */}
                <div className="bg-[#003363] text-white">
                  <div className="grid grid-cols-6 gap-4 px-6 py-4 text-sm font-semibold">
                    <div>Image</div>
                    <div>Item Name</div>
                    <div>Item Type</div>
                    <div>Grade Level</div>
                    <div>Cost Summary</div>
                    <div className="text-center">Action</div>
                  </div>
                </div>

                {/* Table Body - Cream/Beige rows */}
                <div>
                  {paginatedGroupedItems.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 bg-white">
                      <p className="text-sm font-medium">No items found</p>
                      <p className="text-xs mt-1">
                        Try adjusting your filters or add a new item.
                      </p>
                    </div>
                  ) : (
                    paginatedGroupedItems.map((group, index) => {
                      // Use first variation as representative item for operations
                      const representativeItem = group.variations[0];

                      return (
                        <div
                          key={group.groupKey}
                          className={`grid grid-cols-6 gap-4 px-6 py-4 items-center border-b border-[#e68b00]/30 hover:bg-[#FFF8E7] transition-colors ${
                            index === 0 ? "bg-[#FFF5E0]" : "bg-white"
                          }`}
                        >
                          {/* Image */}
                          <div>
                            <img
                              src={group.image}
                              alt={group.name}
                              className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/56";
                              }}
                            />
                          </div>

                          {/* Item Name */}
                          <div className="text-[#0C2340] text-sm font-medium">
                            {group.name}
                          </div>

                          {/* Item Type */}
                          <div className="text-[#e68b00] text-sm">
                            {formatItemType(group.itemType)}
                          </div>

                          {/* Grade Level */}
                          <div className="text-[#0C2340] text-sm">
                            {group.educationLevel}
                          </div>

                          {/* Cost Summary */}
                          <div className="text-[#003363] text-sm font-semibold">
                            ₱{" "}
                            {representativeItem.price?.toLocaleString() ||
                              "0.00"}
                          </div>

                          {/* Action */}
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() =>
                                openItemDetailsModal(representativeItem)
                              }
                              className="p-2 rounded-lg hover:bg-[#0C2340]/10 text-[#0C2340] transition-colors"
                              title="View Details"
                              aria-label="View item details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openEditModal(representativeItem)}
                              className="p-2 rounded-lg hover:bg-blue-50 text-[#003363] transition-colors"
                              title="Edit"
                              aria-label="Edit item"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() =>
                                openDeleteModal(representativeItem)
                              }
                              className="p-2 rounded-lg hover:bg-red-50 text-[#e68b00] transition-colors"
                              title="Delete"
                              aria-label="Delete item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {paginatedGroupedItems.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm font-medium">No items found</p>
                    <p className="text-xs mt-1">
                      Try adjusting your filters or add a new item.
                    </p>
                  </div>
                ) : (
                  paginatedGroupedItems.map((group) => {
                    // Use first variation as representative item for operations
                    const representativeItem = group.variations[0];

                    return (
                      <div
                        key={group.groupKey}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 flex gap-3 sm:gap-4"
                      >
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/64";
                            }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col gap-2 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="text-sm font-semibold text-[#0C2340] line-clamp-2 mb-1">
                                {group.name}
                              </h3>
                              <p className="text-xs text-[#e68b00]">
                                {formatItemType(group.itemType)}
                              </p>
                            </div>
                            <div className="text-xs font-semibold text-[#003363] flex-shrink-0">
                              ₱{" "}
                              {representativeItem.price?.toLocaleString() ||
                                "0.00"}
                            </div>
                          </div>

                          <p className="text-xs text-gray-500 mt-0.5">
                            Grade Level:{" "}
                            <span className="text-[#0C2340]">
                              {group.educationLevel || "—"}
                            </span>
                          </p>

                          {/* Actions */}
                          <div className="mt-2 flex justify-end gap-1.5 sm:gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                openItemDetailsModal(representativeItem)
                              }
                              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md bg-[#0C2340]/10 text-[10px] sm:text-xs font-medium text-[#0C2340] hover:bg-[#0C2340]/20 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => openEditModal(representativeItem)}
                              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md bg-blue-50 text-[10px] sm:text-xs font-medium text-[#003363] hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                openDeleteModal(representativeItem)
                              }
                              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-md bg-red-50 text-[10px] sm:text-xs font-medium text-[#e68b00] hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Results Info */}
          {searchTerm && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {groupedItems.length} result
              {groupedItems.length !== 1 ? "s" : ""} for "{searchTerm}"
              {groupedItems.length < filteredItems.length && (
                <span className="ml-1 text-gray-500">
                  ({filteredItems.length} total items)
                </span>
              )}
            </div>
          )}

          {/* Modals */}
          <ItemsModals
            modalState={modalState}
            selectedItem={selectedItem}
            onClose={closeModal}
            onAdd={addItem}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />

          {/* Item Adjustment Modal */}
          <ItemAdjustmentModal
            isOpen={adjustmentModalState.isOpen}
            selectedItem={selectedItem}
            onClose={closeAdjustmentModal}
            onSubmit={(data) => {
              console.log("Item adjustment submitted:", data);
              closeAdjustmentModal();
            }}
          />

          {/* QR Code Scanner Modal */}
          <QRCodeScannerModal
            isOpen={qrScannerOpen}
            onClose={closeQRScanner}
            onScan={handleQRCodeScanned}
          />

          {/* Item Details Modal (Enhanced View) */}
          <ItemDetailsModal
            isOpen={itemDetailsOpen}
            selectedItem={detailsSelectedItem}
            variations={variations}
            selectedVariation={selectedVariation}
            loadingVariations={loadingVariations}
            totalCostSummary={totalCostSummary}
            totalStock={totalStock}
            onClose={closeItemDetailsModal}
            onSelectVariation={selectVariation}
            onEdit={(item) => {
              closeItemDetailsModal();
              openEditModal(item);
            }}
            onDelete={(item) => {
              closeItemDetailsModal();
              openDeleteModal(item);
            }}
          />
        </>
      )}
    </AdminLayout>
  );
};

export default Items;
