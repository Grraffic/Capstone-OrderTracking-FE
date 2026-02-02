import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * InventoryDetailTable Component
 *
 * Displays inventory data in a table format with columns:
 * - Item Name
 * - Variant
 * - Beginning Inventory
 * - Purchase
 * - Releases
 * - Returns
 * - Ending Inventory
 * - Unit
 *
 * Props:
 * - data: array - Inventory data grouped by item name with variants
 * - loading: boolean - Loading state
 * - educationLevel: string - Current filter value for display
 * - showFooter: boolean - Whether to show footer (default: true)
 * - onVariantChange: function - Callback when variant is changed
 */
const InventoryDetailTable = ({ data, loading, educationLevel, showFooter = true, onVariantChange }) => {
  // Track selected variant for each item (itemName_educationLevel -> selectedVariant)
  const [selectedVariants, setSelectedVariants] = useState({});

  // Get all available variants for an item
  const getAvailableVariants = (item) => {
    // Use availableSizes from API if present - this should include ALL sizes
    if (item.availableSizes && Array.isArray(item.availableSizes) && item.availableSizes.length > 0) {
      const sizes = item.availableSizes
        .map((s) => s && s.size ? s.size : s)
        .filter((s) => s && s !== "N/A" && s !== "")
        .sort();
      
      // Return all sizes from API (should include XSmall, Small, Medium, Large, etc.)
      if (sizes.length > 0) {
        return sizes;
      }
    }
    // Fallback to current variants if API data not available
    if (item.variants && Array.isArray(item.variants)) {
      const variants = item.variants
        .map((v) => v.variant)
        .filter((v) => v && v !== "N/A");
      return [...new Set(variants)].sort();
    }
    return [];
  };

  // Get the selected variant for an item, default to first available size
  const getSelectedVariant = (item) => {
    const key = `${item.itemName}_${item.educationLevel}`;
    const selected = selectedVariants[key];
    
    // Get all available sizes (from API or fallback to variants)
    const availableSizes = getAvailableVariants(item);
    
    if (selected && availableSizes.includes(selected)) {
      return selected;
    }
    // Default to first available size
    return availableSizes[0] || item.variants?.[0]?.variant || "N/A";
  };

  // Get the variant data for the selected size
  // Returns empty data if the size doesn't have inventory data yet
  const getSelectedVariantData = (item) => {
    const selectedSize = getSelectedVariant(item);
    // Try to find variant data for the selected size
    const variantData = item.variants.find((v) => v.variant === selectedSize);
    
    // If variant data exists, return it; otherwise return empty data structure
    if (variantData) {
      return variantData;
    }
    
    // Return empty data structure for sizes without inventory data
    return {
      id: null,
      variant: selectedSize,
      beginningInventory: 0,
      purchase: 0,
      releases: 0,
      returns: 0,
      endingInventory: 0,
      unit: 0,
    };
  };

  const handleVariantChange = (item, newVariant) => {
    const key = `${item.itemName}_${item.educationLevel}`;
    setSelectedVariants((prev) => ({
      ...prev,
      [key]: newVariant,
    }));
  };
  // Calculate total items count (one row per item now)
  const totalItems = data.length;

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-2.5 sm:p-3 md:p-4">
          <div className="animate-pulse space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 sm:h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 md:p-8 text-center">
        <p className="text-gray-500 text-xs sm:text-sm">
          No inventory items found for {educationLevel === "all" ? "All Education Levels" : educationLevel}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[rgba(46,143,234,0.83)]">
            <tr>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Item Name
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Variant
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Beginning Inventory
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Purchase
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Releases
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Returns
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Ending Inventory
              </th>
              <th className="px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 text-left text-xs sm:text-sm font-semibold text-white">
                Unit Price
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, itemIndex) => {
              const selectedVariantData = getSelectedVariantData(item);
              const selectedSize = getSelectedVariant(item);
              
              return (
                <tr
                  key={`${item.itemName}-${item.educationLevel}`}
                  className={`${
                    itemIndex % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                  } hover:bg-gray-50 transition-colors`}
                >
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-[#003363] font-medium border-b border-gray-100">
                    {item.itemName}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-[#003363] border-b border-gray-100">
                    <div className="relative">
                      <select
                        value={selectedSize}
                        onChange={(e) => handleVariantChange(item, e.target.value)}
                        className="w-full px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-md border border-[#E68B00] bg-white focus:outline-none focus:ring-2 focus:ring-[#E68B00] appearance-none pr-6 sm:pr-8 cursor-pointer text-[#003363]"
                      >
                        {getAvailableVariants(item).map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 pointer-events-none w-3 h-3 sm:w-4 sm:h-4 text-[#E68B00]"
                        size={12}
                      />
                    </div>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-semibold text-[#003363] border-b border-gray-100">
                    {selectedVariantData.beginningInventory || 0}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-[#003363] border-b border-gray-100">
                    {selectedVariantData.purchase || 0}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-semibold text-[#003363] border-b border-gray-100">
                    {selectedVariantData.releases || 0}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-[#003363] border-b border-gray-100">
                    {selectedVariantData.returns || 0}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm font-semibold text-[#003363] border-b border-gray-100">
                    {selectedVariantData.endingInventory || 0}
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm text-[#003363] border-b border-gray-100">
                    P{Number(selectedVariantData.unit || 0).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="md:hidden">
        {data.map((item, itemIndex) => {
          const selectedVariantData = getSelectedVariantData(item);
          const selectedSize = getSelectedVariant(item);
          
          return (
            <div
              key={`${item.itemName}-${item.educationLevel}`}
              className={`p-2.5 sm:p-3 md:p-4 border-b border-gray-200 ${
                itemIndex % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <h3 className="text-xs sm:text-sm font-semibold text-[#003363] flex-1 min-w-0 truncate">
                  {item.itemName}
                </h3>
                <div className="relative flex-shrink-0">
                  <select
                    value={selectedSize}
                    onChange={(e) => handleVariantChange(item, e.target.value)}
                    className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs font-semibold rounded-md border border-[#E68B00] bg-white focus:outline-none focus:ring-2 focus:ring-[#E68B00] appearance-none pr-6 sm:pr-8 cursor-pointer min-w-[60px] sm:min-w-[80px]"
                  >
                    {getAvailableVariants(item).map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 pointer-events-none w-3 h-3 sm:w-4 sm:h-4 text-[#E68B00]"
                    size={12}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                <div>
                  <span className="text-gray-600">Beginning Inventory:</span>
                  <span className="ml-1 sm:ml-2 font-semibold text-[#003363]">
                    {selectedVariantData.beginningInventory || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Purchase:</span>
                  <span className="ml-1 sm:ml-2 text-[#003363]">{selectedVariantData.purchase || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Releases:</span>
                  <span className="ml-1 sm:ml-2 font-semibold text-[#003363]">
                    {selectedVariantData.releases || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Returns:</span>
                  <span className="ml-1 sm:ml-2 text-[#003363]">{selectedVariantData.returns || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ending Inventory:</span>
                  <span className="ml-1 sm:ml-2 font-semibold text-[#003363]">
                    {selectedVariantData.endingInventory || 0}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Unit:</span>
                  <span className="ml-1 sm:ml-2 text-[#003363]">P{Number(selectedVariantData.unit || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer with total count - only show if showFooter is true */}
      {showFooter && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Total Items - {educationLevel}: {totalItems} Items
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryDetailTable;
