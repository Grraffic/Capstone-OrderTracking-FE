import React from "react";

/**
 * SkeletonText Component
 *
 * A text placeholder skeleton with customizable width and height.
 * Supports single or multiple lines.
 *
 * Props:
 * - lines: Number of text lines (default: 1)
 * - width: Width of each line - "full", "3/4", "1/2", "1/3", "1/4", or custom class (default: "full")
 * - height: Height variant - "small" (h-3), "medium" (h-4), "large" (h-5), or custom class (default: "medium")
 * - gap: Gap between lines (default: "gap-2")
 * - className: Additional custom classes
 */
const SkeletonText = ({
  lines = 1,
  width = "full",
  height = "medium",
  gap = "gap-2",
  className = "",
}) => {
  // Map width shortcuts to Tailwind classes
  const widthMap = {
    full: "w-full",
    "3/4": "w-3/4",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  };

  // Map height variants to Tailwind classes
  const heightMap = {
    small: "h-3",
    medium: "h-4",
    large: "h-5",
  };

  const widthClass = widthMap[width] || width;
  const heightClass = heightMap[height] || height;

  if (lines === 1) {
    return (
      <div
        className={`${widthClass} ${heightClass} bg-gray-200 rounded animate-pulse ${className}`}
      />
    );
  }

  return (
    <div className={`flex flex-col ${gap} ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${
            index === lines - 1 ? "w-2/3" : widthClass
          } ${heightClass} bg-gray-200 rounded animate-pulse`}
        />
      ))}
    </div>
  );
};

export default SkeletonText;
