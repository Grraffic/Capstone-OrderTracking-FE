import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InventoryDetailTable from "./InventoryDetailTable";
import EducationLevelFilter from "./EducationLevelFilter";
import { useInventoryDetail } from "../../../hooks/dashboard/useInventoryDetail";

/**
 * InventoryDetailSection Component
 *
 * Inline expandable section that displays detailed inventory data.
 * Appears below the InventoryHealth cards when "Total Item Variant" is clicked.
 *
 * Props:
 * - totalItemVariants: number - Total count for footer display
 */
const InventoryDetailSection = ({ totalItemVariants }) => {
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("College");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Maximum 4 items per page

  const { data, loading, error, refetch } = useInventoryDetail(selectedEducationLevel);

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
      <div className="mt-4 sm:mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-2.5 sm:p-3 md:p-4">
        <p className="text-xs sm:text-sm text-gray-500">Loading inventory data...</p>
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="px-2.5 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                Education Level:
              </label>
              <div className="flex-1 sm:flex-none sm:w-auto min-w-0 sm:min-w-[200px]">
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
      <div className="p-2.5 sm:p-3 md:p-4 lg:p-6">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-600">
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
      <div className="px-2.5 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3 md:gap-4">
          <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 font-sf-medium">
            Total Items - {selectedEducationLevel}: {totalItemsCount} Items
          </p>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0C2340] hover:text-white hover:border-[#0C2340] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-colors flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-medium"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-600 px-2 sm:px-3 font-sf-medium">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages}
                className="px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0C2340] hover:text-white hover:border-[#0C2340] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-colors flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-medium"
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryDetailSection;
