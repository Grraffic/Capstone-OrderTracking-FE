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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AdminLayout from "../components/layouts/AdminLayout";
import { InventoryHealth } from "../components/shared";
import { ItemsStatsCards } from "../components/shared/stats";
import ItemsModals from "../components/Items/ItemsModals";
import ItemDetailsModal from "../components/Items/ItemDetailsModal";
import ItemVariantEditModal from "../components/Items/ItemVariantEditModal";
import ItemAdjustmentModal from "../components/Items/ItemAdjustmentModal";
import ItemsFilterDropdown from "../components/Items/ItemsFilterDropdown";
import QRCodeScannerModal from "../components/Items/QRCodeScannerModal";
import { ItemsSkeleton } from "../components/Skeleton";
import { groupItemsByVariations } from "../../utils/groupItems";
import {
  useQRScanner,
  useItems,
  useItemDetailsModal,
  useInventoryHealthStats,
  useOrders,
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
  // Local state for the horizontal education level tabs
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    itemStatus: null,
    datePreset: null,
    startDate: null,
    endDate: null,
  });
  const [openMenuId, setOpenMenuId] = useState(null); // Track which item's menu is open
  const [selectedListRowKey, setSelectedListRowKey] = useState(null); // Orange highlight follows clicked row in list view
  const [variantEdit, setVariantEdit] = useState({
    isOpen: false,
    parent: null,
    variation: null,
    variations: [],
  });
  const menuRef = useRef(null);
  const filterButtonRef = useRef(null);
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

  // Inventory data and operations — itemStatus from filter (active/archived/deleted)
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
    archiveItem,
    // Filters
    educationLevelFilter,
    setEducationLevelFilter,
    mapTabLabelToEducationLevel,
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
    isInitialLoading,
    // Pagination
    currentPage,
    goToPage,
  } = useItems({
    itemStatus: appliedFilters.itemStatus ?? "active",
    startDate: appliedFilters.startDate ?? null,
    endDate: appliedFilters.endDate ?? null,
  });

  // Group filtered items by name and item_type to avoid duplicates.
  // When a specific education level tab is selected, keep only groups that have at least
  // one variation matching that level (so College tab never shows Pre-Kindergarten items).
  // No date filtering: show all items.
  const groupedItems = useMemo(() => {
    const grouped = groupItemsByVariations(filteredItems);
    if (educationLevelFilter === "All" || educationLevelFilter === "Accessories") {
      return grouped;
    }
    const mappedLevel = (mapTabLabelToEducationLevel(educationLevelFilter) || "").trim().toLowerCase();
    if (!mappedLevel) return grouped;
    return grouped
      .map((g) => ({
        ...g,
        variations: g.variations.filter((v) => {
          const vLevel = (v.educationLevel || v.education_level || "").trim().toLowerCase();
          return vLevel === mappedLevel || vLevel === "all education levels";
        }),
      }))
      .filter((g) => g.variations.length > 0)
      .map((g) => ({
        ...g,
        totalStock: g.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
        stock: g.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
        educationLevel: g.variations[0]?.educationLevel ?? g.variations[0]?.education_level ?? g.educationLevel,
        id: g.variations[0]?.id ?? g.id,
        price: g.variations[0]?.price ?? g.price,
      }));
  }, [filteredItems, educationLevelFilter, mapTabLabelToEducationLevel]);

  // Paginate grouped items - responsive: 3 on mobile, 8 on larger screens
  const [itemsPerPage, setItemsPerPage] = useState(8);
  
  useEffect(() => {
    const updateItemsPerPage = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(3); // Mobile M and Mobile L
      } else {
        setItemsPerPage(8); // Larger screens
      }
    };
    
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);
  
  const paginatedGroupedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return groupedItems.slice(startIndex, endIndex);
  }, [groupedItems, currentPage, itemsPerPage]);

  const totalPagesGrouped = Math.max(1, Math.ceil(groupedItems.length / itemsPerPage));
  const hasPagination = groupedItems.length > itemsPerPage;

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

  // Fetch orders to compute unreleased counts (for Available = stock - unreleased in ItemDetailsModal)
  const { orders: allOrders } = useOrders({
    page: 1,
    limit: 5000,
  });

  const unreleasedCounts = useMemo(() => {
    const counts = {};
    const normalizeSize = (size) => {
      if (!size) return "";
      const match = String(size).match(/^(.+?)\s*\([A-Z]\)$/i);
      return match ? match[1].trim() : String(size).trim();
    };
    (allOrders || []).forEach((order) => {
      const status = (order.status || "").toLowerCase();
      if (status !== "pending" && status !== "processing") return;
      const orderItems = Array.isArray(order.items) ? order.items : [];
      orderItems.forEach((item) => {
        const name = (item.name || "").trim().toLowerCase();
        const size = normalizeSize(item.size || "").toLowerCase();
        const key = `${name}|${size}`;
        counts[key] = (counts[key] || 0) + (Number(item.quantity) || 0);
      });
    });
    return counts;
  }, [allOrders]);

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
    <AdminLayout title="Items" noPadding={true}>
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 font-sf-medium">
      {isInitialLoading ? (
        <ItemsSkeleton viewMode={viewMode} />
      ) : (
        <>
          {/* Page Header - Title */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            {/* Page Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-sf-semibold font-semibold tracking-tight">
              <span className="text-[#0C2340]">Ite</span>
              <span className="text-[#e68b00]">ms</span>
            </h1>
          </div>

          {/* Inventory Health Section */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <InventoryHealth stats={inventoryHealthStats} />
          </div>

          {/* Horizontal Level Selection Tabs - Desktop / Dropdown - Mobile */}
          <div className="mb-4 sm:mb-6 md:mb-8 border-b border-gray-200 pb-2">
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
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-xs sm:text-sm font-sf-medium font-medium text-[#0C2340] focus:outline-none focus:border-[#e68b00] focus:ring-2 focus:ring-[#e68b00]/20 transition-colors"
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
                    className={`relative pb-3 text-xs sm:text-sm md:text-base font-sf-medium font-medium transition-colors ${
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
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-sf-semibold font-semibold text-[#0C2340]">
                List of{" "}
                <span className="text-[#e68b00] underline decoration-[#e68b00]/40">
                  Items
                </span>
              </h2>

              {/* Layout: Add Item (left), Search (middle), Filters (right) - Right aligned */}
              <div className="flex flex-row items-center justify-end gap-2 sm:gap-3">
                {/* Add New Item Button - Left */}
                <button
                  onClick={openAddModal}
                  className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d67a00] transition-colors shadow-sm whitespace-nowrap font-medium text-xs sm:text-sm flex-shrink-0"
                  title="Add New Item"
                  aria-label="Add New Item"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Add Item</span>
                  <span className="sm:hidden">Add</span>
                </button>

                {/* Search Bar - Middle */}
                <div className="relative w-48 sm:w-64 md:w-60 max-w-full">
                  <Search
                    className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-xs sm:text-sm bg-white"
                  />
                </div>

                {/* Filter Button - Right */}
                <div className="relative inline-block flex-shrink-0">
                  <button
                    ref={filterButtonRef}
                    type="button"
                    onClick={() => setFilterDropdownOpen((prev) => !prev)}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <Filter size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>Filters</span>
                  </button>
                  <ItemsFilterDropdown
                    isOpen={filterDropdownOpen}
                    onClose={() => setFilterDropdownOpen(false)}
                    onApply={(filters) => {
                      setAppliedFilters({
                        itemStatus: filters.itemStatus ?? null,
                        datePreset: filters.datePreset ?? null,
                        startDate: filters.startDate ?? null,
                        endDate: filters.endDate ?? null,
                      });
                    }}
                    initialFilters={appliedFilters}
                    buttonRef={filterButtonRef}
                  />
                </div>
              </div>
            </div>

            {/* View Mode Toggles */}
            <div className="flex justify-end">
              <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("grid");
                    setSelectedListRowKey(null);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 text-[10px] sm:text-xs font-medium transition-colors ${
                    viewMode === "grid"
                      ? "bg-[#0C2340] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <LayoutGrid size={14} className="sm:w-4 sm:h-4" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 text-[10px] sm:text-xs font-medium transition-colors border-l border-gray-300 ${
                    viewMode === "list"
                      ? "bg-[#0C2340] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <List size={14} className="sm:w-4 sm:h-4" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </div>

          {/* Item Grid or List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {paginatedItems.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 bg-white rounded-xl sm:rounded-2xl border border-dashed border-gray-300">
                  <p className="text-xs sm:text-sm font-sf-medium font-medium text-gray-700 mb-1">
                    No items found
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4">
                    Try adjusting your filters or add a new item.
                  </p>
                  <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#e68b00] text-white rounded-lg hover:bg-[#d67a00] text-xs sm:text-sm font-sf-medium font-medium shadow-sm transition-colors"
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" />
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
                      className="relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                    >
                      {/* Three-dot menu (hidden when viewing archived items — archived items stay in archive, no actions) */}
                      {appliedFilters.itemStatus !== "archived" && (
                        <div
                          className="absolute top-2 right-2 sm:top-3 sm:right-3"
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
                              className="p-1.5 sm:p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                              aria-label="More options"
                            >
                              <MoreHorizontal size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                            {openMenuId === group.groupKey && (
                              <div className="absolute right-0 mt-2 w-36 sm:w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                  onClick={() => {
                                    openEditModal(representativeItem);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors font-sf-medium"
                                >
                                  Edit Item
                                </button>
                                <button
                                  onClick={async () => {
                                    setOpenMenuId(null);
                                    try {
                                      await archiveItem(representativeItem.id);
                                    } catch (_) {
                                      // Error already set in hook
                                    }
                                  }}
                                  className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors font-sf-medium"
                                >
                                  Archive Item
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="mb-3 sm:mb-4">
                        <div className="w-full h-40 sm:h-48 md:h-56 bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden flex items-center justify-center">
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
                            <div className="text-[10px] sm:text-xs text-gray-400 font-sf-medium">
                              No Image Available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Content */}
                      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                        <h3 className="text-xs sm:text-sm font-sf-semibold font-semibold text-[#0C2340] line-clamp-2">
                          {group.name}
                        </h3>

                        {/* Item Type Label */}
                        <p className="text-[10px] sm:text-xs text-gray-500 font-sf-medium font-medium">
                          {formatItemType(group.itemType)}
                        </p>

                        {/* Horizontal Divider */}
                        <hr className="border-gray-200 my-0.5 sm:my-1" />

                        {/* View Details Link - Centered */}
                        <button
                          type="button"
                          onClick={() =>
                            openItemDetailsModal(representativeItem)
                          }
                          className="mt-0.5 sm:mt-1 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-sf-medium font-medium text-[#0C2340] hover:text-[#e68b00]"
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
                    paginatedGroupedItems.map((group) => {
                      // Use first variation as representative item for operations
                      const representativeItem = group.variations[0];
                      const isSelected = selectedListRowKey === group.groupKey;

                      return (
                        <div
                          key={group.groupKey}
                          role="row"
                          tabIndex={0}
                          onClick={() => setSelectedListRowKey(group.groupKey)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedListRowKey(group.groupKey);
                            }
                          }}
                          className={`grid grid-cols-6 gap-4 px-6 py-4 items-center border-b border-[#e68b00]/30 transition-colors cursor-pointer ${
                            isSelected ? "bg-[#FFF5E0]" : "bg-white hover:bg-[#FFF8E7]"
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
              <div className="md:hidden space-y-2 sm:space-y-3">
                {paginatedGroupedItems.length === 0 ? (
                  <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                    <p className="text-xs sm:text-sm font-sf-medium font-medium">No items found</p>
                    <p className="text-[10px] sm:text-xs mt-1 font-sf-medium">
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
                        className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-2.5 sm:p-3 md:p-4 flex gap-2 sm:gap-3 md:gap-4"
                      >
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/64";
                            }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col gap-1.5 sm:gap-2 min-w-0">
                          <div className="flex justify-between items-start gap-1.5 sm:gap-2">
                            <div className="flex-1 min-w-0 pr-1.5 sm:pr-2">
                              <h3 className="text-xs sm:text-sm font-sf-semibold font-semibold text-[#0C2340] line-clamp-2 mb-0.5 sm:mb-1">
                                {group.name}
                              </h3>
                              <p className="text-[10px] sm:text-xs text-[#e68b00] font-sf-medium">
                                {formatItemType(group.itemType)}
                              </p>
                            </div>
                            <div className="text-[10px] sm:text-xs font-sf-semibold font-semibold text-[#003363] flex-shrink-0">
                              ₱{" "}
                              {representativeItem.price?.toLocaleString() ||
                                "0.00"}
                            </div>
                          </div>

                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-sf-medium">
                            Grade Level:{" "}
                            <span className="text-[#0C2340]">
                              {group.educationLevel || "—"}
                            </span>
                          </p>

                          {/* Actions — no Edit/Delete when viewing archived items */}
                          <div className="mt-1.5 sm:mt-2 flex justify-end gap-1 sm:gap-1.5 md:gap-2 flex-wrap">
                            <button
                              onClick={() =>
                                openItemDetailsModal(representativeItem)
                              }
                              className="px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1 md:py-1.5 rounded-md bg-[#0C2340]/10 text-[9px] sm:text-[10px] md:text-xs font-sf-medium font-medium text-[#0C2340] hover:bg-[#0C2340]/20 transition-colors"
                            >
                              View Details
                            </button>
                            {appliedFilters.itemStatus !== "archived" && (
                              <>
                                <button
                                  onClick={() => openEditModal(representativeItem)}
                                  className="px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1 md:py-1.5 rounded-md bg-blue-50 text-[9px] sm:text-[10px] md:text-xs font-sf-medium font-medium text-[#003363] hover:bg-blue-100 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    openDeleteModal(representativeItem)
                                  }
                                  className="px-1.5 sm:px-2 md:px-2.5 py-1 sm:py-1 md:py-1.5 rounded-md bg-red-50 text-[9px] sm:text-[10px] md:text-xs font-sf-medium font-medium text-[#e68b00] hover:bg-red-100 transition-colors"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Pagination: Previous / Next */}
          {hasPagination && (
            <div className="mt-4 sm:mt-6 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
              <div className="text-xs sm:text-sm text-gray-600 font-sf-medium">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPagesGrouped}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPagesGrouped}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          )}

          {/* Results Info */}
          {searchTerm && (
            <div className="mt-4 text-xs sm:text-sm text-gray-600 font-sf-medium">
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
            unreleasedCounts={unreleasedCounts}
            onClose={closeItemDetailsModal}
            onSelectVariation={selectVariation}
            onEditItem={() => {
              closeItemDetailsModal();
              // Use current item from list by id so edit modal gets latest note with all sizeVariations (Small, Medium, etc.)
              const itemToEdit =
                detailsSelectedItem?.id != null
                  ? items.find((i) => i.id === detailsSelectedItem.id) ??
                    detailsSelectedItem
                  : detailsSelectedItem;
              openEditModal(itemToEdit);
            }}
            onEdit={(variation) => {
              setVariantEdit({
                isOpen: true,
                parent: detailsSelectedItem,
                variation,
                variations,
              });
              closeItemDetailsModal();
            }}
            onDelete={(item) => {
              closeItemDetailsModal();
              openDeleteModal(item);
            }}
          />

          {/* Edit-per-variant modal (from Item Details → Edit on a variation) */}
          <ItemVariantEditModal
            isOpen={variantEdit.isOpen}
            parentItem={variantEdit.parent}
            variation={variantEdit.variation}
            variations={variantEdit.variations}
            onClose={() =>
              setVariantEdit((prev) => ({ ...prev, isOpen: false }))
            }
            onSave={async (payload) => {
              await updateItem(payload);
              setVariantEdit((prev) => ({ ...prev, isOpen: false }));
            }}
          />
        </>
      )}
      </div>
    </AdminLayout>
  );
};

export default Items;
