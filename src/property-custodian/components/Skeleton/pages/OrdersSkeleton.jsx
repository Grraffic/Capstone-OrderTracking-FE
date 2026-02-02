import React from "react";
import SkeletonStats from "../base/SkeletonStats";
import SkeletonTable from "../base/SkeletonTable";

/**
 * OrdersSkeleton Component
 *
 * Loading skeleton for the Orders page.
 * Matches the layout with:
 * - Page title and action buttons (responsive desktop/mobile)
 * - Multiple sections of stats cards
 * - Status tabs (3 tabs: Pre-orders, Orders, Claimed)
 * - Date range picker and filter dropdowns
 * - Orders table with pagination
 */
const OrdersSkeleton = () => {
  return (
    <div className="pt-0 px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 lg:pb-8 font-sf-medium">
      {/* Page Header - Title with QR Code and Search */}
      <div className="mb-4 sm:mb-6">
        {/* Desktop Layout: Title left, Controls right */}
        <div className="hidden lg:flex lg:items-center lg:justify-between">
          {/* Page Title */}
          <div className="h-10 xl:h-12 2xl:h-14 w-32 xl:w-36 2xl:w-40 bg-gray-200 rounded animate-pulse" />

          {/* QR Scanner and Search Bar - Right Side */}
          <div className="flex items-center gap-3">
            {/* QR Scanner Button */}
            <div className="h-10 xl:h-11 w-32 xl:w-40 bg-gray-200 rounded-lg animate-pulse" />
            {/* Search Bar */}
            <div className="h-10 xl:h-11 w-64 xl:w-72 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Mobile/Tablet Layout: Stacked */}
        <div className="lg:hidden">
          {/* Page Title */}
          <div className="h-7 sm:h-8 md:h-9 w-24 sm:w-28 md:w-32 bg-gray-200 rounded animate-pulse mb-3 sm:mb-4" />

          {/* QR Scanner and Search Bar - Side by Side on Mobile */}
          <div className="flex flex-row items-center gap-2">
            {/* QR Scanner Button */}
            <div className="h-10 w-20 sm:w-24 md:w-28 bg-gray-200 rounded-lg animate-pulse flex-shrink-0" />
            {/* Search Bar */}
            <div className="h-10 flex-1 min-w-0 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>

      {/* Statistics Cards - Multiple Sections */}
      <div className="space-y-4 sm:space-y-6">
        {/* Section 1: 4-Column Grid - Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((card) => (
            <div key={card} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 sm:h-7 md:h-8 w-16 sm:w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>

        {/* Section 2: 2-Column Grid - Unreleased/Released */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2].map((card) => (
            <div key={card} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                  <div className="h-3 sm:h-4 w-24 sm:w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 sm:h-7 md:h-8 w-12 sm:w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>

        {/* Section 3: 2-Column Grid - Processing/Claimed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[1, 2].map((card) => (
            <div key={card} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 space-y-1.5 sm:space-y-2">
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 sm:h-7 md:h-8 w-12 sm:w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg animate-pulse flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 xl:gap-8 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 pt-2 sm:pt-3">
        {[1, 2, 3].map((tab) => (
          <div
            key={tab}
            className="pb-2 sm:pb-3 h-6 sm:h-7 md:h-8 w-20 sm:w-24 md:w-28 lg:w-32 bg-gray-200 rounded animate-pulse flex-shrink-0"
          />
        ))}
      </div>

      {/* Date Range Selector and Filter Dropdowns */}
      <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Date Range Selector */}
        <div className="flex-1 min-w-0">
          <div className="h-10 sm:h-11 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Education Level Dropdown */}
        <div className="w-full sm:w-auto sm:min-w-[200px] sm:max-w-[300px]">
          <div className="h-10 sm:h-11 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Orders Table */}
      <SkeletonTable rows={8} columns={7} showCheckbox={true} />
    </div>
  );
};

export default OrdersSkeleton;
