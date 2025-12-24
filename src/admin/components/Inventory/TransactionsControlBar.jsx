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

        {/* Right Side - Transaction Type Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onTransactionTypeFilterChange("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              transactionTypeFilter === "all"
                ? "bg-gray-200 text-gray-800"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All {transactionCounts.all}
          </button>
          <button
            onClick={() => onTransactionTypeFilterChange("purchases")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              transactionTypeFilter === "purchases"
                ? "bg-gray-200 text-gray-800"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Purchases {transactionCounts.purchases}
          </button>
          <button
            onClick={() => onTransactionTypeFilterChange("returns")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              transactionTypeFilter === "returns"
                ? "bg-gray-200 text-gray-800"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Returns {transactionCounts.returns}
          </button>
          <button
            onClick={() => onTransactionTypeFilterChange("releases")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              transactionTypeFilter === "releases"
                ? "bg-gray-200 text-gray-800"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Releases {transactionCounts.releases}
          </button>
          <button
            onClick={() => onTransactionTypeFilterChange("items")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              transactionTypeFilter === "items"
                ? "bg-gray-200 text-gray-800"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Items {transactionCounts.items}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionsControlBar;

