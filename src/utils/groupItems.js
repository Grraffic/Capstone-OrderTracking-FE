/**
 * Group Items by Variations
 * 
 * Groups items that have the same name and item_type but different sizes
 * into a single grouped item with variations.
 * 
 * @param {Array} items - Array of items
 * @returns {Array} Array of grouped items with variations
 */
export const groupItemsByVariations = (items) => {
  if (!items || items.length === 0) {
    return [];
  }

  // Create a map to group items by name and item_type
  const groupedMap = new Map();

  items.forEach((item) => {
    // Get item name and type (handle both item_type and itemType)
    const name = item.name || "Unknown Item";
    const itemType = item.item_type || item.itemType || "Uniform";
    const educationLevel = item.educationLevel || item.education_level || "General";
    const image = item.image || null;
    const category = item.category || "General";

    // Create a unique key for grouping (name + item_type)
    const groupKey = `${name}-${itemType}`;

    if (!groupedMap.has(groupKey)) {
      // Create new group with first item as representative
      groupedMap.set(groupKey, {
        groupKey,
        name,
        itemType,
        educationLevel,
        image,
        category,
        variations: [],
        totalStock: 0,
        // Representative item data (from first variation)
        id: item.id,
        stock: 0, // Will be calculated as total
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

    // Add this item as a variation
    const group = groupedMap.get(groupKey);
    group.variations.push({
      ...item, // Keep all original properties
    });

    // Update total stock
    const itemStock = Number(item.stock) || 0;
    group.totalStock += itemStock;
    group.stock = group.totalStock; // Update representative stock

    // Update representative image if current item has one and group doesn't
    if (!group.image && image) {
      group.image = image;
    }
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

