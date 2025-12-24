import React from "react";
import ItemsStatsCards from "../Items/ItemsStatsCards";
import InventoryControlBar from "./InventoryControlBar";
import InventoryTable from "./InventoryTable";

/**
 * InventoryView Component
 *
 * Main view for inventory management showing:
 * - Stats cards
 * - Control bar with filters
 * - Inventory table
 */
const InventoryView = ({
  stats,
  startDate,
  endDate,
  onDateRangeChange,
  gradeLevel,
  onGradeLevelChange,
  onUpdateQuantityClick,
  inventoryData,
}) => {
  return (
    <>
      {/* Stats Cards */}
      <div className="mb-6">
        <ItemsStatsCards stats={stats} />
      </div>

      {/* Control Bar */}
      <InventoryControlBar
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        gradeLevel={gradeLevel}
        onGradeLevelChange={onGradeLevelChange}
        onUpdateQuantityClick={onUpdateQuantityClick}
      />

      {/* Inventory Table */}
      <InventoryTable inventoryData={inventoryData} />
    </>
  );
};

export default InventoryView;
