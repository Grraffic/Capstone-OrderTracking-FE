import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * useInventoryHealthStats Hook
 * 
 * Fetches all items and calculates inventory health statistics:
 * - Total Item Variants (counting all size variations)
 * - At Reorder Point (stock 20-49)
 * - Out of Stock (stock = 0)
 * 
 * This ensures consistent stats across all pages (Dashboard, Items, Inventory)
 * 
 * @returns {Object} { stats, loading } - stats object with totalItemVariants, atReorderPoint, outOfStock
 */
export const useInventoryHealthStats = () => {
  const [stats, setStats] = useState({
    totalItemVariants: 0,
    atReorderPoint: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventoryStats = async () => {
      try {
        setLoading(true);
        // Fetch all items to calculate stats including variants
        const params = new URLSearchParams({
          limit: "1000", // Fetch all items
        });
        const response = await fetch(`${API_BASE_URL}/items?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch items");
        
        const result = await response.json();
        if (result.success && result.data) {
          let totalItemVariants = 0;
          let atReorderPoint = 0;
          let outOfStock = 0;
          
          // Group items by name and item_type (same as Items page does)
          // This ensures we count grouped items, not individual size rows
          const groupedItemsMap = new Map();
          
          result.data.forEach((item) => {
            // Create a unique key for grouping (name + item_type)
            const groupKey = `${item.name || ''}_${item.item_type || ''}`;
            
            if (!groupedItemsMap.has(groupKey)) {
              groupedItemsMap.set(groupKey, []);
            }
            groupedItemsMap.get(groupKey).push(item);
          });
          
          // Process each grouped item (counts as one variant, matches Items list)
          groupedItemsMap.forEach((itemsInGroup) => {
            totalItemVariants++;
            
            // Use the first item in the group for checking JSON variations
            const firstItem = itemsInGroup[0];
            let hasJsonVariations = false;
            let sizeVariations = [];
            
            if (firstItem.note) {
              try {
                const parsedNote = JSON.parse(firstItem.note);
                if (
                  parsedNote &&
                  parsedNote._type === "sizeVariations" &&
                  Array.isArray(parsedNote.sizeVariations)
                ) {
                  hasJsonVariations = true;
                  sizeVariations = parsedNote.sizeVariations;
                }
              } catch {
                // Not JSON, continue with regular processing
              }
            }
            
            if (hasJsonVariations && sizeVariations.length > 0) {
              // For items with size variations, check each size for stock status
              let itemOutOfStock = true;
              let itemAtReorderPoint = false;
              
              sizeVariations.forEach((variant) => {
                const variantStock = Number(variant.stock) || 0;
                
                if (variantStock > 0) {
                  itemOutOfStock = false;
                }
                if (variantStock >= 20 && variantStock < 50) {
                  itemAtReorderPoint = true;
                }
              });
              
              if (itemOutOfStock) {
                outOfStock++;
              } else if (itemAtReorderPoint) {
                atReorderPoint++;
              }
            } else {
              // Regular item - check stock from all items in group
              // Item is out of stock if ALL sizes are out of stock
              // Item is at reorder point if ANY size is at reorder point
              let allOutOfStock = true;
              let anyAtReorderPoint = false;
              
              itemsInGroup.forEach((item) => {
                const itemStock = Number(item.stock) || 0;
                
                if (itemStock > 0) {
                  allOutOfStock = false;
                }
                if (itemStock >= 20 && itemStock < 50) {
                  anyAtReorderPoint = true;
                }
              });
              
              if (allOutOfStock) {
                outOfStock++;
              } else if (anyAtReorderPoint) {
                atReorderPoint++;
              }
            }
          });
          
          setStats({
            totalItemVariants,
            atReorderPoint,
            outOfStock,
          });
          
          console.log(`[InventoryHealth] Stats calculated:`, {
            totalItemVariants,
            atReorderPoint,
            outOfStock,
          });
        }
      } catch (error) {
        console.error("Error fetching inventory health stats:", error);
        setStats({
          totalItemVariants: 0,
          atReorderPoint: 0,
          outOfStock: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryStats();
  }, []);

  return { stats, loading };
};


