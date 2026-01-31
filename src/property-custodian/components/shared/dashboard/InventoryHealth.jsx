import { useState } from "react";
import { ShoppingCart, AlertCircle, XCircle } from "lucide-react";
import InventoryDetailSection from "./InventoryDetailSection";
import AtReorderPointSection from "./AtReorderPointSection";
import OutOfStockSection from "./OutOfStockSection";

/**
 * InventoryHealth Component
 *
 * Displays 3 cards showing inventory health metrics:
 * - Total Item Variant
 * - At Reorder Point
 * - Out of Stock
 *
 * Props:
 * - stats: Object containing totalItemVariants, atReorderPoint, outOfStock
 * - dateRangePicker: Optional React node to render date range picker
 */
const InventoryHealth = ({ stats, dateRangePicker }) => {
  const [isDetailSectionVisible, setIsDetailSectionVisible] = useState(false);
  const [isAtReorderPointSectionVisible, setIsAtReorderPointSectionVisible] = useState(false);
  const [isOutOfStockSectionVisible, setIsOutOfStockSectionVisible] = useState(false);

  const handleCardClick = (cardId) => {
    if (cardId === 1) {
      // Total Item Variant card - toggle section visibility
      setIsDetailSectionVisible((prev) => !prev);
      setIsAtReorderPointSectionVisible(false); // Close other sections
      setIsOutOfStockSectionVisible(false);
    } else if (cardId === 2) {
      // At Reorder Point card - toggle section visibility
      setIsAtReorderPointSectionVisible((prev) => !prev);
      setIsDetailSectionVisible(false); // Close other sections
      setIsOutOfStockSectionVisible(false);
    } else if (cardId === 3) {
      // Out of Stock card - toggle section visibility
      setIsOutOfStockSectionVisible((prev) => !prev);
      setIsDetailSectionVisible(false); // Close other sections
      setIsAtReorderPointSectionVisible(false);
    }
  };
  const cards = [
    {
      id: 1,
      title: "Total Item Variant",
      value: stats.totalItemVariants || 0,
      icon: ShoppingCart,
      bgColor: "bg-blue-50",
      iconColor: "#3b82f6",
    },
    {
      id: 2,
      title: "At Reorder Point",
      value: stats.atReorderPoint || 0,
      icon: AlertCircle,
      bgColor: "bg-yellow-50",
      iconColor: "#fbbf24",
    },
    {
      id: 3,
      title: "Out of Stock",
      value: stats.outOfStock || 0,
      icon: XCircle,
      bgColor: "bg-red-50",
      iconColor: "#ef4444",
    },
  ];

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`${card.bgColor} rounded-lg p-3 sm:p-4 md:p-5 lg:p-6 shadow-md flex items-center gap-3 sm:gap-4 transition-all duration-200 hover:shadow-lg ${
                  card.id === 1 || card.id === 2 || card.id === 3 ? "cursor-pointer" : ""
                }`}
              >
                {/* Circular Icon */}
                <div
                  className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: card.iconColor }}
                >
                  <IconComponent className="text-white w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                </div>

                {/* Metric Value and Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#0C2340] mb-0.5 sm:mb-1">
                    {card.value}
                  </p>
                  <p className="text-xs sm:text-xs md:text-sm text-gray-600 line-clamp-2">
                    {card.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Date Range Picker - positioned on the right side, under the Out of Stock card */}
        {dateRangePicker && (
          <div className="mt-3 sm:mt-4 md:mt-5 flex justify-end">
            <div className="w-full sm:w-auto md:w-auto">
              {dateRangePicker}
            </div>
          </div>
        )}
      </div>

      {/* Inventory Detail Section - appears below cards when visible */}
      {isDetailSectionVisible && (
        <InventoryDetailSection
          totalItemVariants={stats.totalItemVariants || 0}
        />
      )}

      {/* At Reorder Point Section - appears below cards when visible */}
      {isAtReorderPointSectionVisible && (
        <AtReorderPointSection
          totalAtReorderPoint={stats.atReorderPoint || 0}
        />
      )}

      {/* Out of Stock Section - appears below cards when visible */}
      {isOutOfStockSectionVisible && (
        <OutOfStockSection
          totalOutOfStock={stats.outOfStock || 0}
        />
      )}
    </>
  );
};

export default InventoryHealth;

