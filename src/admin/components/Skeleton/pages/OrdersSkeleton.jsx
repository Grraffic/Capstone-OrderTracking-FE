import React from "react";
import SkeletonStats from "../base/SkeletonStats";
import SkeletonTable from "../base/SkeletonTable";

/**
 * OrdersSkeleton Component
 *
 * Loading skeleton for the Orders page.
 * Matches the layout with:
 * - Page title and action buttons
 * - Multiple sections of stats cards
 * - Status tabs
 * - Orders table with pagination
 */
const OrdersSkeleton = () => {
  return (
    <div className="p-8">
      {/* Page Header - Title and Controls */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Page Title */}
        <div className="h-10 w-36 bg-gray-200 rounded animate-pulse" />

        {/* Top-Right Controls */}
        <div className="flex items-center gap-3">
          {/* QR Scanner Button */}
          <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse" />
          {/* Search Bar */}
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Statistics Cards - Multiple Sections */}
      <div className="mb-8 space-y-4">
        {/* First Row - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((card) => (
            <SkeletonStats key={card} variant="vertical" />
          ))}
        </div>

        {/* Second Row - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((card) => (
            <SkeletonStats key={`row2-${card}`} variant="vertical" />
          ))}
        </div>

        {/* Third Row - 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((card) => (
            <SkeletonStats key={`row3-${card}`} variant="vertical" />
          ))}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 flex items-center gap-6 border-b border-gray-200">
        {[1, 2].map((tab) => (
          <div
            key={tab}
            className="pb-3 h-8 w-24 bg-gray-200 rounded animate-pulse"
          />
        ))}
      </div>

      {/* Orders Table */}
      <SkeletonTable rows={10} columns={7} showCheckbox={true} />
    </div>
  );
};

export default OrdersSkeleton;
