import React from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../../hooks";
import { ChevronRight } from "lucide-react";

/**
 * RecentOrders Component
 *
 * Displays recent student orders in a simple list format:
 * - Left side: Student name
 * - Right side: Items ordered
 * - "Show more" button at bottom right that navigates to orders page
 */
const RecentOrders = () => {
  const navigate = useNavigate();

  // Fetch 6 most recent orders
  const { orders, loading } = useOrders({
    page: 1,
    limit: 6,
    status: null, // Get all orders
    orderType: null,
    educationLevel: null,
    search: null,
  });

  // Format items from order.items array
  const formatItems = (items) => {
    if (!items || !Array.isArray(items)) {
      return "No items";
    }

    if (items.length === 0) {
      return "No items";
    }

    // Format: "Item Name (Size)" or "Item Name, Item Name 2"
    const formattedItems = items.map((item) => {
      const name = item.name || "Unknown Item";
      const size = item.size ? ` (${item.size})` : "";
      return `${name}${size}`;
    });

    // If more than 2 items, show first 2 and "+X more"
    if (formattedItems.length > 2) {
      const firstTwo = formattedItems.slice(0, 2).join(", ");
      const remaining = formattedItems.length - 2;
      return `${firstTwo} +${remaining} more`;
    }

    return formattedItems.join(", ");
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0C2340]">
          Recent <span className="text-[#e68b00]">Orders</span>
        </h2>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 text-sm">Loading orders...</div>
          </div>
        ) : orders && orders.length > 0 ? (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                >
                  {/* Left: Student Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.student_name || "Unknown Student"}
                    </p>
                  </div>

                  {/* Right: Items Ordered */}
                  <div className="flex-1 text-right min-w-0">
                    <p className="text-sm text-gray-600 truncate">
                      {formatItems(order.items)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Link */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => navigate("/property-custodian/orders")}
                className="text-sm text-[#e68b00] hover:text-[#d97706] font-medium flex items-center gap-1 transition-colors"
              >
                <span>Show more</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 text-sm">No recent orders</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentOrders;
