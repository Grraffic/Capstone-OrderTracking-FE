import React from "react";

/**
 * SkeletonCard Component
 *
 * A generic card skeleton with pulsing animation effect.
 * Used as a building block for various card-based layouts.
 *
 * Props:
 * - height: Height of the card (default: "h-32")
 * - width: Width of the card (default: "w-full")
 * - rounded: Border radius class (default: "rounded-lg")
 * - className: Additional custom classes
 */
const SkeletonCard = ({
  height = "h-32",
  width = "w-full",
  rounded = "rounded-lg",
  className = "",
}) => {
  return (
    <div
      className={`${width} ${height} ${rounded} bg-gray-200 animate-pulse ${className}`}
    />
  );
};

export default SkeletonCard;
