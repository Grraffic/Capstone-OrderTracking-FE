import React from "react";
import SkeletonStats from "../base/SkeletonStats";
import SkeletonTable from "../base/SkeletonTable";
import SkeletonText from "../base/SkeletonText";

/**
 * DashboardSkeleton Component
 *
 * Loading skeleton for the AdminDashboard page.
 * Matches the layout of the actual dashboard with:
 * - Page title
 * - 2x2 grid of overview stats cards
 * - Stock Levels section
 * - Recent Orders table
 */
const DashboardSkeleton = () => {
  return (
    <div className="p-8">
      {/* Page Title Skeleton */}
      <div className="mb-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Overview and Stock Levels - Side by Side Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Side: Overview Section */}
        <div>
          {/* Section Header with Tabs */}
          <div className="flex items-center gap-8 mb-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            {/* Tabs */}
            <div className="flex gap-6">
              {[1, 2, 3].map((tab) => (
                <div
                  key={tab}
                  className="h-5 w-16 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Overview Cards - 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((card) => (
              <SkeletonStats key={card} variant="horizontal" />
            ))}
          </div>
        </div>

        {/* Right Side: Stock Levels Chart */}
        <div>
          {/* Section Header */}
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          {/* Chart Placeholder */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-64">
            <div className="h-full w-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div>
        {/* Section Header */}
        <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
        {/* Recent Orders Table */}
        <SkeletonTable rows={5} columns={6} showCheckbox={false} />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
