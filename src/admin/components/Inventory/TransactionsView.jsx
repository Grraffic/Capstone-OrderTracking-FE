import React from "react";
import ItemsStatsCards from "../Items/ItemsStatsCards";
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
  stats,
  startDate,
  endDate,
  onDateRangeChange,
  transactionTypeFilter,
  onTransactionTypeFilterChange,
  transactionCounts,
  filteredTransactions,
}) => {
  return (
    <>
      {/* Stats Cards */}
      <div className="mb-6">
        <ItemsStatsCards stats={stats} />
      </div>

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
      <TransactionsTable transactions={filteredTransactions} />
    </>
  );
};

export default TransactionsView;
