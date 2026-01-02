import React from "react";
import SkeletonStats from "../base/SkeletonStats";

/**
 * InventorySkeleton Component
 *
 * Loading skeleton for the Inventory page.
 * Matches the layout with:
 * - Stats cards (5 columns)
 * - Control bar with date range picker and filters
 * - Inventory table (desktop, tablet, and mobile layouts)
 *
 * Follows separation of concerns by using base skeleton components.
 */
const InventorySkeleton = () => {
  return (
    <div className="w-full">
      {/* Stats Cards */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((card) => (
            <SkeletonStats key={card} variant="vertical" />
          ))}
        </div>
      </div>

      {/* Control Bar Skeleton */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Date Range Picker Skeleton */}
          <div className="flex items-center justify-center sm:justify-start">
            <div className="w-full sm:w-auto h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Grade Level and Update Quantity Button Skeleton */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="w-full sm:w-auto h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="w-full sm:w-auto sm:min-w-[200px] h-10 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Inventory Table Skeleton */}
      <InventoryTableSkeleton />
    </div>
  );
};

/**
 * InventoryTableSkeleton Component
 *
 * Skeleton for the inventory table with three responsive layouts:
 * - Desktop table (11 columns)
 * - Tablet scrollable table
 * - Mobile card layout
 *
 * Separated into its own component for better organization.
 */
const InventoryTableSkeleton = () => {
  const rows = 8; // Match pagination: 8 items per page
  const columns = 11; // No., Item, Beginning Inv., Unreleased, Purchases, Released, Returns, Available, Ending Inv., Unit Price, Total Amount

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-sm">
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0C2340]">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-3 lg:px-4 py-3 text-left">
                  <div className="h-3 sm:h-4 w-12 sm:w-20 bg-gray-300 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${
                  rowIndex % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                }`}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-3 lg:px-4 py-3">
                    {colIndex === 1 ? (
                      // Item column with name and size badge
                      <div className="flex flex-col gap-1">
                        <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-12 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                    ) : (
                      <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded animate-pulse" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout Skeleton */}
      <div className="sm:hidden space-y-3 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${
              index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="h-3 w-6 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
            </div>

            {/* Grid of fields */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, fieldIndex) => (
                <div key={fieldIndex}>
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Total Amount */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Tablet/Medium Mobile Table Skeleton */}
      <div className="hidden sm:block md:hidden overflow-x-auto -mx-4 px-4">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-[#0C2340]">
                <tr>
                  {Array.from({ length: columns }).map((_, index) => (
                    <th
                      key={index}
                      className={`px-3 py-3 text-left ${
                        index === 0 ? "sticky left-0 z-10 bg-[#0C2340]" : ""
                      }`}
                    >
                      <div className="h-3 w-12 bg-gray-300 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={`${
                      rowIndex % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                    }`}
                  >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-3 py-3 ${
                          colIndex === 0
                            ? "sticky left-0 z-10 bg-inherit"
                            : ""
                        }`}
                      >
                        {colIndex === 1 ? (
                          <div className="flex flex-col gap-1">
                            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                            <div className="h-4 w-10 bg-gray-200 rounded-full animate-pulse" />
                          </div>
                        ) : (
                          <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySkeleton;

