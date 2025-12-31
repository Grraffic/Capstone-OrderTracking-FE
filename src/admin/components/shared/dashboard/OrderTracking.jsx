import { Package, CheckCircle, ShoppingBag, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * OrderTracking Component
 *
 * Displays 3 cards showing order tracking metrics:
 * - Pre-orders count
 * - Claimed count
 * - Orders count
 *
 * Props:
 * - stats: Object containing preOrders, claimed, orders
 */
const OrderTracking = ({ stats }) => {
  const navigate = useNavigate();

  // Format trend percentage
  const formatTrend = (trend) => {
    if (!trend && trend !== 0) return "+0% since last month";
    const sign = trend >= 0 ? "+" : "";
    return `${sign}${trend}% since last month`;
  };

  const cards = [
    {
      id: 1,
      title: "Pre-orders",
      value: stats.preOrders || 0,
      icon: Package,
      bgColor: "bg-blue-50",
      iconColor: "#3b82f6",
      trend: formatTrend(stats.trends?.preOrders),
    },
    {
      id: 2,
      title: "Claimed",
      value: stats.claimed || 0,
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconColor: "#10b981",
      trend: formatTrend(stats.trends?.claimed),
    },
    {
      id: 3,
      title: "Orders",
      value: stats.orders || 0,
      icon: ShoppingBag,
      bgColor: "bg-orange-50",
      iconColor: "#e68b00",
      trend: formatTrend(stats.trends?.orders),
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0C2340]">
          Order <span className="text-[#e68b00]">Tracking</span>
        </h2>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                className={`${card.bgColor} rounded-lg p-4 shadow-sm flex flex-col items-center text-center transition-all duration-200 hover:shadow-md`}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: card.iconColor }}
                >
                  <IconComponent size={24} className="text-white" />
                </div>

                {/* Value */}
                <p className="text-3xl sm:text-4xl font-bold text-[#0C2340] mb-1">
                  {card.value}
                </p>

                {/* Title */}
                <p className="text-sm font-medium text-gray-700 mb-2">
                  {card.title}
                </p>

                {/* Trend */}
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <TrendingUp size={14} />
                  <span>{card.trend}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Link */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => navigate("/admin/orders")}
            className="text-sm text-[#e68b00] hover:text-[#d97706] font-medium flex items-center gap-1 transition-colors"
          >
            <span>View all orders</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

