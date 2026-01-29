import React from "react";
import { ArrowLeft } from "lucide-react";

/**
 * ProductInfo Component
 *
 * Displays product information in simplified format
 * Matching reference design
 */
const ProductInfo = ({ product, onClose }) => {
  const isOutOfStock = product.status === "out_of_stock";

  // Parse product name to separate main name and "for Girls/Boys" part
  const parseProductName = (name) => {
    if (!name) return { mainName: "", suffix: "" };

    // Check for "for Girls" or "for Boys" pattern
    const forGirlsMatch = name.match(/^(.+?)\s+(for\s+Girls)$/i);
    const forBoysMatch = name.match(/^(.+?)\s+(for\s+Boys)$/i);

    if (forGirlsMatch) {
      return { mainName: forGirlsMatch[1], suffix: forGirlsMatch[2] };
    } else if (forBoysMatch) {
      return { mainName: forBoysMatch[1], suffix: forBoysMatch[2] };
    }

    return { mainName: name, suffix: "" };
  };

  const { mainName, suffix } = parseProductName(product.name);

  const price = product.price != null ? Number(product.price) : null;
  const formattedPrice =
    price != null && !Number.isNaN(price)
      ? `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : null;

  return (
    <div className="space-y-3 sm:space-y-4 relative">
      {/* Price (crossed out) + FREE Badge - Top Right (Absolute Positioned) */}
      <div className="absolute top-6 right-0 flex flex-col items-end gap-0.5">
        {formattedPrice && (
          <span className="line-through text-gray-500 text-xs sm:text-sm font-medium">
            {formattedPrice}
          </span>
        )}
        <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-white border border-[#003363] text-[#003363] rounded-full text-xs sm:text-sm font-bold shadow-sm">
          FREE
        </span>
      </div>

      {/* Top Row: Back Button (left) */}
      <div className="flex items-start">
        <div className="flex flex-col gap-2 sm:gap-3">
          {/* Back Button - Top Left */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 border border-[#003363] text-[#003363] hover:bg-[#003363] hover:text-white transition-all duration-200 rounded-full flex items-center justify-center w-fit"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Education Level - Below Back Button, Left Aligned */}
          <p className="text-[#003363] text-sm sm:text-base font-semibold">
            {product.educationLevel || "All Education Levels"}
          </p>

          {/* Product Name - Below Education Level */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F28C28] leading-tight">
              {mainName}
            </h1>
            {suffix && (
              <p className="text-xl sm:text-2xl font-bold text-[#F28C28] leading-tight">
                {suffix}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Description/Note - Rich text content from admin form */}
      {(product.description_text || product.descriptionText) && (
        <div className="space-y-2 mt-3">
          <div
            className="text-gray-700 text-sm leading-relaxed rich-text-content"
            dangerouslySetInnerHTML={{
              __html: product.description_text || product.descriptionText,
            }}
          />
        </div>
      )}

      {/* Complete Set Badge */}
      {(product.isCompleteSet || product.itemType === "Complete Set") && (
        <div className="flex items-center gap-2">
          <span className="text-[#003363] font-semibold text-lg">
            ✓ Complete Set
          </span>
        </div>
      )}

      {/* Education Level Restriction
      {product.educationLevel && product.educationLevel !== "All" && (
        <p className="text-[#003363] text-sm italic">
          This uniform is for{" "}
          <span className="font-bold text-[#F28C28]">
            {product.educationLevel}
          </span>{" "}
          students only.
        </p>
      )} */}

      {/* Description */}
      {product.description && (
        <div className="space-y-2">
          <p className="text-gray-700 text-sm leading-relaxed">
            {product.description}
          </p>
        </div>
      )}

      {/* Out of Stock Warning */}
      {isOutOfStock && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
          <p className="text-red-700 text-sm font-semibold">
            ⚠️ This item is currently out of stock
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
