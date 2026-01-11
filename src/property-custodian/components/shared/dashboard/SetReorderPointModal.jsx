import React, { useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * SetReorderPointModal Component
 *
 * Modal for setting/updating the reorder point for an item and its variant.
 *
 * Props:
 * - isOpen: boolean - Whether the modal is open
 * - onClose: function - Function to close the modal
 * - itemName: string - Name of the item
 * - itemId: string - ID of the item (to fetch variants)
 * - variant: string - Initial size/variant of the item
 * - currentReorderPoint: number - Current reorder point value
 * - onSave: function - Callback when save is clicked (receives reorderPoint and selectedVariant)
 */
const SetReorderPointModal = ({
  isOpen,
  onClose,
  itemName,
  itemId,
  variant,
  currentReorderPoint = 0,
  onSave,
}) => {
  const [selectedVariant, setSelectedVariant] = useState(variant);
  const [reorderPoint, setReorderPoint] = useState(
    currentReorderPoint.toString()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableVariants, setAvailableVariants] = useState([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Fetch available variants when modal opens
  React.useEffect(() => {
    const fetchVariants = async () => {
      if (!isOpen || !itemId) return;

      setLoadingVariants(true);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        
        // Fetch item details
        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch item details");
        }

        const itemData = await response.json();
        if (!itemData.success || !itemData.data) {
          throw new Error("Item not found");
        }

        const item = itemData.data;
        const variants = [];

        // Check if item has size variations in note field
        if (item.note) {
          try {
            const parsedNote = JSON.parse(item.note);
            if (
              parsedNote &&
              parsedNote._type === "sizeVariations" &&
              Array.isArray(parsedNote.sizeVariations)
            ) {
              // Extract variants from JSON
              parsedNote.sizeVariations.forEach((v) => {
                variants.push({
                  size: v.size || "N/A",
                  reorderPoint: v.reorder_point || item.reorder_point || 0,
                });
              });
            }
          } catch (e) {
            // Not JSON or parse error
          }
        }

        // If no variants found in JSON, check if item has comma-separated sizes
        if (variants.length === 0 && item.size && item.size.includes(",")) {
          const sizes = item.size.split(",").map((s) => s.trim());
          sizes.forEach((size) => {
            variants.push({
              size: size,
              reorderPoint: item.reorder_point || 0,
            });
          });
        }

        // If still no variants, use the single size or default
        if (variants.length === 0) {
          variants.push({
            size: item.size || variant || "N/A",
            reorderPoint: item.reorder_point || currentReorderPoint || 0,
          });
        }

        setAvailableVariants(variants);

        // Set initial selected variant and its reorder point
        const initialVariant = variants.find((v) => v.size === variant) || variants[0];
        if (initialVariant) {
          setSelectedVariant(initialVariant.size);
          setReorderPoint(initialVariant.reorderPoint.toString());
        }
      } catch (err) {
        console.error("Error fetching variants:", err);
        // Fallback to single variant
        setAvailableVariants([{ size: variant || "N/A", reorderPoint: currentReorderPoint || 0 }]);
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchVariants();
  }, [isOpen, itemId, variant, currentReorderPoint]);

  // Update reorder point when variant changes
  React.useEffect(() => {
    if (selectedVariant && availableVariants.length > 0) {
      const selected = availableVariants.find((v) => v.size === selectedVariant);
      if (selected) {
        setReorderPoint(selected.reorderPoint.toString());
      }
    }
  }, [selectedVariant, availableVariants]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const reorderPointNum = Number(reorderPoint);
    if (isNaN(reorderPointNum) || reorderPointNum < 0) {
      setError("Reorder point must be a non-negative number");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(reorderPointNum, selectedVariant);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save reorder point");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-blue-600 mb-6 pr-10">
          Set Item Reorder Point
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Item Name
            </label>
            <input
              type="text"
              value={itemName}
              readOnly
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600 cursor-not-allowed"
              placeholder="Enter Item Name"
            />
          </div>

          {/* Variant */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Variant</label>
            <div className="relative">
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                disabled={isSubmitting || loadingVariants || availableVariants.length <= 1}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-10 disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                {availableVariants.map((v) => (
                  <option key={v.size} value={v.size}>
                    {v.size}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {loadingVariants && (
              <p className="text-xs text-gray-500">Loading variants...</p>
            )}
          </div>

          {/* Reorder Point */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Reorder Point
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter Reorder Point"
              required
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default SetReorderPointModal;
