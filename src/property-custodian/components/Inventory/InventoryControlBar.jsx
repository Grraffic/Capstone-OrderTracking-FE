import React from "react";
import DateRangePicker from "../common/DateRangePicker";

/**
 * InventoryControlBar Component
 *
 * Control bar for inventory view with:
 * - Date range picker (for comparing releases across time periods)
 * - Add Inventory button
 * - Set item reorder point button
 * - Grade level dropdown
 */
const InventoryControlBar = ({
  startDate,
  endDate,
  onDateRangeChange,
  gradeLevel,
  onGradeLevelChange,
  onUpdateQuantityClick,
  onSetReorderPointClick,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-2 sm:px-3 md:px-2.5 lg:px-4 py-1.5 sm:py-2 md:py-2 lg:py-2.5 mb-3 sm:mb-4 md:mb-4 shadow-sm overflow-visible font-sf-medium">
      <div className="flex flex-col md:flex-row items-stretch md:items-center md:justify-between gap-1.5 sm:gap-2 md:gap-2 lg:gap-3">
        {/* Left Side - Date Range Picker */}
        <div className="flex justify-start w-full md:w-auto md:flex-shrink-0 md:min-w-0 overflow-visible relative z-10">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
            className="w-full sm:w-full md:w-auto md:max-w-[300px] lg:max-w-none max-w-full"
          />
        </div>

        {/* Right Side - Set item reorder point, Add Inventory, Grade Level Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2 md:gap-2 w-full md:w-auto md:flex-shrink-0 relative z-0">
          {/* Set item reorder point Button */}
          {onSetReorderPointClick && (
            <button
              onClick={onSetReorderPointClick}
              type="button"
              className="w-full sm:w-auto px-2.5 sm:px-3 md:px-3.5 lg:px-5 py-1 sm:py-1.5 md:py-1.5 lg:py-2 bg-[#E68B00] text-white font-medium rounded-lg hover:bg-[#D67A00] transition-colors duration-200 shadow-sm text-xs sm:text-sm md:text-sm lg:text-base whitespace-nowrap flex-shrink-0"
            >
              Set item reorder point
            </button>
          )}
          {/* Add Inventory Button */}
          <button
            onClick={onUpdateQuantityClick}
            className="w-full sm:w-auto px-2.5 sm:px-3 md:px-3.5 lg:px-5 py-1 sm:py-1.5 md:py-1.5 lg:py-2 bg-[#E68B00] text-white font-medium rounded-lg hover:bg-[#D67A00] transition-colors duration-200 shadow-sm text-xs sm:text-sm md:text-sm lg:text-base whitespace-nowrap flex-shrink-0"
          >
            Add Inventory
          </button>
          {/* Grade Level Dropdown */}
          <div className="w-full sm:w-auto sm:min-w-[140px] md:min-w-[150px] lg:min-w-[180px] xl:min-w-[200px] flex-shrink-0">
            <select
              value={gradeLevel}
              onChange={(e) => onGradeLevelChange(e.target.value)}
              className="appearance-none w-full px-2.5 sm:px-3 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-1.5 lg:py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm md:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E68B00] focus:border-transparent cursor-pointer pr-8 sm:pr-9 md:pr-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1rem",
              }}
            >
              <option value="all">Grade Level Category</option>
              <option value="kinder">Kindergarten</option>
              <option value="elementary">Elementary</option>
              <option value="junior">Junior High School</option>
              <option value="senior">Senior High School</option>
              <option value="college">College</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryControlBar;
