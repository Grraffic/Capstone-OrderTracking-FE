import React from "react";
import SkeletonStats from "../base/SkeletonStats";
import SkeletonImage from "../base/SkeletonImage";
import SkeletonText from "../base/SkeletonText";

/**
 * ItemsSkeleton Component
 *
 * Loading skeleton for the Items page.
 * Matches the layout with:
 * - Page title
 * - Stats cards (5 columns)
 * - Education level filter tabs
 * - Search and filter controls
 * - Grid of item cards
 *
 * Props:
 * - viewMode: "grid" or "list" (default: "grid")
 */
const ItemsSkeleton = ({ viewMode = "grid" }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Header - Title */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="h-8 sm:h-10 w-24 sm:w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Statistics Cards Section - 5 columns */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((card) => (
            <SkeletonStats key={card} variant="vertical" />
          ))}
        </div>
      </div>

      {/* Education Level Tabs */}
      <div className="mb-4 sm:mb-6">
        <div className="inline-flex flex-wrap gap-2 sm:gap-4 rounded-full bg-white p-2 shadow-sm border border-gray-100">
          {[1, 2, 3, 4, 5].map((tab) => (
            <div
              key={tab}
              className="h-7 sm:h-8 w-16 sm:w-24 bg-gray-200 rounded-full animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* List of Items Header + Controls */}
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          {/* Title */}
          <div className="h-7 sm:h-8 w-32 sm:w-40 bg-gray-200 rounded animate-pulse" />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            {/* Add Item Button */}
            <div className="h-10 w-full sm:w-32 bg-gray-200 rounded-lg animate-pulse" />
            {/* Search Bar */}
            <div className="h-10 w-full sm:w-64 bg-gray-200 rounded-lg animate-pulse" />
            {/* Filter Button */}
            <div className="h-10 w-full sm:w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-end">
          <div className="h-10 w-full sm:w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full sm:w-48 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-end">
          <div className="h-10 w-full sm:w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Item Grid or List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100"
            >
              {/* Product Image */}
              <div className="mb-3 sm:mb-4">
                <SkeletonImage height="h-32 sm:h-40" rounded="rounded-xl" />
              </div>

              {/* Product Content */}
              <div className="space-y-2">
                <SkeletonText width="full" height="medium" />
                <SkeletonText width="1/2" height="small" />
                <hr className="border-gray-200 my-1" />
                <div className="flex items-center justify-center">
                  <SkeletonText width="1/3" height="small" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View - Table */
        <div className="rounded-xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="bg-[#003363] h-14" />

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="grid grid-cols-6 gap-2 sm:gap-4 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 items-center bg-white"
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsSkeleton;
