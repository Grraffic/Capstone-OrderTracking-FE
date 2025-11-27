import { useState, useCallback, useEffect, useMemo } from "react";
import { inventoryAPI } from "../../../services/api";

// API base URL - adjust based on your environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * useItemDetailsModal Hook
 *
 * Manages the item details modal state including:
 * - Modal open/close state
 * - Selected item data
 * - Item variations (same item name, different sizes)
 * - Selected variation tracking
 * - Total cost calculations
 *
 * Usage:
 * const {
 *   isOpen,
 *   selectedItem,
 *   variations,
 *   selectedVariation,
 *   loadingVariations,
 *   totalCostSummary,
 *   openModal,
 *   closeModal,
 *   selectVariation,
 * } = useItemDetailsModal();
 */
export const useItemDetailsModal = (allItems = []) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [variations, setVariations] = useState([]);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [loadingVariations, setLoadingVariations] = useState(false);

  /**
   * Fetch variations (items with same name and education level but different sizes)
   */
  const fetchVariations = useCallback(
    async (item) => {
      if (!item) return;

      setLoadingVariations(true);

      try {
        // Filter items from allItems that match the name and education level
        const matchingItems = allItems.filter(
          (i) =>
            i.name === item.name && i.educationLevel === item.educationLevel
        );

        if (matchingItems.length > 0) {
          setVariations(matchingItems);
          // Set the current item as selected variation
          setSelectedVariation(item);
        } else {
          // Fallback: just use the selected item
          setVariations([item]);
          setSelectedVariation(item);
        }
      } catch (error) {
        console.error("Error fetching variations:", error);
        setVariations([item]);
        setSelectedVariation(item);
      } finally {
        setLoadingVariations(false);
      }
    },
    [allItems]
  );

  /**
   * Open the modal with a specific item
   */
  const openModal = useCallback(
    (item) => {
      setSelectedItem(item);
      setSelectedVariation(item);
      setIsOpen(true);
      fetchVariations(item);
    },
    [fetchVariations]
  );

  /**
   * Close the modal
   */
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedItem(null);
    setVariations([]);
    setSelectedVariation(null);
  }, []);

  /**
   * Select a specific variation
   */
  const selectVariation = useCallback((variation) => {
    setSelectedVariation(variation);
  }, []);

  /**
   * Calculate total cost summary (sum of all variations' stock * price)
   */
  const totalCostSummary = useMemo(() => {
    if (!variations.length) return 0;
    return variations.reduce((total, v) => {
      return total + (v.stock || 0) * (v.price || 0);
    }, 0);
  }, [variations]);

  /**
   * Calculate total stock across all variations
   */
  const totalStock = useMemo(() => {
    if (!variations.length) return 0;
    return variations.reduce((total, v) => total + (v.stock || 0), 0);
  }, [variations]);

  return {
    isOpen,
    selectedItem,
    variations,
    selectedVariation,
    loadingVariations,
    totalCostSummary,
    totalStock,
    openModal,
    closeModal,
    selectVariation,
  };
};

