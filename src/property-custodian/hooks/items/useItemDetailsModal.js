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
// Helper function for case-insensitive string normalization
const normalizeString = (str) => (str || "").trim().toLowerCase();

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
        // Filter items from allItems that match the name (regardless of education level)
        // IMPORTANT: Include ALL items with same name, even if they have different education levels
        // This combines items with same name but different education levels into one item with variants
        // Use case-insensitive matching to find all variations
        const matchingItems = allItems.filter(
          (i) =>
            normalizeString(i.name) === normalizeString(item.name)
            // Removed education level filter to combine items with same name but different education levels
        );

        console.log(
          `[useItemDetailsModal] Found ${matchingItems.length} matching items for "${item.name}" (combining across all education levels)`
        );
        matchingItems.forEach((m, idx) => {
          console.log(
            `[useItemDetailsModal] Item ${idx + 1}: id=${m.id}, size="${
              m.size
            }", stock=${m.stock}, beginning_inventory=${
              m.beginning_inventory || "N/A"
            }, purchases=${m.purchases || "N/A"}, hasNote=${!!m.note}`
          );
          // If item has note field, try to parse it to see what's inside
          if (m.note) {
            try {
              const parsedNote = JSON.parse(m.note);
              if (
                parsedNote._type === "sizeVariations" &&
                parsedNote.sizeVariations
              ) {
                console.log(
                  `[useItemDetailsModal]   └─ Note contains sizeVariations:`,
                  parsedNote.sizeVariations.map((v) => ({
                    size: v.size,
                    stock: v.stock,
                  }))
                );
              }
            } catch (e) {
              console.log(
                `[useItemDetailsModal]   └─ Note is not JSON or parse error:`,
                e.message
              );
            }
          }
        });

        // Process all matching items to create variations
        // Each item (even with same size) should be a separate variation, never combined
        // This ensures duplicate items are shown separately with their own purchases values
        const allVariations = [];

        matchingItems.forEach((matchingItem) => {
          // First, check if item has JSON variations in note field
          // This handles cases where sizes were added via duplicate detection
          // and stored in JSON even though the main size field is a single size
          let sizeVariationsData = null;
          try {
            if (matchingItem.note) {
              const parsedNote = JSON.parse(matchingItem.note);
              if (
                parsedNote._type === "sizeVariations" &&
                parsedNote.sizeVariations &&
                Array.isArray(parsedNote.sizeVariations) &&
                parsedNote.sizeVariations.length > 0
              ) {
                sizeVariationsData = parsedNote.sizeVariations;
                console.log(
                  `[useItemDetailsModal] Item ${matchingItem.id} has JSON sizeVariations:`,
                  sizeVariationsData.map((v) => v.size)
                );
              }
            }
          } catch (e) {
            // If note is not JSON or doesn't contain size variations, use defaults
            console.log(
              `[useItemDetailsModal] Note field doesn't contain size variation data for item ${matchingItem.id}:`,
              e.message
            );
          }

          // Check if this item has comma-separated sizes in the main size field
          const hasCommaSeparatedSizes =
            matchingItem.size &&
            matchingItem.size.includes(",") &&
            matchingItem.size !== "N/A";

          // If we have JSON variations, use those to create variations
          // This handles items where sizes were added via duplicate detection
          if (sizeVariationsData && sizeVariationsData.length > 0) {
            console.log(
              `[useItemDetailsModal] Creating variations from JSON sizeVariations for item ${matchingItem.id}`
            );
            sizeVariationsData.forEach((variationData, index) => {
              allVariations.push({
                ...matchingItem,
                // Keep original ID for edit/delete operations
                id: matchingItem.id,
                size: variationData.size || matchingItem.size || "N/A",
                // Add a unique key for React rendering and selection
                _variationKey: `${matchingItem.id}-json-${index}`,
                // Use per-size stock and price from JSON
                stock:
                  variationData.stock !== undefined &&
                  variationData.stock !== null
                    ? Number(variationData.stock) || 0
                    : matchingItem.stock || 0,
                price:
                  variationData.price !== undefined &&
                  variationData.price !== null
                    ? Number(variationData.price) || 0
                    : matchingItem.price || 0,
                // Use per-size beginning_inventory and purchases from JSON
                beginning_inventory:
                  variationData.beginning_inventory !== undefined &&
                  variationData.beginning_inventory !== null
                    ? Number(variationData.beginning_inventory) || 0
                    : matchingItem.beginning_inventory || 0,
                purchases:
                  variationData.purchases !== undefined &&
                  variationData.purchases !== null
                    ? Number(variationData.purchases) || 0
                    : matchingItem.purchases || 0,
              });
            });
          } else if (hasCommaSeparatedSizes) {
            // Split comma-separated sizes and create virtual variations for each size
            const sizes = matchingItem.size
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);

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
                beginning_inventory:
                  variationData?.beginning_inventory !== undefined &&
                  variationData?.beginning_inventory !== null
                    ? Number(variationData.beginning_inventory) || 0
                    : matchingItem.beginning_inventory || 0,
                purchases:
                  variationData?.purchases !== undefined &&
                  variationData?.purchases !== null
                    ? Number(variationData.purchases) || 0
                    : matchingItem.purchases || 0,
              });
            });
          } else {
            // Item has a single size (or N/A) and no JSON variations
            // Add it as a separate variation
            // IMPORTANT: Even if another item has the same size, keep them separate
            // This ensures duplicate items (same name+size but different IDs) are shown separately
            allVariations.push({
              ...matchingItem,
              // Ensure size is properly set
              size: matchingItem.size || "N/A",
              // Add unique key to distinguish from other items with same size
              _variationKey:
                matchingItem.id ||
                `${matchingItem.name}-${matchingItem.size}-${
                  matchingItem.created_at || Date.now()
                }`,
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
        // Use case-insensitive matching for size to ensure all sizes are included
        const seen = new Map();
        const uniqueVariations = [];

        console.log(
          `[useItemDetailsModal] Processing ${sortedVariations.length} variations for deduplication`
        );
        sortedVariations.forEach((variation, idx) => {
          // Normalize size for case-insensitive matching
          // Extract the base size name (e.g., "Small" from "Small (S)" or just "Small")
          const rawSize = variation.size || "N/A";
          const normalizedSize = normalizeString(rawSize);
          // Remove parenthetical content like "(S)", "(L)" etc. for comparison
          // This ensures "Small" and "Small (S)" are treated as the same size
          const sizeForComparison = normalizedSize
            .replace(/\s*\([^)]*\)\s*/g, "")
            .trim();
          // Include education level in key to treat items with same name+size but different education levels as unique variations
          const educationLevelForComparison = normalizeString(variation.educationLevel || variation.education_level || "N/A");
          const key = `${normalizeString(variation.name)}-${sizeForComparison}-${educationLevelForComparison}`;

          console.log(
            `[useItemDetailsModal] Variation ${idx + 1}: name="${
              variation.name
            }", rawSize="${rawSize}", normalizedSize="${normalizedSize}", sizeForComparison="${sizeForComparison}", key="${key}"`
          );

          if (!seen.has(key)) {
            // First entry for this name+size combination - keep it
            seen.set(key, true);
            uniqueVariations.push(variation);
            console.log(
              `[useItemDetailsModal] ✅ Keeping variation: ${variation.name} ${rawSize} (ID: ${variation.id})`
            );
          } else {
            // This is a duplicate size - check if we should keep it anyway
            // Only skip if it's truly a duplicate (same ID or same size format)
            const existingVariation = uniqueVariations.find((v) => {
              const existingRawSize = v.size || "N/A";
              const existingNormalized = normalizeString(existingRawSize);
              const existingSizeForComparison = existingNormalized
                .replace(/\s*\([^)]*\)\s*/g, "")
                .trim();
              const existingEducationLevel = normalizeString(v.educationLevel || v.education_level || "N/A");
              return (
                existingSizeForComparison === sizeForComparison &&
                normalizeString(v.name) === normalizeString(variation.name) &&
                existingEducationLevel === educationLevelForComparison
              );
            });

            if (existingVariation) {
              // Check if this is the same item (same ID) or a different item with same size
              if (existingVariation.id === variation.id) {
                // Same item, definitely skip
                console.log(
                  `[useItemDetailsModal] ⚠️ Skipping duplicate (same ID): ${variation.name} ${rawSize} (ID: ${variation.id})`
                );
              } else {
                // Different items with same size - this shouldn't happen if items are created correctly
                // But keep the first one (already in uniqueVariations)
                console.log(
                  `[useItemDetailsModal] ⚠️ Skipping duplicate size (different ID): ${variation.name} ${rawSize} (ID: ${variation.id}) - keeping first entry (ID: ${existingVariation.id})`
                );
              }
            } else {
              // Shouldn't happen, but keep it just in case
              uniqueVariations.push(variation);
              console.log(
                `[useItemDetailsModal] ⚠️ Unexpected: key exists but variation not found, keeping anyway: ${variation.name} ${rawSize} (ID: ${variation.id})`
              );
            }
          }
        });

        console.log(
          `[useItemDetailsModal] Final unique variations: ${uniqueVariations.length}`
        );
        uniqueVariations.forEach((v, idx) => {
          console.log(
            `[useItemDetailsModal] Final variation ${idx + 1}: ${v.name} ${
              v.size
            } (ID: ${v.id}, stock: ${v.stock})`
          );
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
