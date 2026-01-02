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
        // IMPORTANT: Include ALL items with same name+education, even if they have same size
        // This ensures duplicate items (same name+size but different IDs) are shown separately
        const matchingItems = allItems.filter(
          (i) =>
            i.name === item.name && i.educationLevel === item.educationLevel
        );

        console.log(`[useItemDetailsModal] Found ${matchingItems.length} matching items for "${item.name}"`);
        matchingItems.forEach((m, idx) => {
          console.log(`[useItemDetailsModal] Item ${idx + 1}: id=${m.id}, size="${m.size}", stock=${m.stock}, beginning_inventory=${m.beginning_inventory || 'N/A'}, purchases=${m.purchases || 'N/A'}`);
        });

        // Process all matching items to create variations
        // Each item (even with same size) should be a separate variation, never combined
        // This ensures duplicate items are shown separately with their own purchases values
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
                // Use per-size beginning_inventory and purchases if available, otherwise use item-level
                beginning_inventory: variationData?.beginning_inventory !== undefined && variationData?.beginning_inventory !== null
                  ? Number(variationData.beginning_inventory) || 0
                  : (matchingItem.beginning_inventory || 0),
                purchases: variationData?.purchases !== undefined && variationData?.purchases !== null
                  ? Number(variationData.purchases) || 0
                  : (matchingItem.purchases || 0),
              });
            });
          } else {
            // Item has a single size (or N/A), add it as a separate variation
            // IMPORTANT: Even if another item has the same size, keep them separate
            // This ensures duplicate items (same name+size but different IDs) are shown separately
            allVariations.push({
              ...matchingItem,
              // Ensure size is properly set
              size: matchingItem.size || "N/A",
              // Add unique key to distinguish from other items with same size
              _variationKey: matchingItem.id || `${matchingItem.name}-${matchingItem.size}-${matchingItem.created_at || Date.now()}`,
            });
          }
        });

        // Filter out duplicate entries - keep only the first entry (with beginning_inventory > 0)
        // Sort by created_at ascending so the first entry appears first
        const sortedVariations = allVariations.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateA - dateB; // Ascending order (oldest first)
        });

        // Group by name+size and keep only the first entry (the one with beginning_inventory)
        const seen = new Map();
        const uniqueVariations = [];
        
        sortedVariations.forEach((variation) => {
          const key = `${variation.name}-${variation.size || 'N/A'}`;
          
          if (!seen.has(key)) {
            // First entry for this name+size - keep it
            seen.set(key, true);
            uniqueVariations.push(variation);
          } else {
            // Duplicate entry - skip it (we only want the first entry)
            console.log(`[useItemDetailsModal] Skipping duplicate entry: ${variation.name} ${variation.size} (ID: ${variation.id})`);
          }
        });

        // Set all variations (only first entry for each name+size)
        if (uniqueVariations.length > 0) {
          setVariations(uniqueVariations);

          // Set the selected variation - try to match the current item's size
          const selectedVariation =
            uniqueVariations.find(
              (v) =>
                v.id === item.id &&
                (item.size === v.size ||
                  (item.size &&
                    item.size.includes(",") &&
                    v.size &&
                    item.size.split(",").some((s) => s.trim() === v.size)))
            ) || uniqueVariations[0];
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
