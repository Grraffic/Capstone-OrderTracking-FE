import React from "react";
import DateRangePicker from "../common/DateRangePicker";

/**
 * TransactionsControlBar Component
 * 
 * Control bar for transactions view with:
 * - Date range picker
 * - Transaction type filters (All, Purchases, Returns, Releases, Items)
 */
const TransactionsControlBar = ({
  startDate,
  endDate,
  onDateRangeChange,
  transactionTypeFilter,
  onTransactionTypeFilterChange,
  transactionCounts,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
        {/* Date Range */}
        <div className="flex items-center justify-center lg:justify-start">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Transaction Type Filters - Segmented Control Style */}
        <div className="flex items-center justify-center sm:justify-start">
          <div 
            className="inline-flex items-center border border-gray-300 rounded-lg p-1 gap-1"
            style={{ backgroundColor: 'rgba(215, 215, 215, 0.9)' }}
          >
            <button
              onClick={() => onTransactionTypeFilterChange("all")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                transactionTypeFilter === "all"
                  ? "bg-white text-gray-800"
                  : "bg-transparent text-gray-600 hover:bg-white/50"
              }`}
            >
              All <span className="font-semibold">{transactionCounts.all}</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("purchases")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                transactionTypeFilter === "purchases"
                  ? "bg-white text-gray-800"
                  : "bg-transparent text-gray-600 hover:bg-white/50"
              }`}
            >
              Purchases <span className="font-semibold">{transactionCounts.purchases}</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("returns")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                transactionTypeFilter === "returns"
                  ? "bg-white text-gray-800"
                  : "bg-transparent text-gray-600 hover:bg-white/50"
              }`}
            >
              Returns <span className="font-semibold">{transactionCounts.returns}</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("releases")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                transactionTypeFilter === "releases"
                  ? "bg-white text-gray-800"
                  : "bg-transparent text-gray-600 hover:bg-white/50"
              }`}
            >
              Releases <span className="font-semibold">{transactionCounts.releases}</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("items")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                transactionTypeFilter === "items"
                  ? "bg-white text-gray-800"
                  : "bg-transparent text-gray-600 hover:bg-white/50"
              }`}
            >
              Items <span className="font-semibold">{transactionCounts.items}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsControlBar;

