import { X, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
 * - unreleasedCounts: { [itemName|size]: number } — unreleased order quantities per item+size (for Available = stock - unreleased)
 * - onClose: Function to close modal
 * - onSelectVariation: Function to select a variation
 * - onEditItem: Function to edit the whole item (all variants) — opens full item edit form
 * - onEdit: Function to edit a single variant — opens variant edit modal
 * - onArchive: Function to archive an item (replaces onDelete)
 */
const normalizeSizeForKey = (size) => {
  if (!size) return "";
  const match = String(size).match(/^(.+?)\s*\([A-Z]\)$/i);
  return (match ? match[1].trim() : String(size).trim()).toLowerCase();
};

const ItemDetailsModal = ({
  isOpen,
  selectedItem,
  variations = [],
  selectedVariation,
  loadingVariations,
  totalCostSummary = 0,
  // eslint-disable-next-line no-unused-vars
  totalStock = 0, // Available but not currently used in UI
  unreleasedCounts = {},
  onClose,
  onSelectVariation,
  onEditItem,
  onEdit,
  onArchive,
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
    const scrollContainer = buttonElement.closest('[data-item-details-variations]');
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
  const getUnreleased = (name, size) =>
    unreleasedCounts[`${(name || "").trim().toLowerCase()}|${normalizeSizeForKey(size)}`] || 0;
  const getAvailable = (stock, name, size) =>
    Math.max(0, (Number(stock) || 0) - getUnreleased(name, size));
  const stockValue = displayItem.stock || 0;
  const availableValue = getAvailable(
    stockValue,
    displayItem.name || selectedItem.name,
    displayItem.size
  );
  const stockStatusColor =
    availableValue === 0
      ? "text-red-600"
      : availableValue < 20
      ? "text-orange-600"
      : "text-green-600";

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-3 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl mobile-l:rounded-2xl shadow-2xl w-full max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3rem)] md:max-w-[600px] lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[82vh] overflow-hidden flex flex-col relative z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - scales with breakpoint: 375 / 425 / 768 / 1024 - tighter at Mobile L and Tablet */}
        <div className="px-2.5 py-2.5 mobile-m:px-3 mobile-m:py-3 mobile-l:px-3 mobile-l:py-2.5 tablet:px-4 tablet:py-3 laptop:px-6 laptop:py-4 border-b border-gray-100 flex items-start justify-between gap-1.5 mobile-l:gap-2 tablet:gap-3 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-[#0C2340] truncate leading-tight mobile-m:text-base mobile-l:text-base tablet:text-lg laptop:text-2xl">
              {selectedItem.name}
            </h2>
            <span className="text-[10px] font-medium text-[#e68b00] mobile-m:text-xs tablet:text-sm">
              {selectedItem.itemType || "Uniform"}
            </span>
          </div>
          <div className="flex items-center gap-1 mobile-l:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => onEditItem?.(selectedItem)}
              className="flex items-center gap-1 mobile-l:gap-2 px-1.5 py-1 mobile-l:px-2.5 mobile-l:py-1.5 tablet:px-3 tablet:py-2 rounded-lg bg-[#E68B00] text-white text-xs mobile-l:text-sm font-medium hover:bg-[#d67a00] transition-colors"
              aria-label="Edit all variants"
            >
              <Pencil size={14} className="tablet:w-4 tablet:h-4" />
              <span className="hidden tablet:inline">Edit</span>
            </button>
            <button
              onClick={onClose}
              className="w-6 h-6 mobile-l:w-7 mobile-l:h-7 tablet:w-8 tablet:h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <X size={14} className="text-white tablet:w-[18px] tablet:h-[18px]" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 laptop:grid-cols-2 gap-3 p-2.5 mobile-m:gap-3.5 mobile-m:p-3 mobile-l:gap-3 mobile-l:p-3 tablet:gap-4 tablet:p-4 laptop:gap-6 laptop:p-6">
            {/* Left Section - scales: 375 / 425 / 768 / 1024 */}
            <div className="space-y-2 mobile-l:space-y-2 tablet:space-y-3 laptop:space-y-4">
              {/* Unified Card: Image + Item Attributes */}
              <div className="bg-white border border-gray-200 rounded-lg mobile-l:rounded-xl shadow-sm overflow-hidden">
                {/* Main Product Image with Stock Info Overlay */}
                <div className="relative bg-[#f8f9fa]">
                  <img
                    src={displayItem.image}
                    alt={displayItem.name}
                    className="w-full h-28 mobile-m:h-32 mobile-l:h-30 tablet:h-40 laptop:h-64 object-contain"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=No+Image";
                    }}
                  />

                  {/* Available (Stock - Unreleased) - Left Side */}
                  <div className="absolute top-1.5 left-1.5 mobile-m:top-2 mobile-m:left-2 mobile-l:top-2 mobile-l:left-2 tablet:top-3 tablet:left-3">
                    <div className="flex items-baseline gap-0.5 mobile-l:gap-1 px-1.5 py-0.5 mobile-m:px-2 mobile-m:py-1 mobile-l:px-2 mobile-l:py-0.5 tablet:px-3 tablet:py-1.5">
                      <span className="text-[10px] font-medium text-gray-700 mobile-m:text-xs tablet:text-sm">
                        Available:
                      </span>
                      <span className={`text-[10px] font-bold mobile-m:text-xs tablet:text-sm ${stockStatusColor}`}>
                        {availableValue}
                      </span>
                    </div>
                  </div>

                  {/* Size Guide Tooltip - Right Side */}
                  <div className="absolute top-1.5 right-1.5 mobile-m:top-2 mobile-m:right-2 mobile-l:top-2 mobile-l:right-2 tablet:top-3 tablet:right-3">
                    <div className="relative">
                      <button
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="p-1 mobile-l:p-1.5 hover:bg-gray-50 transition-colors rounded"
                        aria-label="Size information"
                      >
                        <Info size={14} className="text-gray-400" />
                      </button>
                      {showTooltip && (
                        <div className="absolute right-0 top-full mt-2 bg-[#0C2340] text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-lg">
                          <p className="font-medium mb-1">Size Guide:</p>
                          <p>S: 32-34" | L: 40-42" | XL: 44-46"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Item Attributes - Inside Card - tighter at Mobile L */}
                <div className="space-y-1 mobile-m:space-y-1.5 mobile-l:space-y-1.5 p-2 mobile-m:p-2.5 mobile-l:p-2.5 tablet:space-y-2.5 tablet:p-3 laptop:space-y-3 laptop:p-4">
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 mobile-l:gap-x-1.5">
                    <span className="text-[10px] font-medium text-[#e68b00] shrink-0 min-w-[5.5rem] mobile-m:min-w-[6rem] mobile-l:min-w-[6.5rem] tablet:min-w-[10rem]">
                      Item Name:
                    </span>
                    <span className="text-[10px] font-semibold text-[#0C2340] break-words mobile-m:text-xs tablet:text-sm">
                      {displayItem.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 mobile-l:gap-x-1.5">
                    <span className="text-[10px] font-medium text-[#e68b00] shrink-0 min-w-[5.5rem] mobile-m:min-w-[6rem] mobile-l:min-w-[6.5rem] tablet:min-w-[10rem]">
                      Item Type:
                    </span>
                    <span className="text-[10px] text-[#0C2340] mobile-m:text-xs tablet:text-sm">
                      {displayItem.itemType || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 mobile-l:gap-x-1.5">
                    <span className="text-[10px] font-medium text-[#e68b00] shrink-0 min-w-[5.5rem] mobile-m:min-w-[6rem] mobile-l:min-w-[6.5rem] tablet:min-w-[10rem]">
                      Item Size:
                    </span>
                    <span className="text-[10px] text-[#0C2340] mobile-m:text-xs tablet:text-sm">
                      {displayItem.size || "N/A"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 mobile-l:gap-x-1.5">
                    <span className="text-[10px] font-medium text-[#e68b00] shrink-0 min-w-[5.5rem] mobile-m:min-w-[6rem] mobile-l:min-w-[6.5rem] tablet:min-w-[10rem]">
                      Education Level:
                    </span>
                    <span className="text-[10px] text-[#0C2340] mobile-m:text-xs tablet:text-sm">
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
                  <div className="flex flex-wrap gap-x-1 gap-y-0.5 mobile-l:gap-x-1.5 pt-1.5 mobile-l:pt-1.5 tablet:pt-2 tablet:mt-1.5 laptop:pt-3 laptop:mt-2 border-t border-gray-100">
                    <span className="text-[10px] font-medium text-[#e68b00] shrink-0 min-w-[5.5rem] mobile-m:min-w-[6rem] mobile-l:min-w-[6.5rem] tablet:min-w-[10rem]">
                      Cost Summary:
                    </span>
                    <span className="text-[10px] font-bold text-[#003363] mobile-m:text-xs tablet:text-sm">
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

            {/* Right Section - Variations - tighter at Mobile L */}
            <div className="space-y-2 mobile-l:space-y-2 tablet:space-y-3 laptop:space-y-5">
              {/* Total Cost Summary */}
              <div className="flex flex-wrap items-center gap-1 mobile-l:gap-1 tablet:gap-2">
                <span className="text-[10px] font-medium text-[#0C2340] mobile-m:text-xs tablet:text-base">
                  Total Cost Summary:
                </span>
                <span className="text-xs font-bold text-[#003363] mobile-m:text-sm tablet:text-lg laptop:text-xl">
                  ₱
                  {totalCostSummary.toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              {/* Variations List */}
              <div>
                {loadingVariations ? (
                  <div className="text-center py-4 mobile-l:py-5 tablet:py-6 laptop:py-8 text-gray-500">
                    <div className="animate-spin w-5 h-5 mobile-l:w-6 mobile-l:h-6 border-2 border-[#e68b00] border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-[10px] mobile-m:text-xs mobile-l:text-sm">Loading variations...</p>
                  </div>
                ) : variations.length === 0 ? (
                  <div className="text-center py-4 mobile-l:py-5 tablet:py-6 laptop:py-8 text-gray-500">
                    <p className="text-[10px] mobile-m:text-xs mobile-l:text-sm">No variations found</p>
                  </div>
                ) : (
                  <div data-item-details-variations className="space-y-1.5 mobile-l:space-y-1.5 tablet:space-y-2 tablet:max-h-[260px] laptop:space-y-2.5 laptop:max-h-[400px] max-h-[180px] mobile-m:max-h-[200px] mobile-l:max-h-[200px] overflow-y-auto pr-1 mobile-l:pr-1.5 tablet:pr-2">
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
                          className={`flex items-center gap-1.5 mobile-m:gap-2 mobile-l:gap-2.5 tablet:gap-3 p-1.5 mobile-m:p-2 mobile-l:p-2.5 tablet:p-3 rounded-md mobile-l:rounded-lg tablet:rounded-xl border-2 transition-all ${
                            isSelected
                              ? "bg-orange-50 border-[#e68b00] shadow-sm"
                              : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Thumbnail - Clickable to select variation */}
                          <div 
                            onClick={() => onSelectVariation(variation)}
                            className="w-8 h-8 mobile-m:w-9 mobile-m:h-9 mobile-l:w-10 mobile-l:h-10 tablet:w-12 tablet:h-12 laptop:w-14 laptop:h-14 rounded mobile-l:rounded-md tablet:rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
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
                            <p className="text-[10px] font-semibold text-[#0C2340] truncate mobile-m:text-xs mobile-l:text-sm">
                              {variation.name}
                            </p>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-[9px] font-medium text-[#e68b00] mobile-m:text-[10px] mobile-l:text-xs">
                                {variation.size || "Standard"}
                              </p>
                              <div className="flex items-center gap-0.5 mobile-l:gap-1 tablet:gap-1.5 flex-wrap">
                                <span className="text-[9px] text-gray-600 mobile-m:text-[10px] mobile-l:text-xs">
                                  Beginning: {variation.beginning_inventory || 0}
                                </span>
                                <span className="text-[9px] mobile-l:text-[10px] text-gray-400 hidden mobile-l:inline">•</span>
                                <span className="text-[9px] text-gray-600 mobile-m:text-[10px] mobile-l:text-xs">
                                  Purchases: {variation.purchases || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Available (Stock - Unreleased) - Clickable to select variation */}
                          {(() => {
                            const unreleased = getUnreleased(variation.name || selectedItem.name, variation.size);
                            const available = Math.max(0, (variation.stock || 0) - unreleased);
                            const availColor =
                              available === 0
                                ? "text-red-600"
                                : available < 20
                                ? "text-orange-600"
                                : "text-green-600";
                            return (
                              <div
                                onClick={() => onSelectVariation(variation)}
                                className="flex items-center gap-0.5 cursor-pointer flex-shrink-0"
                              >
                                <span className="text-[10px] text-gray-600 mobile-m:text-xs mobile-l:text-sm">
                                  Available:
                                </span>
                                <span className={`text-[10px] font-bold mobile-m:text-xs mobile-l:text-sm ${availColor}`}>
                                  {available}
                                </span>
                              </div>
                            );
                          })()}

                          {/* Actions Menu Button */}
                          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              ref={(el) => {
                                if (el) buttonRefs.current[variationKey] = el;
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuClick(e, variationKey);
                              }}
                              className="p-0.5 mobile-l:p-1 tablet:p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                              aria-label="More actions"
                              type="button"
                            >
                              <MoreHorizontal
                                size={14}
                                className="text-gray-500 tablet:w-[18px] tablet:h-[18px]"
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
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-[10002] w-32 overflow-hidden"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
          onClick={(e) => e.stopPropagation()}
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
              if (variation && onEdit) {
                onEdit(variation);
              }
              setOpenMenuId(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            type="button"
          >
            Edit
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
              if (variation && onArchive) {
                onArchive(variation);
              }
              setOpenMenuId(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            type="button"
          >
            Archive
          </button>
        </div>,
        document.body
      )}
    </div>,
    document.body
  );
};

export default ItemDetailsModal;
