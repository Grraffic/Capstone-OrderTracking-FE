import { useState, useCallback, useMemo, useEffect } from "react";

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
          let accessoryEntriesData = null;
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
              } else if (
                parsedNote._type === "accessoryEntries" &&
                parsedNote.accessoryEntries &&
                Array.isArray(parsedNote.accessoryEntries) &&
                parsedNote.accessoryEntries.length > 0
              ) {
                accessoryEntriesData = parsedNote.accessoryEntries;
                console.log(
                  `[useItemDetailsModal] Item ${matchingItem.id} has JSON accessoryEntries:`,
                  accessoryEntriesData.length,
                  "entries"
                );
              }
            }
          } catch (e) {
            // If note is not JSON or doesn't contain variation data, use defaults
            console.log(
              `[useItemDetailsModal] Note field doesn't contain variation data for item ${matchingItem.id}:`,
              e.message
            );
          }

          // Check if this item has comma-separated sizes in the main size field
          const hasCommaSeparatedSizes =
            matchingItem.size &&
            matchingItem.size.includes(",") &&
            matchingItem.size !== "N/A";

          // If we have accessoryEntries, process them first (accessories don't have sizes)
          if (accessoryEntriesData && accessoryEntriesData.length > 0) {
            console.log(
              `[useItemDetailsModal] Creating variations from JSON accessoryEntries for item ${matchingItem.id}`
            );
            accessoryEntriesData.forEach((entryData, index) => {
              const begInv =
                entryData.beginning_inventory !== undefined &&
                entryData.beginning_inventory !== null
                  ? Number(entryData.beginning_inventory) || 0
                  : matchingItem.beginning_inventory || 0;
              const storedStock =
                entryData.stock !== undefined &&
                entryData.stock !== null
                  ? Number(entryData.stock) || 0
                  : matchingItem.stock || 0;
              const purch =
                entryData.purchases !== undefined &&
                entryData.purchases !== null
                  ? Number(entryData.purchases) || 0
                  : 0;
              // Display stock as max(stored, beginning_inventory + purchases) so it's never inconsistent
              const displayStock = Math.max(
                storedStock,
                begInv + purch
              );
              allVariations.push({
                ...matchingItem,
                // Keep original ID for edit/delete operations
                id: matchingItem.id,
                size: matchingItem.size || "N/A",
                // Add a unique key for React rendering and selection
                _variationKey: `${matchingItem.id}-accessory-${index}`,
                // Use per-entry stock (display = stored or beginning_inventory + purchases)
                stock: displayStock,
                price:
                  entryData.price !== undefined &&
                  entryData.price !== null
                    ? Number(entryData.price) || 0
                    : matchingItem.price || 0,
                beginning_inventory: begInv,
                purchases: purch,
                // Include beginning_inventory_unit_price for FIFO calculation
                beginning_inventory_unit_price:
                  entryData.beginning_inventory_unit_price !== undefined &&
                  entryData.beginning_inventory_unit_price !== null
                    ? Number(entryData.beginning_inventory_unit_price)
                    : matchingItem.beginning_inventory_unit_price ?? matchingItem.price ?? 0,
              });
            });
          }
          // If we have JSON variations, use those to create variations
          // This handles items where sizes were added via duplicate detection
          else if (sizeVariationsData && sizeVariationsData.length > 0) {
            console.log(
              `[useItemDetailsModal] Creating variations from JSON sizeVariations for item ${matchingItem.id}`
            );
            sizeVariationsData.forEach((variationData, index) => {
              const begInv =
                variationData.beginning_inventory !== undefined &&
                variationData.beginning_inventory !== null
                  ? Number(variationData.beginning_inventory) || 0
                  : matchingItem.beginning_inventory || 0;
              const storedStock =
                variationData.stock !== undefined &&
                variationData.stock !== null
                  ? Number(variationData.stock) || 0
                  : matchingItem.stock || 0;
              // Per-size purchases only: use variant's value or derive from this size's stock - beginning_inventory.
              // Never use item-level purchases for a specific size (so Medium stays 0 when only Small got +10).
              const purch =
                variationData.purchases !== undefined &&
                variationData.purchases !== null
                  ? Number(variationData.purchases) || 0
                  : (variationData.stock !== undefined && variationData.stock !== null)
                    ? Math.max(0, storedStock - begInv)
                    : 0;
              // Display stock as max(stored, beginning_inventory + purchases) so it's never inconsistent
              const displayStock = Math.max(
                storedStock,
                begInv + purch
              );
              allVariations.push({
                ...matchingItem,
                // Keep original ID for edit/delete operations
                id: matchingItem.id,
                size: variationData.size || matchingItem.size || "N/A",
                // Add a unique key for React rendering and selection
                _variationKey: `${matchingItem.id}-json-${index}`,
                // Use per-size stock (display = stored or beginning_inventory + purchases)
                stock: displayStock,
                price:
                  variationData.price !== undefined &&
                  variationData.price !== null
                    ? Number(variationData.price) || 0
                    : matchingItem.price || 0,
                beginning_inventory: begInv,
                purchases: purch,
                // Include beginning_inventory_unit_price for FIFO calculation
                beginning_inventory_unit_price:
                  variationData.beginning_inventory_unit_price !== undefined &&
                  variationData.beginning_inventory_unit_price !== null
                    ? Number(variationData.beginning_inventory_unit_price)
                    : matchingItem.beginning_inventory_unit_price,
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

              const begInv =
                variationData?.beginning_inventory !== undefined &&
                variationData?.beginning_inventory !== null
                  ? Number(variationData.beginning_inventory) || 0
                  : matchingItem.beginning_inventory || 0;
              const storedStock =
                variationData?.stock ?? matchingItem.stock;
              const storedNum = Number(storedStock) || 0;
              // Per-size purchases only; never use item-level for a specific size
              const purch =
                variationData?.purchases !== undefined &&
                variationData?.purchases !== null
                  ? Number(variationData.purchases) || 0
                  : (variationData?.stock !== undefined && variationData?.stock !== null)
                    ? Math.max(0, storedNum - begInv)
                    : 0;
              const displayStock = Math.max(storedNum, begInv + purch);
              allVariations.push({
                ...matchingItem,
                // Keep original ID for edit/delete operations
                id: matchingItem.id,
                size: size, // Each variation gets its own size
                // Add a unique key for React rendering and selection
                _variationKey: `${matchingItem.id}-${index}`,
                stock: displayStock,
                price: variationData?.price ?? matchingItem.price,
                beginning_inventory: begInv,
                purchases: purch,
                // Include beginning_inventory_unit_price for FIFO calculation
                beginning_inventory_unit_price:
                  variationData?.beginning_inventory_unit_price !== undefined &&
                  variationData?.beginning_inventory_unit_price !== null
                    ? Number(variationData.beginning_inventory_unit_price)
                    : matchingItem.beginning_inventory_unit_price,
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
              // Same item with duplicate size (e.g. two "Small" in note.sizeVariations) -> merge stock and purchases
              if (existingVariation.id === variation.id) {
                const begInv = Number(existingVariation.beginning_inventory) || 0;
                existingVariation.stock = (Number(existingVariation.stock) || 0) + (Number(variation.stock) || 0);
                existingVariation.purchases = (Number(existingVariation.purchases) || 0) + (Number(variation.purchases) || 0);
                // Keep display consistent: purchases = stock - beginning_inventory when we merged
                const combinedStock = Number(existingVariation.stock) || 0;
                existingVariation.purchases = Math.max(0, combinedStock - begInv);
                console.log(
                  `[useItemDetailsModal] ✅ Merged duplicate size (same ID): ${variation.name} ${rawSize} -> stock=${existingVariation.stock}, purchases=${existingVariation.purchases}`
                );
              } else {
                // Different items with same size - keep the first one
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
   * When allItems changes while the modal is open (e.g. after an item edit),
   * refetch variations so the new sizes show without closing/reopening.
   */
  useEffect(() => {
    if (isOpen && selectedItem && allItems?.length) {
      fetchVariations(selectedItem);
    }
  }, [allItems, isOpen, selectedItem, fetchVariations]);

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
   * Calculate total cost summary using FIFO (First In, First Out).
   * Formula: (beginning_inventory * beginning_unit_price) + (purchases * purchase_price)
   * If beginning_inventory_unit_price is not available, use current price as fallback for both.
   */
  const totalCostSummary = useMemo(() => {
    if (!variations.length) return 0;
    return variations.reduce((total, v) => {
      const beginningInventory = Number(v.beginning_inventory) || 0;
      const purchases = Number(v.purchases) || 0;
      const currentPrice = Number(v.price) || 0;
      
      // Get beginning_inventory_unit_price with proper fallback
      let beginningUnitPrice = Number(v.beginning_inventory_unit_price);
      if (isNaN(beginningUnitPrice) || beginningUnitPrice === 0) {
        beginningUnitPrice = currentPrice || 0;
      }
      const purchaseUnitPrice = currentPrice || 0;
      
      // Ensure all values are valid numbers before calculation
      if (isNaN(beginningInventory) || isNaN(purchases) || 
          isNaN(beginningUnitPrice) || isNaN(purchaseUnitPrice)) {
        return total; // Skip invalid variations
      }
      
      // FIFO calculation: (beginning_inventory * beginning_unit_price) + (purchases * purchase_unit_price)
      const variationCost = (beginningInventory * beginningUnitPrice) + (purchases * purchaseUnitPrice);
      return total + (isNaN(variationCost) ? 0 : variationCost);
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
