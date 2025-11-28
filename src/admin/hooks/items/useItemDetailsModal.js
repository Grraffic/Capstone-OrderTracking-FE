import { useState, useCallback, useMemo } from "react";

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
   * Also handles items with comma-separated sizes by splitting them into virtual variations
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

        // Check if the current item has comma-separated sizes
        const hasCommaSeparatedSizes =
          item.size && item.size.includes(",") && item.size !== "N/A";

        if (hasCommaSeparatedSizes) {
          // Split comma-separated sizes and create virtual variations
          const sizes = item.size
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          // Try to parse per-size stock and price from note field
          let sizeVariationsData = null;
          try {
            if (item.note) {
              const parsedNote = JSON.parse(item.note);
              if (
                parsedNote._type === "sizeVariations" &&
                parsedNote.sizeVariations
              ) {
                sizeVariationsData = parsedNote.sizeVariations;
              }
            }
          } catch (e) {
            // If note is not JSON or doesn't contain size variations, use defaults
            console.log("Note field doesn't contain size variation data:", e);
          }

          const virtualVariations = sizes.map((size, index) => {
            // Find matching size variation data (case-insensitive, trim whitespace)
            const variationData = sizeVariationsData?.find((v) => {
              const vSize = (v.size || "").trim().toLowerCase();
              const currentSize = size.trim().toLowerCase();
              return vSize === currentSize;
            });

            return {
              ...item,
              // Keep original ID for edit/delete operations
              id: item.id,
              size: size,
              // Add a unique key for React rendering and selection
              _variationKey: `${item.id}-${index}`,
              // Use per-size stock and price if available, otherwise use item defaults
              stock: variationData?.stock ?? item.stock,
              price: variationData?.price ?? item.price,
            };
          });

          // Also include other matching items that don't have comma-separated sizes
          const otherItems = matchingItems.filter(
            (i) =>
              i.id !== item.id &&
              (!i.size || !i.size.includes(",") || i.size === "N/A")
          );

          const allVariations = [...virtualVariations, ...otherItems];
          setVariations(
            allVariations.length > 0 ? allVariations : virtualVariations
          );

          // Set the first variation as selected (or match the item's current size if possible)
          const firstSize = sizes[0];
          const matchingVariation =
            virtualVariations.find((v) => v.size === firstSize) ||
            virtualVariations[0];
          setSelectedVariation(matchingVariation);
        } else if (matchingItems.length > 0) {
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
      const stock = Number(v.stock) || 0;
      const price = Number(v.price) || 0;
      return total + stock * price;
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
