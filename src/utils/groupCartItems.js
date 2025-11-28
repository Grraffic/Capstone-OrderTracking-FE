/**
 * Group Cart Items by Variations
 * 
 * Groups cart items that have the same name and item_type but different sizes
 * into a single grouped item with variations.
 * 
 * @param {Array} items - Array of cart items with inventory details
 * @returns {Array} Array of grouped items with variations
 */
export const groupCartItemsByVariations = (items) => {
  if (!items || items.length === 0) {
    return [];
  }

  // Create a map to group items by name and item_type
  const groupedMap = new Map();

  items.forEach((item) => {
    // Get item name and type (handle both item_type and itemType)
    const name = item.inventory?.name || item.name || "Unknown Item";
    const itemType = item.inventory?.item_type || item.inventory?.itemType || "Uniform";
    const educationLevel = item.inventory?.education_level || item.inventory?.educationLevel || "General";
    const image = item.inventory?.image || item.image || null;

    // Create a unique key for grouping (name + item_type)
    const groupKey = `${name}-${itemType}`;

    if (!groupedMap.has(groupKey)) {
      // Create new group
      groupedMap.set(groupKey, {
        groupKey,
        name,
        itemType,
        educationLevel,
        image,
        variations: [],
        totalQuantity: 0,
      });
    }

    // Add this item as a variation
    const group = groupedMap.get(groupKey);
    group.variations.push({
      id: item.id,
      size: item.size || "N/A",
      quantity: item.quantity || 1,
      inventoryId: item.inventoryId || item.inventory?.id,
      userId: item.userId || item.user_id,
      createdAt: item.createdAt || item.created_at,
      updatedAt: item.updatedAt || item.updated_at,
      inventory: item.inventory, // Keep full inventory reference
    });

    // Update total quantity
    group.totalQuantity += item.quantity || 1;
  });

  // Convert map to array and sort variations by size
  return Array.from(groupedMap.values()).map((group) => {
    // Sort variations by size (alphabetically)
    group.variations.sort((a, b) => {
      const sizeA = a.size || "";
      const sizeB = b.size || "";
      return sizeA.localeCompare(sizeB);
    });
    return group;
  });
};

/**
 * Ungroup cart items back to original format
 * 
 * Flattens grouped items back to individual cart items for operations
 * like checkout submission.
 * 
 * @param {Array} groupedItems - Array of grouped items with variations
 * @returns {Array} Array of individual cart items
 */
export const ungroupCartItems = (groupedItems) => {
  if (!groupedItems || groupedItems.length === 0) {
    return [];
  }

  const flatItems = [];
  groupedItems.forEach((group) => {
    group.variations.forEach((variation) => {
      flatItems.push({
        id: variation.id,
        inventoryId: variation.inventoryId,
        size: variation.size,
        quantity: variation.quantity,
        userId: variation.userId,
        createdAt: variation.createdAt,
        updatedAt: variation.updatedAt,
        inventory: variation.inventory,
      });
    });
  });

  return flatItems;
};

