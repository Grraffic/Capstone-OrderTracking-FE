import React from "react";

/**
 * SkeletonStats Component
 *
 * A stats card skeleton matching the existing stats card layouts.
 * Used for overview cards, items stats, and orders stats.
 *
 * Props:
 * - variant: Layout variant - "horizontal" (icon + text side by side) or "vertical" (icon above text) (default: "horizontal")
 * - showIcon: Whether to show icon placeholder (default: true)
 * - className: Additional custom classes
 */
const SkeletonStats = ({
  variant = "horizontal",
  showIcon = true,
  className = "",
}) => {
  if (variant === "horizontal") {
    // Used for Dashboard OverviewCards
    return (
      <div
        className={`bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-200 ${className}`}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Circular Icon Placeholder */}
          {showIcon && (
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 animate-pulse" />
          )}

          {/* Metric Value and Label */}
          <div className="flex-1 space-y-2">
            {/* Value */}
            <div className="h-8 sm:h-10 w-16 bg-gray-200 rounded animate-pulse" />
            {/* Label */}
            <div className="h-3 sm:h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Vertical variant - Used for Items and Orders stats cards
  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          {/* Label */}
          <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          {/* Value */}
          <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Icon Placeholder */}
        {showIcon && (
          <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse" />
        )}
      </div>
    </div>
  );
};

export default SkeletonStats;
