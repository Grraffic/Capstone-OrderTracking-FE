import React from "react";
import { Check } from "lucide-react";

/**
 * SizeSelector Component
 *
 * Displays size selection buttons with measurements
 * Handles size selection and confirmation
 * Shows availability status for each size
 * When disabled (e.g. student already ordered max), sizes are shown for reference but not selectable
 */
const SizeSelector = ({
  availableSizes,
  availableSizesData = [],
  selectedSize,
  onSizeSelect,
  sizeConfirmed,
  onSizeConfirm,
  loadingSizes = false,
  disabled = false,
  disabledReason,
  isPreOrder = false,
}) => {
  // Size measurement guide (extensible: add more sizes as needed; display uses whatever API returns)
  const sizeMeasurements = {
    XS: { chest: "32-34", length: "24-26" },
    S: { chest: "34-36", length: "26-28" },
    M: { chest: "38-40", length: "28-30" },
    L: { chest: "42-44", length: "30-32" },
    XL: { chest: "46-48", length: "32-34" },
    XXL: { chest: "50-52", length: "34-36" },
    "3XL": { chest: "54-56", length: "36-38" },
  };

  // Map size abbreviations to full names (matching ItemDetailsModal format)
  const sizeNameMapping = {
    XS: "XSmall",
    S: "Small",
    M: "Medium",
    L: "Large",
    XL: "XLarge",
    XXL: "2XLarge",
    "3XL": "3XLarge",
  };

  // Format size display: Show only abbreviation (XS, S, M, L)
  // System still uses full names internally (XSmall, Small, Medium, Large)
  const formatSizeDisplay = (sizeInput) => {
    // If input is abbreviation (XS, S, M, L), return it as is
    if (sizeNameMapping[sizeInput]) {
       return sizeInput;
    }
    
    // If input is full name (Small, Medium, XSmall), find and return abbreviation
    const reverseMapping = Object.entries(sizeNameMapping).find(([key, val]) => val.toLowerCase() === sizeInput.toLowerCase());
    if (reverseMapping) {
       return reverseMapping[0];
    }
    
    // Fallback if no mapping found (e.g. for numbered sizes or unknown text)
    return sizeInput;
  };

  if (!availableSizes || availableSizes.length === 0) {
    return null;
  }

  // Don't show size selector for items that don't need sizes
  if (availableSizes.length === 1 && availableSizes[0] === "N/A") {
    return null;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {disabled && disabledReason !== null && (disabledReason || "This item is no longer available to order.") && (
        <p className="text-sm text-amber-700 font-medium">
          {disabledReason || "This item is no longer available to order."}
        </p>
      )}
      <div className={disabled ? "opacity-60 pointer-events-none select-none" : ""}>
        {/* Size Choices Label */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#F28C28] mb-2 sm:mb-3">
            Size Choices:
          </h3>

          {/* Size Buttons - Always show so layout never flickers; dim slightly when loading */}
          <div className={`flex flex-wrap gap-2 ${loadingSizes ? "opacity-80 pointer-events-none" : ""}`}>
            {availableSizes.map((size) => {
              const isSelected = selectedSize === size;
              const sizeData = availableSizesData.find((s) => s.size === size);
              // If no data exists for this size, it means stock = 0 (not in inventory)
              const isInStock = sizeData ? sizeData.stock > 0 : false;

              return (
                <div key={size} className="relative">
                  <button
                    onClick={() => onSizeSelect(size)}
                    className={`relative px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg transition-all duration-200 bg-white border-2 overflow-hidden ${
                      isSelected
                        ? "border-gray-300" // Selected state border
                        : "border-gray-300 hover:border-[#F28C28]" // Default/Hover state
                    } ${
                      !isInStock ? "opacity-75" : ""
                    }`}
                  >
                    <p className="text-[10px] sm:text-xs font-medium text-[#e68b00]">
                      {formatSizeDisplay(size)}
                    </p>
                    
                    {/* Orange/Yellow left border for selected size (vertical) */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#CB7B00]"></div>
                    )}
                  </button>
                  {/* Stock status badge - strictly only show for out of stock/pre-order */}
                 
                </div>
              );
            })}
        </div>
      </div>

      {/* Size Measurements */}
      {selectedSize && sizeMeasurements[selectedSize] && (
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
          <h4 className="text-xs sm:text-sm font-semibold text-[#003363] mb-2">
            Size {selectedSize} Measurements:
          </h4>
          <div className="text-xs sm:text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-medium">Chest:</span>{" "}
              {sizeMeasurements[selectedSize].chest} in (
              {(
                parseFloat(sizeMeasurements[selectedSize].chest.split("-")[0]) *
                2.54
              ).toFixed(1)}
              -
              {(
                parseFloat(sizeMeasurements[selectedSize].chest.split("-")[1]) *
                2.54
              ).toFixed(1)}{" "}
              cm)
            </p>
            <p>
              <span className="font-medium">Shirt Length:</span>{" "}
              {sizeMeasurements[selectedSize].length} in (
              {(
                parseFloat(
                  sizeMeasurements[selectedSize].length.split("-")[0]
                ) * 2.54
              ).toFixed(1)}
              -
              {(
                parseFloat(
                  sizeMeasurements[selectedSize].length.split("-")[1]
                ) * 2.54
              ).toFixed(1)}{" "}
              cm)
            </p>
          </div>
        </div>
      )}

      {/* Size Confirmation Checkbox */}
      {selectedSize && !sizeConfirmed && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <input
            type="checkbox"
            id="size-confirm"
            className="mt-1 w-4 h-4 text-[#F28C28] border-gray-300 rounded focus:ring-[#F28C28]"
            onChange={(e) => {
              if (e.target.checked && onSizeConfirm) {
                onSizeConfirm();
              }
            }}
          />
          <label
            htmlFor="size-confirm"
            className="text-sm text-gray-700 cursor-pointer"
          >
            I confirm that the size is correct
          </label>
        </div>
      )}

      {/* Size Confirmed Message - same text; background color shows pre-order (red) vs order (green) */}
      {selectedSize && sizeConfirmed && !disabled && (
        <div
          className={
            isPreOrder
              ? "flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200"
              : "flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
          }
        >
          <Check
            className={
              isPreOrder ? "w-5 h-5 text-red-600" : "w-5 h-5 text-green-600"
            }
          />
          <span
            className={
              isPreOrder
                ? "text-sm text-red-700 font-medium"
                : "text-sm text-green-700 font-medium"
            }
          >
            Size {selectedSize} confirmed! You can now proceed with your order.
          </span>
        </div>
      )}
      </div>
    </div>
  );
};

export default SizeSelector;
