import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AtReorderPointTable from "./AtReorderPointTable";
import EducationLevelFilter from "./EducationLevelFilter";
import { useInventoryAtReorderPoint } from "../../../hooks/dashboard/useInventoryAtReorderPoint";

/**
 * AtReorderPointSection Component
 *
 * Inline expandable section that displays detailed inventory data for items at reorder point.
 * Appears below the InventoryHealth cards when "At Reorder Point" is clicked.
 *
 * Props:
 * - totalAtReorderPoint: number - Total count for footer display
 * - inventoryRows: optional transformed rows from Inventory page (same source as main table).
 *   When provided, rows with endingInventory <= 0 on that table are excluded (OOS on books).
 */
const normalizeSizeForMatch = (s) =>
  (s || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, "")
    .trim();

const AtReorderPointSection = ({ totalAtReorderPoint, inventoryRows = [] }) => {
  const [selectedEducationLevel, setSelectedEducationLevel] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Maximum 4 items per page

  const { data, loading, error, refetch } = useInventoryAtReorderPoint(
    selectedEducationLevel,
  );

  // Ensure data is an array - must be before any conditional returns
  const safeData = Array.isArray(data) ? data : [];

  // Align with main Inventory table: raw report can show ending > 0 while table shows 0 after orders.
  const displayData = useMemo(() => {
    if (!Array.isArray(safeData) || safeData.length === 0) return safeData;
    if (!Array.isArray(inventoryRows) || inventoryRows.length === 0) {
      return safeData;
    }
    return safeData.filter((row) => {
      const match = inventoryRows.find((inv) => {
        const nameMatch =
          (inv.item || "").trim().toLowerCase() ===
          (row.itemName || "").trim().toLowerCase();
        const eduMatch =
          (inv.educationLevel || "").trim() ===
          (row.educationLevel || "").trim();
        const invSz = normalizeSizeForMatch(inv.size || "N/A");
        const rowSz = normalizeSizeForMatch(row.size || "N/A");
        return nameMatch && eduMatch && invSz === rowSz;
      });
      if (!match) return true;
      return (Number(match.endingInventory) || 0) > 0;
    });
  }, [safeData, inventoryRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedEducationLevel, displayData.length]);

  // Calculate pagination (one row per size variant)
  const totalItems = Array.isArray(displayData) ? displayData.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = Array.isArray(displayData)
    ? displayData.slice(startIndex, endIndex)
    : [];

  const totalItemsCount = Array.isArray(displayData) ? displayData.length : 0;

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
    <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out font-sf-medium">
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
          <AtReorderPointTable
            data={paginatedData}
            loading={loading}
            educationLevel={selectedEducationLevel}
            onRefetch={refetch}
          />
        )}
      </div>

      {/* Footer with pagination */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            At Reorder Point -{" "}
            {selectedEducationLevel === "all"
              ? "All Education Levels"
              : selectedEducationLevel}
            : {totalItemsCount} Items
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

export default AtReorderPointSection;
