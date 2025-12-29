/**
 * Group Items by Variations
 * 
 * Groups items that have the same name and item_type but different sizes
 * into a single grouped item with variations.
 * 
 * IMPORTANT: Items with the same name+size but different IDs (duplicates) are NOT grouped.
 * Only items with different sizes are grouped together.
 * 
 * @param {Array} items - Array of items
 * @returns {Array} Array of grouped items with variations
 */
export const groupItemsByVariations = (items) => {
  if (!items || items.length === 0) {
    return [];
  }

  console.log(`[groupItemsByVariations] Processing ${items.length} items`);
  
  // Create a map to group items by name, item_type, and size
  // Items with same name+size but different IDs will NOT be grouped
  const groupedMap = new Map();

  items.forEach((item) => {
    // Get item name and type (handle both item_type and itemType)
    const name = item.name || "Unknown Item";
    const itemType = item.item_type || item.itemType || "Uniform";
    const educationLevel = item.educationLevel || item.education_level || "General";
    const image = item.image || null;
    const category = item.category || "General";
    const size = (item.size || "N/A").trim();
    const itemId = item.id;

    // IMPORTANT: Items with same name+size but different IDs should NOT be grouped
    // Only group items that have DIFFERENT sizes
    // Strategy: Check if there's an existing group with same name+type but different size
    
    // First, try to find a group with same name+type but different size
    // We'll check the group's variations to determine name+type instead of parsing the key
    let existingGroupKey = null;
    for (const [key, group] of groupedMap.entries()) {
      // Check if this group has the same name and type
      const groupName = group.name || "Unknown Item";
      const groupItemType = group.itemType || "Uniform";
      
      if (groupName === name && groupItemType === itemType) {
        // Same name+type, now check if sizes are different
        // Check if this group already has an item with the current size
        const hasThisSize = group.variations.some(v => {
          const vSize = (v.size || "N/A").trim().toLowerCase();
          const currentSize = size.toLowerCase();
          return vSize === currentSize;
        });
        
        // Also check if this group already has an item with the same ID (shouldn't happen, but safety check)
        const hasThisId = group.variations.some(v => v.id === itemId);
        
        // Only group if sizes are different and ID is not already in group
        if (!hasThisSize && !hasThisId) {
          existingGroupKey = key;
          break;
        }
      }
    }

    if (existingGroupKey) {
      // Add to existing group (different size, same name+type)
      const group = groupedMap.get(existingGroupKey);
      group.variations.push({
        ...item, // Keep all original properties including purchases, beginning_inventory
      });

      // Update total stock (for display purposes only)
      const itemStock = Number(item.stock) || 0;
      group.totalStock += itemStock;
      group.stock = group.totalStock;
      
      console.log(`[groupItemsByVariations] Added to existing group: ${name} - ${size} (ID: ${itemId})`);
    } else {
      // Create new group - this item will be its own group
      // Items with same name+size but different IDs will each have their own group
      // This ensures duplicates are kept separate
      const groupKey = `${name}-${itemType}-${size}-${itemId}`;
      console.log(`[groupItemsByVariations] Creating new group for: ${name} - ${size} (ID: ${itemId})`);
      groupedMap.set(groupKey, {
        groupKey,
        name,
        itemType,
        educationLevel,
        image,
        category,
        variations: [{
          ...item, // Keep all original properties including purchases, beginning_inventory
        }],
        totalStock: Number(item.stock) || 0,
        // Representative item data
        id: item.id,
        stock: Number(item.stock) || 0,
        price: item.price || 0,
        description: item.description,
        description_text: item.description_text,
        material: item.material,
        status: item.status,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      });
    }

    // Update representative image if current item has one and group doesn't
    const finalGroupKey = existingGroupKey || `${name}-${itemType}-${size}-${itemId}`;
    const group = groupedMap.get(finalGroupKey);
    if (!group.image && image) {
      group.image = image;
    }
  });

  // Convert map to array and sort variations by size
  const result = Array.from(groupedMap.values()).map((group) => {
    // Sort variations by size (alphabetically)
    group.variations.sort((a, b) => {
      const sizeA = a.size || "";
      const sizeB = b.size || "";
      return sizeA.localeCompare(sizeB);
    });
    return group;
  });
  
  console.log(`[groupItemsByVariations] Created ${result.length} groups from ${items.length} items`);
  result.forEach((group, idx) => {
    console.log(`[groupItemsByVariations] Group ${idx + 1}: "${group.name}" has ${group.variations.length} variation(s)`, 
      group.variations.map(v => ({ id: v.id, size: v.size, stock: v.stock, purchases: v.purchases || 0 }))
    );
  });
  
  return result;
};

