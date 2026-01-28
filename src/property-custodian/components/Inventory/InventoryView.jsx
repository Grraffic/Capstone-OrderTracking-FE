import React from "react";
import InventoryControlBar from "./InventoryControlBar";
import InventoryTable from "./InventoryTable";
import { InventorySkeleton } from "../Skeleton";

/**
 * InventoryView Component
 *
 * Main view for inventory management showing:
 * - Stats cards
 * - Control bar with filters
 * - Inventory table
 *
 * Uses separation of concerns:
 * - InventorySkeleton component handles all loading states
 * - InventoryTable component handles data display
 */
const InventoryView = ({
  stats,
  startDate,
  endDate,
  onDateRangeChange,
  gradeLevel,
  onGradeLevelChange,
  onUpdateQuantityClick,
  onSetReorderPointClick,
  inventoryData,
  loading = false,
}) => {
  // Only show skeleton on initial load when there's no data
  const isInitialLoad = loading && inventoryData.length === 0;

  if (isInitialLoad) {
    return <InventorySkeleton />;
  }

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      {/* Control Bar */}
      <InventoryControlBar
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        gradeLevel={gradeLevel}
        onGradeLevelChange={onGradeLevelChange}
        onUpdateQuantityClick={onUpdateQuantityClick}
        onSetReorderPointClick={onSetReorderPointClick}
      />

      {/* Inventory Table with loading overlay */}
      <div className="relative transition-all duration-300 ease-in-out">
        {/* Subtle loading overlay - doesn't replace the table */}
        {loading && inventoryData.length > 0 && (
          <div className="absolute inset-0 bg-white bg-opacity-60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#E68B00] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Searching...</span>
            </div>
          </div>
        )}

        {inventoryData.length === 0 && !loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
            <div className="text-sm sm:text-base text-gray-500">
              No inventory data available
            </div>
          </div>
        ) : (
          <InventoryTable inventoryData={inventoryData} />
        )}
      </div>
    </div>
  );
};

export default InventoryView;
