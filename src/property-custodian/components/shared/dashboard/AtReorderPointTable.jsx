import React from "react";

/**
 * AtReorderPointTable Component
 *
 * Displays items at reorder point in a table format with columns:
 * - Item Name
 * - Education Level
 * - Size
 * - Current Stock
 * - Reorder Point
 *
 * Props:
 * - data: array - Items at reorder point (one row per size variant)
 * - loading: boolean - Loading state
 * - educationLevel: string - Current filter value for display
 */
const AtReorderPointTable = ({ data, loading, educationLevel }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden font-sf-medium">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center font-sf-medium">
        <p className="text-gray-500 text-sm">
          No items at reorder point found for {educationLevel}.
        </p>
      </div>
    );
  }

  // Header color: #F7C335 with 87% opacity
  const headerColor = "rgba(247, 195, 53, 0.87)";

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm font-sf-medium">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead style={{ backgroundColor: headerColor }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-sf-semibold font-semibold text-white">
                Item Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-sf-semibold font-semibold text-white">
                Education Level
              </th>
              <th className="px-4 py-3 text-left text-sm font-sf-semibold font-semibold text-white">
                Size
              </th>
              <th className="px-4 py-3 text-left text-sm font-sf-semibold font-semibold text-white">
                Current Stock
              </th>
              <th className="px-4 py-3 text-left text-sm font-sf-semibold font-semibold text-white">
                Reorder Point
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={`${item.id}-${item.size}`}
                className={`${
                  index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
                } hover:bg-gray-50 transition-colors`}
              >
                <td className="px-4 py-4 text-sm text-[#003363] font-medium border-b border-gray-100">
                  {item.itemName}
                </td>
                <td className="px-4 py-4 text-sm text-[#003363] border-b border-gray-100">
                  {item.educationLevel}
                </td>
                <td className="px-4 py-4 text-sm text-[#003363] border-b border-gray-100">
                  {item.size}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-[#003363] border-b border-gray-100">
                  {item.currentStock}
                </td>
                <td className="px-4 py-4 text-sm text-[#003363] border-b border-gray-100">
                  {item.reorderPoint}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="md:hidden">
        {data.map((item, index) => (
          <div
            key={`${item.id}-${item.size}`}
            className={`p-4 border-b border-gray-200 ${
              index % 2 === 0 ? "bg-[#FFF8F0]" : "bg-white"
            }`}
          >
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-[#003363]">
                {item.itemName}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Education Level:</span>
                <span className="ml-2 font-medium text-[#003363]">
                  {item.educationLevel}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <span className="ml-2 font-medium text-[#003363]">{item.size}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Stock:</span>
                <span className="ml-2 font-semibold text-[#003363]">
                  {item.currentStock}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Reorder Point:</span>
                <span className="ml-2 font-medium text-[#003363]">
                  {item.reorderPoint}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AtReorderPointTable;
