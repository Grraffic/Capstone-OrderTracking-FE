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
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Top Row - Date Range (Centered on Mobile) */}
        <div className="flex items-center justify-center sm:justify-start">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateRangeChange={onDateRangeChange}
            className="w-full sm:w-auto"
          />
        </div>

        {/* Bottom Row - Transaction Type Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-0 sm:mr-2">
            Filter by:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onTransactionTypeFilterChange("all")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                transactionTypeFilter === "all"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All <span className="font-semibold">({transactionCounts.all})</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("purchases")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                transactionTypeFilter === "purchases"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Purchases <span className="font-semibold">({transactionCounts.purchases})</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("returns")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                transactionTypeFilter === "returns"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Returns <span className="font-semibold">({transactionCounts.returns})</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("releases")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                transactionTypeFilter === "releases"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Releases <span className="font-semibold">({transactionCounts.releases})</span>
            </button>
            <button
              onClick={() => onTransactionTypeFilterChange("items")}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                transactionTypeFilter === "items"
                  ? "bg-gray-200 text-gray-800"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Items <span className="font-semibold">({transactionCounts.items})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsControlBar;

