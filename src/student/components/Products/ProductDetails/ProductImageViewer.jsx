import React from "react";

/**
 * ProductImageViewer Component
 *
 * Displays the main product image
 * Handles image loading errors with fallback
 * Shows selected size on the image
 */
const ProductImageViewer = ({ product, selectedSize, isDisabled = false }) => {
  const handleImageError = (e) => {
    e.target.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  // Map size abbreviations to full names for display
  const sizeNameMapping = {
    XS: "XSmall",
    S: "Small",
    M: "Medium",
    L: "Large",
    XL: "XLarge",
    XXL: "2XLarge",
    "3XL": "3XLarge",
  };

  // Map size abbreviations to full display names (for image label)
  const sizeDisplayNames = {
    XS: "Extra Small",
    S: "Small",
    M: "Medium",
    L: "Large",
    XL: "Extra Large",
    XXL: "2X Large",
    "3XL": "3X Large",
  };

  // Get full display name for size label on image
  const getFullSizeDisplay = (size) => {
    // If input is abbreviation (XS, S, M, L), return full display name
    if (sizeDisplayNames[size]) {
      return sizeDisplayNames[size];
    }
    // If input is database format (XSmall, Small), find abbreviation first then get display name
    const entry = Object.entries(sizeNameMapping).find(
      ([, val]) => val.toLowerCase() === size.toLowerCase()
    );
    if (entry && sizeDisplayNames[entry[0]]) {
      return sizeDisplayNames[entry[0]];
    }
    // Fallback
    return size;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden h-full">
      {/* Product Image Container - same disabled styling as ProductCard; no transition when disabled to avoid blink */}
      <div
        className={`relative flex items-center justify-center p-1 sm:p-2 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] h-full ${
          isDisabled ? "bg-gray-200" : "transition-all duration-300"
        }`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={`relative z-10 w-full h-full max-h-[300px] sm:max-h-[400px] md:max-h-[500px] lg:max-h-[600px] xl:max-h-[750px] max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[750px] object-contain drop-shadow-2xl scale-100 sm:scale-110 md:scale-115 lg:scale-125 ${
            isDisabled ? "grayscale opacity-70" : "transition-all duration-300"
          }`}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />

        {/* Pre-Order Badge - Top Right */}
        {product.status === "pre_order" && (
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
            <span className="inline-block px-2 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-[#F28C28] text-white shadow-lg">
              Pre-Order
            </span>
          </div>
        )}

        {/* Selected Size Label - Bottom Left Corner (close to edge) */}
        {selectedSize && (
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 md:bottom-4 md:left-4 z-10 pointer-events-none">
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#fefefe] drop-shadow-lg whitespace-nowrap">
              {getFullSizeDisplay(selectedSize)}
            </p>
          </div>
        )}

        {/* Image View Selector - Left Side
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          <button className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-[#F28C28] flex items-center justify-center hover:bg-white transition-colors shadow-md">
            <span className="text-xs font-semibold text-[#003363]">Front</span>
          </button>
          <button className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-white transition-colors shadow-md">
            <span className="text-xs font-semibold text-gray-600">Back</span>
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default ProductImageViewer;
