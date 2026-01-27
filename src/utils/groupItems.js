/**
 * Group Items by Variations
 * 
 * Groups items that have the same name and item_type but different sizes
 * into a single grouped item with variations.
 * 
 * IMPORTANT: Items with the same name+size but different IDs (duplicates) are NOT grouped.
 * Only items with different sizes are grouped together.
 * 
 * NOTE: This function assumes items have already been filtered by education level.
 * Items passed to this function should all match the selected education level filter.
 * 
 * @param {Array} items - Array of items (should already be filtered by education level)
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
    
    // First, try to find a group with same name+type but different size or education level
    // We'll check the group's variations to determine name+type instead of parsing the key
    // IMPORTANT: Group items by name+type only, ignoring education level to combine items
    // with same name but different education levels (e.g., "Jogging Pants" for College and Pre-Kindergarten)
    let existingGroupKey = null;
    for (const [key, group] of groupedMap.entries()) {
      // Check if this group has the same name and type (ignore education level)
      const groupName = group.name || "Unknown Item";
      const groupItemType = group.itemType || "Uniform";
      
      if (groupName === name && groupItemType === itemType) {
        // Same name+type, now check if this is a unique variation
        // A variation is unique if it has a different size OR different education level
        // Check if this group already has an item with the same size AND education level
        const hasThisVariation = group.variations.some(v => {
          const vSize = (v.size || "N/A").trim().toLowerCase();
          const vEducationLevel = (v.educationLevel || v.education_level || "N/A").trim().toLowerCase();
          const currentSize = size.toLowerCase();
          const currentEducationLevel = (educationLevel || "N/A").trim().toLowerCase();
          return vSize === currentSize && vEducationLevel === currentEducationLevel;
        });
        
        // Also check if this group already has an item with the same ID (shouldn't happen, but safety check)
        const hasThisId = group.variations.some(v => v.id === itemId);
        
        // Only group if this is a unique variation (different size or education level) and ID is not already in group
        if (!hasThisVariation && !hasThisId) {
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
      // Use name+type as the key (ignore size and education level) to combine items with same name
      // Items with same name+type but different sizes/education levels will be grouped together
      const groupKey = `${name}-${itemType}`;
      console.log(`[groupItemsByVariations] Creating new group for: ${name} - ${itemType} (ID: ${itemId})`);
      groupedMap.set(groupKey, {
        groupKey,
        name,
        itemType,
        educationLevel, // Keep first education level as representative
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
    const finalGroupKey = existingGroupKey || `${name}-${itemType}`;
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
    
    // Update representative education level to show the first variation's education level
    // This helps with display, but all variations are still accessible
    if (group.variations.length > 0) {
      group.educationLevel = group.variations[0].educationLevel || group.variations[0].education_level || group.educationLevel;
    }
    
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

