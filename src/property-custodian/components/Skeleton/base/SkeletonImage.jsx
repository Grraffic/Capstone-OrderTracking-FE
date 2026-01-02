import React from "react";

/**
 * SkeletonImage Component
 *
 * An image placeholder skeleton with various shape options.
 *
 * Props:
 * - width: Width class (default: "w-full")
 * - height: Height class (default: "h-40")
 * - variant: Shape variant - "rectangle", "circle", "square" (default: "rectangle")
 * - rounded: Border radius for rectangle variant (default: "rounded-lg")
 * - className: Additional custom classes
 */
const SkeletonImage = ({
  width = "w-full",
  height = "h-40",
  variant = "rectangle",
  rounded = "rounded-lg",
  className = "",
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "circle":
        return "rounded-full aspect-square";
      case "square":
        return `${rounded} aspect-square`;
      case "rectangle":
      default:
        return rounded;
    }
  };

  return (
    <div
      className={`${width} ${
        variant === "circle" || variant === "square" ? "" : height
      } ${getVariantClasses()} bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
    >
      {/* Optional: Add an icon placeholder */}
      <svg
        className="w-8 h-8 text-gray-300"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
};

export default SkeletonImage;
