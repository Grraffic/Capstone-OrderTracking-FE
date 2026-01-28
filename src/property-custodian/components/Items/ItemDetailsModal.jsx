import { X, Info, MoreHorizontal, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * ItemDetailsModal Component
 *
 * A redesigned modal for viewing item details with:
 * - Clean white background with soft drop shadow
 * - Item name at top-left with "Uniform" accent label
 * - Red circular close button at top-right
 * - Left section: main image, stock info with tooltip, item attributes, cost summary
 * - Right section: total cost summary, variations list with stacked cards
 * - Selected variation highlighted with orange background/border
 * - Scrollable content if exceeds viewport
 *
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - selectedItem: The item to display
 * - variations: Array of item variations (different sizes)
 * - selectedVariation: Currently selected variation
 * - loadingVariations: Boolean for loading state
 * - totalCostSummary: Total cost across all variations
 * - totalStock: Total stock across all variations
 * - onClose: Function to close modal
 * - onSelectVariation: Function to select a variation
 * - onEditItem: Function to edit the whole item (all variants) — opens full item edit form
 * - onEdit: Function to edit a single variant — opens variant edit modal
 * - onDelete: Function to delete an item
 */
const ItemDetailsModal = ({
  isOpen,
  selectedItem,
  variations = [],
  selectedVariation,
  loadingVariations,
  totalCostSummary = 0,
  // eslint-disable-next-line no-unused-vars
  totalStock = 0, // Available but not currently used in UI
  onClose,
  onSelectVariation,
  onEditItem,
  onEdit,
  onDelete,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const buttonRefs = useRef({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Calculate menu position to ensure it's always visible
  const handleMenuClick = (e, variationKey) => {
    e.stopPropagation();
    
    const buttonElement = e.currentTarget;
    const rect = buttonElement.getBoundingClientRect();
    const scrollContainer = buttonElement.closest('.max-h-\\[400px\\]');
    const containerRect = scrollContainer?.getBoundingClientRect();
    
    // Calculate position - prefer above if near bottom
    const spaceBelow = containerRect 
      ? containerRect.bottom - rect.bottom 
      : window.innerHeight - rect.bottom;
    const spaceAbove = containerRect 
      ? rect.top - containerRect.top 
      : rect.top;
    
    // Position menu above button if there's more space above, or if near bottom
    const shouldPositionAbove = spaceBelow < 100 || (spaceAbove > spaceBelow && spaceAbove > 80);
    
    setMenuPosition({
      top: shouldPositionAbove ? rect.top - 80 : rect.bottom + 4,
      left: rect.right - 128, // Align to right edge of button, menu width is ~128px
    });
    
    setOpenMenuId(openMenuId === variationKey ? null : variationKey);
  };

  if (!isOpen || !selectedItem) return null;

  const displayItem = selectedVariation || selectedItem;
  const stockValue = displayItem.stock || 0;
  const stockStatusColor =
    stockValue === 0
      ? "text-red-600"
      : stockValue < 20
      ? "text-orange-600"
      : "text-green-600";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0C2340]">
              {selectedItem.name}
            </h2>
            <span className="text-sm font-medium text-[#e68b00]">
              {selectedItem.itemType || "Uniform"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditItem?.(selectedItem)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E68B00] text-white text-sm font-medium hover:bg-[#d67a00] transition-colors"
              aria-label="Edit all variants"
            >
              <Pencil size={16} />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Section */}
            <div className="space-y-4">
              {/* Unified Card: Image + Item Attributes */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Main Product Image with Stock Info Overlay */}
                <div className="relative bg-[#f8f9fa]">
                  <img
                    src={displayItem.image}
                    alt={displayItem.name}
                    className="w-full h-64 object-contain"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />

                  {/* Stock Information - Left Side */}
                  <div className="absolute top-3 left-3">
                    <div className="flex items-baseline gap-1 px-3 py-1.5 ">
                      <span className="text-sm font-medium text-gray-700">
                        Stock:
                      </span>
                      <span className={`text-sm font-bold ${stockStatusColor}`}>
                        {stockValue}
                      </span>
                    </div>
                  </div>

                  {/* Size Guide Tooltip - Right Side */}
                  <div className="absolute top-3 right-3">
                    <div className="relative">
                      <button
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="p-1.5  hover:bg-gray-50 transition-colors"
                        aria-label="Size information"
                      >
                        <Info size={14} className="text-gray-400" />
                      </button>
                      {showTooltip && (
                        <div className="absolute right-0 top-full mt-2 bg-[#0C2340] text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                          <p className="font-medium mb-1">Size Guide:</p>
                          <p>S: 32-34" | M: 36-38"</p>
                          <p>L: 40-42" | XL: 44-46"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Item Attributes - Inside Card */}
                <div className="space-y-3 p-4">
                  <div className="flex">
                    <span className="text-sm font-medium text-[#e68b00] w-40">
                      Item Name:
                    </span>
                    <span className="text-sm font-semibold text-[#0C2340]">
                      {displayItem.name}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-[#e68b00] w-40">
                      Item Type:
                    </span>
                    <span className="text-sm text-[#0C2340]">
                      {displayItem.itemType || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-[#e68b00] w-40">
                      Item Size:
                    </span>
                    <span className="text-sm text-[#0C2340]">
                      {displayItem.size || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-[#e68b00] w-40">
                      Grade Level Category:
                    </span>
                    <span className="text-sm text-[#0C2340]">
                      {displayItem.category || "N/A"}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-sm font-medium text-[#e68b00] w-40">
                      Education Level:
                    </span>
                    <span className="text-sm text-[#0C2340]">
                      {(() => {
                        const raw = displayItem.educationLevel || displayItem.education_level || "";
                        const toDisplay = {
                          Kindergarten: "Preschool",
                          "Junior High School": "Junior Highschool",
                          "Senior High School": "Senior Highschool",
                        };
                        return toDisplay[raw] || raw || "N/A";
                      })()}
                    </span>
                  </div>
                  <div className="flex pt-3 mt-2 border-t border-gray-100">
                    <span className="text-sm font-medium text-[#e68b00] w-40">
                      Cost Summary:
                    </span>
                    <span className="text-sm font-bold text-[#003363]">
                      ₱
                      {(
                        (Number(displayItem.stock) || 0) *
                        (Number(displayItem.price) || 0)
                      ).toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Variations */}
            <div className="space-y-5">
              {/* Total Cost Summary */}
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-[#0C2340]">
                  Total Cost Summary:
                </span>
                <span className="text-xl font-bold text-[#003363]">
                  ₱
                  {totalCostSummary.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Variations List */}
              <div>
                {loadingVariations ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-[#e68b00] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm">Loading variations...</p>
                  </div>
                ) : variations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No variations found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {variations.map((variation, index) => {
                      // Use _variationKey for virtual variations, fallback to id
                      // For duplicate items (same name+size), use id + created_at to ensure uniqueness
                      const variationKey =
                        variation._variationKey ||
                        `${variation.id}-${variation.created_at || index}` ||
                        variation.id;
                      const selectedKey =
                        selectedVariation?._variationKey ||
                        `${selectedVariation?.id}-${selectedVariation?.created_at}` ||
                        selectedVariation?.id;
                      const isSelected = selectedKey === variationKey;


                      return (
                        <div
                          key={variationKey}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "bg-orange-50 border-[#e68b00] shadow-sm"
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Thumbnail - Clickable to select variation */}
                          <div 
                            onClick={() => onSelectVariation(variation)}
                            className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
                          >
                            <img
                              src={variation.image}
                              alt={variation.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/56?text=No+Img";
                              }}
                            />
                          </div>

                          {/* Variation Info - Clickable to select variation */}
                          <div 
                            onClick={() => onSelectVariation(variation)}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <p className="text-sm font-semibold text-[#0C2340] truncate">
                              {variation.name}
                            </p>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-xs font-medium text-[#e68b00]">
                                {variation.size || "Standard"}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-gray-600">
                                  Beginning Inventory: {variation.beginning_inventory || 0}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-600">
                                  Purchases: {variation.purchases || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stock Info - Clickable to select variation */}
                          <div 
                            onClick={() => onSelectVariation(variation)}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span className="text-sm text-gray-600">
                              Stock:
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                variation.stock === 0
                                  ? "text-red-600"
                                  : variation.stock < 20
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {variation.stock || 0}
                            </span>
                          </div>

                          {/* Actions Menu Button */}
                          <div className="relative flex-shrink-0">
                            <button
                              ref={(el) => {
                                if (el) buttonRefs.current[variationKey] = el;
                              }}
                              onClick={(e) => handleMenuClick(e, variationKey)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              aria-label="More actions"
                            >
                              <MoreHorizontal
                                size={18}
                                className="text-gray-500"
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Portal - Rendered outside scroll container to avoid clipping */}
      {openMenuId && createPortal(
        <div
          ref={menuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-[100] w-32 overflow-hidden"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              const variation = variations.find(
                (v) => {
                  const key = v._variationKey ||
                    `${v.id}-${v.created_at}` ||
                    v.id;
                  return key === openMenuId;
                }
              );
              onEdit?.(variation);
              setOpenMenuId(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span>Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const variation = variations.find(
                (v) => {
                  const key = v._variationKey ||
                    `${v.id}-${v.created_at}` ||
                    v.id;
                  return key === openMenuId;
                }
              );
              onDelete?.(variation);
              setOpenMenuId(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ItemDetailsModal;
