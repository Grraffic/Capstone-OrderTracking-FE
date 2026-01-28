import React, { useState, useEffect, useMemo } from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import EligibilityTable from "../components/EligibilityManagement/EligibilityTable";
import { useEligibility } from "../hooks/useEligibility";
import { FileCheck, Search, Edit2, X, Save } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * EligibilityManagement Page
 *
 * Main page for managing item eligibility across education levels
 * Features:
 * - View items with eligibility checkboxes
 * - Edit mode for updating eligibility
 * - Search functionality
 * - Pagination
 * - Delete items
 */
const ITEMS_PER_PAGE = 8;

const EligibilityManagement = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const {
    items,
    loading,
    saving,
    error,
    pagination,
    isEditMode,
    hasChanges,
    fetchEligibilityData,
    updateLocalChange,
    saveChanges,
    cancelChanges,
    toggleEditMode,
    deleteItem,
    getItemEligibility,
  } = useEligibility();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data when search changes. Use high limit so we get all items to merge with canonical list; we paginate the merged list on the frontend.
  useEffect(() => {
    fetchEligibilityData({
      page: 1,
      limit: 200,
      search: debouncedSearch,
      filter: "all",
    });
  }, [debouncedSearch, fetchEligibilityData]);

  // Frontend pagination: max 8 items per table page
  const totalDisplayPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(
    () =>
      items.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      ),
    [items, currentPage]
  );

  // Reset to page 1 when total items shrink and we're past the last page
  useEffect(() => {
    if (
      items.length > 0 &&
      (currentPage - 1) * ITEMS_PER_PAGE >= items.length
    ) {
      setCurrentPage(1);
    }
  }, [items.length, currentPage]);

  /**
   * Handle edit table button click
   */
  const handleEditTable = () => {
    toggleEditMode();
  };

  /**
   * Handle save changes
   */
  const handleSaveChanges = async () => {
    try {
      await saveChanges();
    } catch (error) {
      // Error already handled in hook
      console.error("Failed to save changes:", error);
    }
  };

  /**
   * Handle cancel changes
   */
  const handleCancelChanges = () => {
    cancelChanges();
    toast.success("Changes cancelled");
  };

  /**
   * Handle eligibility checkbox change
   */
  const handleEligibilityChange = (itemId, eligibility) => {
    updateLocalChange(itemId, eligibility);
  };

  /**
   * Handle delete item
   */
  const handleDeleteItem = async (itemId) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      // Error already handled in hook
      console.error("Failed to delete item:", error);
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#0C2340] rounded-full flex items-center justify-center">
            <FileCheck className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0C2340]">
              Eligibility Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Management for the Eligibility of Uniforms
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <div className="max-w-md relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
              />
            </div>
          </div>

          {/* Edit Table Button */}
          <button
            onClick={handleEditTable}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isEditMode
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-[#0C2340] text-white hover:bg-[#0a1d33]"
            }`}
          >
            {isEditMode ? (
              <>
                <X size={18} />
                Cancel Edit
              </>
            ) : (
              <>
                <Edit2 size={18} />
                Edit Table
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Eligibility Table (max 8 items per page) */}
        <EligibilityTable
          items={paginatedItems}
          loading={loading}
          isEditMode={isEditMode}
          onEligibilityChange={handleEligibilityChange}
          onDeleteItem={handleDeleteItem}
          getItemEligibility={getItemEligibility}
        />

        {/* Pagination Info */}
        {items.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing{" "}
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, items.length)} of{" "}
              {items.length} items
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalDisplayPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalDisplayPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons (only visible in edit mode) */}
        {isEditMode && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCancelChanges}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={!hasChanges || saving}
              className="px-6 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} />
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </SystemAdminLayout>
  );
};

export default EligibilityManagement;
