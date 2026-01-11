import React, { useState } from "react";
import SetReorderPointModal from "./SetReorderPointModal";

/**
 * AtReorderPointTable Component
 *
 * Displays items at reorder point in a table format with columns:
 * - Item Name
 * - Education Level
 * - Size
 * - Current Stock
 * - Reorder Point
 * - Action
 *
 * Props:
 * - data: array - Items at reorder point (one row per size variant)
 * - loading: boolean - Loading state
 * - educationLevel: string - Current filter value for display
 * - onRefetch: function - Optional callback to refetch data after update
 */
const AtReorderPointTable = ({ data, loading, educationLevel, onRefetch }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    itemId: null,
    itemName: "",
    variant: "",
    currentReorderPoint: 0,
  });

  const handleCreatePO = (itemId, itemName, size, currentReorderPoint) => {
    setModalState({
      isOpen: true,
      itemId,
      itemName,
      variant: size,
      currentReorderPoint: currentReorderPoint || 0,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      itemId: null,
      itemName: "",
      variant: "",
      currentReorderPoint: 0,
    });
  };

  const handleSaveReorderPoint = async (reorderPoint, selectedVariant) => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      
      // Use the selected variant from modal, or fallback to modalState.variant
      const targetVariant = selectedVariant || modalState.variant;
      
      // First, fetch the item to check if it has size variations
      const getItemResponse = await fetch(
        `${API_BASE_URL}/items/${modalState.itemId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!getItemResponse.ok) {
        throw new Error("Failed to fetch item details");
      }

      const itemData = await getItemResponse.json();
      if (!itemData.success || !itemData.data) {
        throw new Error("Item not found");
      }

      const item = itemData.data;
      let updatePayload = {};

      // Check if item has size variations in note field
      if (item.note && targetVariant) {
        try {
          const parsedNote = JSON.parse(item.note);
          if (
            parsedNote &&
            parsedNote._type === "sizeVariations" &&
            Array.isArray(parsedNote.sizeVariations)
          ) {
            // Find the matching variant
            const variantIndex = parsedNote.sizeVariations.findIndex((v) => {
              const vSize = (v.size || "").trim();
              const targetSize = targetVariant.trim();
              // Match exact or partial (e.g., "Small (S)" matches "Small" or "S")
              return (
                vSize === targetSize ||
                vSize.includes(targetSize) ||
                targetSize.includes(vSize) ||
                vSize.replace(/\([^)]*\)/g, "").trim() === targetSize ||
                targetSize.replace(/\([^)]*\)/g, "").trim() === vSize
              );
            });

            if (variantIndex !== -1) {
              // Update reorder_point for this specific variant
              parsedNote.sizeVariations[variantIndex].reorder_point = reorderPoint;
              updatePayload.note = JSON.stringify(parsedNote);
            } else {
              // Variant not found, update item-level reorder_point
              updatePayload.reorder_point = reorderPoint;
            }
          } else {
            // Not a size variations item, update item-level reorder_point
            updatePayload.reorder_point = reorderPoint;
          }
        } catch (e) {
          // Note is not JSON or parse error, update item-level reorder_point
          console.warn("Failed to parse note field, updating item-level reorder_point:", e);
          updatePayload.reorder_point = reorderPoint;
        }
      } else {
        // No note field or no variant specified, update item-level reorder_point
        updatePayload.reorder_point = reorderPoint;
      }

      // Update the item
      const response = await fetch(
        `${API_BASE_URL}/items/${modalState.itemId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update reorder point");
      }

      const result = await response.json();
      
      if (result.success) {
        // Refetch data if callback provided
        if (onRefetch) {
          onRefetch();
        }
        return result;
      } else {
        throw new Error(result.message || "Failed to update reorder point");
      }
    } catch (error) {
      console.error("Error updating reorder point:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500 text-sm">
          No items at reorder point found for {educationLevel}.
        </p>
      </div>
    );
  }

  // Header color: #F7C335 with 87% opacity
  const headerColor = "rgba(247, 195, 53, 0.87)";

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead style={{ backgroundColor: headerColor }}>
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Item Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Education Level
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Size
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Current Stock
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Reorder Point
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                Action
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
                <td className="px-4 py-4 text-sm text-gray-900 font-medium border-b border-gray-100">
                  {item.itemName}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 border-b border-gray-100">
                  {item.educationLevel}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 border-b border-gray-100">
                  {item.size}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-[#E68B00] border-b border-gray-100">
                  {item.currentStock}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900 border-b border-gray-100">
                  {item.reorderPoint}
                </td>
                <td className="px-4 py-4 text-sm border-b border-gray-100">
                  <button
                    onClick={() => handleCreatePO(item.itemId, item.itemName, item.size, item.reorderPoint)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Create PO
                  </button>
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {item.itemName}
              </h3>
              <button
                onClick={() => handleCreatePO(item.itemId, item.itemName, item.size, item.reorderPoint)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium"
              >
                Create PO
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Education Level:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {item.educationLevel}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <span className="ml-2 font-medium text-gray-900">{item.size}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Stock:</span>
                <span className="ml-2 font-semibold text-[#E68B00]">
                  {item.currentStock}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Reorder Point:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {item.reorderPoint}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Set Reorder Point Modal */}
      <SetReorderPointModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        itemName={modalState.itemName}
        itemId={modalState.itemId}
        variant={modalState.variant}
        currentReorderPoint={modalState.currentReorderPoint}
        onSave={handleSaveReorderPoint}
      />
    </div>
  );
};

export default AtReorderPointTable;
