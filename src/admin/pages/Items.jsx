import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import Sidebar from "../components/common/Sidebar";
import AdminHeader from "../components/common/AdminHeader";
import ItemsModals from "../components/Items/ItemsModals";
import ItemDetailsModal from "../components/Items/ItemDetailsModal";
import ItemAdjustmentModal from "../components/Items/ItemAdjustmentModal";
import QRCodeScannerModal from "../components/Items/QRCodeScannerModal";
import ItemsStatsCards from "../components/Items/ItemsStatsCards";
import {
  useAdminSidebar,
  useQRScanner,
  useItemsStats,
  useItems,
  useItemDetailsModal,
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
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [showFilters, setShowFilters] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null); // Track which item's menu is open
  const menuRef = useRef(null);
  // Custom hooks for UI state management
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();

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
    // Item Adjustment Modal
    adjustmentModalState,
    closeAdjustmentModal,
  } = useItems();

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

  // Calculate items statistics
  const stats = useItemsStats(filteredItems);

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
          {/* Page Header - Title */}
          <div className="mb-8">
            {/* Page Title */}
            <h1 className="text-4xl font-bold">
              <span className="text-[#0C2340]">Ite</span>
              <span className="text-[#e68b00]">ms</span>
            </h1>
          </div>

          {/* Statistics Cards Section */}
          <div className="mb-6">
            <ItemsStatsCards stats={stats} />
          </div>

          {/* Horizontal Level Selection Tabs */}
          <div className="mb-6">
            <div className="inline-flex flex-wrap gap-4 rounded-full bg-white p-2 shadow-sm border border-gray-100">
              {[
                "Preschool",
                "Elementary",
                "Junior Highschool",
                "Senior Highschool",
                "College",
              ].map((level) => {
                const isActive = selectedLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#0C2340] text-white shadow-sm"
                        : "text-[#0C2340] hover:bg-gray-100"
                    }`}
                  >
                    {level}
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
                {/* Education Level Filter */}
                <select
                  value={educationLevelFilter}
                  onChange={(e) => setEducationLevelFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  title="Filter by education level"
                  aria-label="Education Level"
                >
                  <option value="All Levels">Education Level</option>
                  <option value="All Levels">All Levels</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="Grade 1">Grade 1</option>
                  <option value="Grade 2">Grade 2</option>
                  <option value="Grade 3">Grade 3</option>
                  <option value="Grade 4">Grade 4</option>
                  <option value="Grade 5">Grade 5</option>
                  <option value="Grade 6">Grade 6</option>
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
                  <option value="Uniform">Uniform</option>
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
                paginatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                  >
                    {/* Three-dot menu (horizontal) */}
                    <div
                      className="absolute top-3 right-3"
                      ref={openMenuId === item.id ? menuRef : null}
                    >
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === item.id ? null : item.id
                            )
                          }
                          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          aria-label="More options"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenuId === item.id && (
                          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                openEditModal(item);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg transition-colors"
                            >
                              Edit Item
                            </button>
                            <button
                              onClick={() => {
                                openDeleteModal(item);
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
                      <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
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
                        {item.name}
                      </h3>

                      {/* Uniform Label */}
                      <p className="text-xs text-gray-500 font-medium">
                        Uniform
                      </p>

                      {/* Horizontal Divider */}
                      <hr className="border-gray-200 my-1" />

                      {/* View Details Link - Centered */}
                      <button
                        type="button"
                        onClick={() => openItemDetailsModal(item)}
                        className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-[#0C2340] hover:text-[#e68b00]"
                      >
                        <span>View Details</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* List View - Table with dark blue header and cream rows */
            <div className="rounded-xl overflow-hidden shadow-sm">
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
                {paginatedItems.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 bg-white">
                    <p className="text-sm font-medium">No items found</p>
                    <p className="text-xs mt-1">
                      Try adjusting your filters or add a new item.
                    </p>
                  </div>
                ) : (
                  paginatedItems.map((item, index) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-6 gap-4 px-6 py-4 items-center border-b border-[#e68b00]/30 hover:bg-[#FFF8E7] transition-colors ${
                        index === 0 ? "bg-[#FFF5E0]" : "bg-white"
                      }`}
                    >
                      {/* Image */}
                      <div>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/56";
                          }}
                        />
                      </div>

                      {/* Item Name */}
                      <div className="text-[#0C2340] text-sm font-medium">
                        {item.name}
                      </div>

                      {/* Item Type */}
                      <div className="text-[#e68b00] text-sm">
                        {item.itemType || "Uniform"}
                      </div>

                      {/* Grade Level */}
                      <div className="text-[#0C2340] text-sm">
                        {item.educationLevel}
                      </div>

                      {/* Cost Summary */}
                      <div className="text-[#003363] text-sm font-semibold">
                        ₱ {item.price?.toLocaleString() || "0.00"}
                      </div>

                      {/* Action */}
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-[#003363] transition-colors"
                          title="Edit"
                          aria-label="Edit item"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="p-2 rounded-lg hover:bg-red-50 text-[#e68b00] transition-colors"
                          title="Delete"
                          aria-label="Delete item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Results Info */}
          {searchTerm && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredItems.length} result
              {filteredItems.length !== 1 ? "s" : ""} for "{searchTerm}"
            </div>
          )}
        </div>
      </main>

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
    </div>
  );
};

export default Items;
