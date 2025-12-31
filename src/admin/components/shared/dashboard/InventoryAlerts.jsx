import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * InventoryAlerts Component
 *
 * Displays out of stock items from the inventory table
 * Shows item name, size/variant, and status
 *
 * Props:
 * - items: Array of out of stock items
 */
const InventoryAlerts = ({ items = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0C2340]">
          Inventory <span className="text-[#e68b00]">Alerts</span>
        </h2>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No out of stock items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <span className="text-[#003363] text-base font-semibold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#003363] truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-[#E68B00]">
                      {item.size || item.education_level || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <span className="text-xs font-semibold text-red-600">
                    Out of Stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Link */}
        {items.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => navigate("/admin/inventory")}
              className="text-sm text-[#003363] hover:text-[#0C2340] font-medium flex items-center gap-1 transition-colors"
            >
              <span>Inventory</span>
              <ChevronRight size={16} className="text-[#003363]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlerts;

