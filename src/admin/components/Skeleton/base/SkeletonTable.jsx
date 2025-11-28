import React from "react";

/**
 * SkeletonTable Component
 *
 * A table skeleton with header and configurable number of rows.
 * Matches the existing table styling in the admin section.
 *
 * Props:
 * - rows: Number of table rows to display (default: 5)
 * - columns: Number of columns (default: 6)
 * - showCheckbox: Whether to show checkbox column (default: true)
 * - className: Additional custom classes
 */
const SkeletonTable = ({
  rows = 5,
  columns = 6,
  showCheckbox = true,
  className = "",
}) => {
  const actualColumns = showCheckbox ? columns + 1 : columns;

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {showCheckbox && (
                <th className="px-6 py-4 text-left">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              )}
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-4 text-left">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-gray-100 ${
                  rowIndex === rows - 1 ? "border-b-0" : ""
                }`}
              >
                {showCheckbox && (
                  <td className="px-6 py-4">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                )}
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div
                      className={`h-4 bg-gray-200 rounded animate-pulse ${
                        colIndex === 0 ? "w-20" : "w-full max-w-[150px]"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Page Indicator */}
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SkeletonTable;
