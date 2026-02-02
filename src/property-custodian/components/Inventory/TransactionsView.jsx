import React from "react";
import TransactionsControlBar from "./TransactionsControlBar";
import TransactionsTable from "./TransactionsTable";

/**
 * TransactionsView Component
 *
 * Main view for transactions showing:
 * - Stats cards
 * - Control bar with transaction type filters
 * - Transactions table
 */
const TransactionsView = ({
  startDate,
  endDate,
  onDateRangeChange,
  transactionTypeFilter,
  onTransactionTypeFilterChange,
  transactionCounts,
  filteredTransactions,
  transactionCurrentPage,
  transactionPagination,
  onTransactionPageChange,
}) => {
  return (
    <div className="w-full">
      {/* Control Bar */}
      <TransactionsControlBar
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        transactionTypeFilter={transactionTypeFilter}
        onTransactionTypeFilterChange={onTransactionTypeFilterChange}
        transactionCounts={transactionCounts}
      />

      {/* Transactions Table */}
      <TransactionsTable
        transactions={filteredTransactions}
        currentPage={transactionCurrentPage}
        pagination={transactionPagination}
        onPageChange={onTransactionPageChange}
      />
    </div>
  );
};

export default TransactionsView;
