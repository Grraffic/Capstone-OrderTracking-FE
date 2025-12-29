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
          
          // Process each item
          result.data.forEach((item) => {
            // Skip inactive items
            if (item.is_active === false) return;
            
            // Check if item has JSON size variations in note field
            let hasJsonVariations = false;
            let sizeVariations = [];
            
            if (item.note) {
              try {
                const parsedNote = JSON.parse(item.note);
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
              // Count each size variation
              sizeVariations.forEach((variant) => {
                totalItemVariants++;
                const variantStock = Number(variant.stock) || 0;
                
                if (variantStock === 0) {
                  outOfStock++;
                } else if (variantStock >= 20 && variantStock < 50) {
                  // At Reorder Point: stock between 20-49
                  atReorderPoint++;
                }
              });
            } else {
              // Regular item - count as one variant
              totalItemVariants++;
              const itemStock = Number(item.stock) || 0;
              
              if (itemStock === 0) {
                outOfStock++;
              } else if (itemStock >= 20 && itemStock < 50) {
                // At Reorder Point: stock between 20-49
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

