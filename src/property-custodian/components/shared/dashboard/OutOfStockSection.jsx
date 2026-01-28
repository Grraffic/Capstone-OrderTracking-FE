import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InventoryDetailTable from "./InventoryDetailTable";
import EducationLevelFilter from "./EducationLevelFilter";
import { useInventoryOutOfStock } from "../../../hooks/dashboard/useInventoryOutOfStock";

/**
 * OutOfStockSection Component
 *
 * Inline expandable section that displays detailed inventory data for items that are out of stock.
 * Appears below the InventoryHealth cards when "Out of Stock" is clicked.
 *
 * Props:
 * - totalOutOfStock: number - Total count for footer display
 */
const OutOfStockSection = ({ totalOutOfStock }) => {
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("College");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Maximum 4 items per page

  const { data, loading, error, refetch } = useInventoryOutOfStock(selectedEducationLevel);

  // Reset to page 1 when education level changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEducationLevel]);

  // Ensure data is an array - must be before any conditional returns
  const safeData = Array.isArray(data) ? data : [];

  // Calculate pagination
  const totalItems = Array.isArray(safeData) ? safeData.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = Array.isArray(safeData) 
    ? safeData.slice(startIndex, endIndex) 
    : [];

  // Calculate total items (one row per item now)
  const totalItemsCount = Array.isArray(safeData) ? safeData.length : 0;

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Safety check: ensure data is initialized
  if (data === undefined && !loading && !error) {
    return (
      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p className="text-sm text-gray-500">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Education Level:
              </label>
              <div className="w-full sm:w-auto min-w-[200px]">
                <EducationLevelFilter
                  value={selectedEducationLevel}
                  onChange={setSelectedEducationLevel}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              Error loading inventory data: {error}
            </p>
          </div>
        ) : (
          <InventoryDetailTable
            data={paginatedData}
            loading={loading}
            educationLevel={selectedEducationLevel}
            showFooter={false}
            onVariantChange={refetch}
          />
        )}
      </div>

      {/* Footer with pagination */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Out of Stock - {selectedEducationLevel}: {totalItemsCount} Items
          </p>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0C2340] hover:text-white hover:border-[#0C2340] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-colors flex items-center gap-1 text-sm font-medium"
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
                <span>Previous</span>
              </button>
              
              <span className="text-sm text-gray-600 px-3">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0C2340] hover:text-white hover:border-[#0C2340] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-colors flex items-center gap-1 text-sm font-medium"
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutOfStockSection;
