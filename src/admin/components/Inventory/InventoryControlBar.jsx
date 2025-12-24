import React from "react";
import DateRangePicker from "../common/DateRangePicker";

/**
 * InventoryControlBar Component
 * 
 * Control bar for inventory view with:
 * - Date range picker
 * - Grade level dropdown
 * - Update Quantity button
 */
const InventoryControlBar = ({
  startDate,
  endDate,
  onDateRangeChange,
  gradeLevel,
  onGradeLevelChange,
  onUpdateQuantityClick,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Side - Date Range */}
        <div className="flex items-center gap-3">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
            className="w-auto"
          />
        </div>

        {/* Right Side - Grade Level Dropdown and Update Quantity Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Update Quantity Button */}
          <button
            onClick={onUpdateQuantityClick}
            className="px-6 py-2 bg-[#E68B00] text-white font-medium rounded-lg hover:bg-[#D67A00] transition-colors duration-200 shadow-sm"
          >
            Update Quantity
          </button>
          <div className="w-full sm:w-auto">
            <select
              value={gradeLevel}
              onChange={(e) => onGradeLevelChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent cursor-pointer"
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
    </div>
  );
};

export default InventoryControlBar;

