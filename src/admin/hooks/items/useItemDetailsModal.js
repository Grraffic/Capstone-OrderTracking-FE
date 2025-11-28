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
   * Ensures each size is always displayed as a separate variation, never combined
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

        // Process all matching items to create variations
        // Each size should be a separate variation, never combined
        const allVariations = [];

        matchingItems.forEach((matchingItem) => {
          // Check if this item has comma-separated sizes
          const hasCommaSeparatedSizes =
            matchingItem.size &&
            matchingItem.size.includes(",") &&
            matchingItem.size !== "N/A";

          if (hasCommaSeparatedSizes) {
            // Split comma-separated sizes and create virtual variations for each size
            const sizes = matchingItem.size
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);

            // Try to parse per-size stock and price from note field
            let sizeVariationsData = null;
            try {
              if (matchingItem.note) {
                const parsedNote = JSON.parse(matchingItem.note);
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

            // Create a separate virtual variation for each size
            sizes.forEach((size, index) => {
              // Find matching size variation data (case-insensitive, trim whitespace)
              const variationData = sizeVariationsData?.find((v) => {
                const vSize = (v.size || "").trim().toLowerCase();
                const currentSize = size.trim().toLowerCase();
                return vSize === currentSize;
              });

              allVariations.push({
                ...matchingItem,
                // Keep original ID for edit/delete operations
                id: matchingItem.id,
                size: size, // Each variation gets its own size
                // Add a unique key for React rendering and selection
                _variationKey: `${matchingItem.id}-${index}`,
                // Use per-size stock and price if available, otherwise use item defaults
                stock: variationData?.stock ?? matchingItem.stock,
                price: variationData?.price ?? matchingItem.price,
              });
            });
          } else {
            // Item has a single size (or N/A), add it as a separate variation
            allVariations.push({
              ...matchingItem,
              // Ensure size is properly set
              size: matchingItem.size || "N/A",
            });
          }
        });

        // Set all variations (each size is now a separate variation)
        if (allVariations.length > 0) {
          setVariations(allVariations);

          // Set the selected variation - try to match the current item's size
          const selectedVariation =
            allVariations.find(
              (v) =>
                v.id === item.id &&
                (item.size === v.size ||
                  (item.size &&
                    item.size.includes(",") &&
                    v.size &&
                    item.size.split(",").some((s) => s.trim() === v.size)))
            ) || allVariations[0];
          setSelectedVariation(selectedVariation);
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
