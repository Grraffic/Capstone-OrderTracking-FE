/**
 * Shared Size Measurements Utility
 * 
 * Provides consistent size measurements across the application.
 * Used by both ItemVariantEditModal (admin) and SizeSelector (student).
 */

/**
 * Size measurements mapping
 * Format: { chest: { min, max, minCm, maxCm }, length: { min, max, minCm, maxCm } }
 */
export const SIZE_MEASUREMENTS = {
  XS: {
    chest: { min: 30, max: 32, minCm: 76, maxCm: 81 },
    length: { min: 23, max: 25, minCm: 58, maxCm: 64 },
    displayName: "Extra Small (XS)",
  },
  S: {
    chest: { min: 32, max: 34, minCm: 81, maxCm: 86 },
    length: { min: 24, max: 26, minCm: 61, maxCm: 66 },
    displayName: "Small (S)",
  },
  M: {
    chest: { min: 36, max: 38, minCm: 91, maxCm: 97 },
    length: { min: 27, max: 29, minCm: 69, maxCm: 74 },
    displayName: "Medium (M)",
  },
  L: {
    chest: { min: 40, max: 42, minCm: 102, maxCm: 107 },
    length: { min: 29, max: 31, minCm: 74, maxCm: 79 },
    displayName: "Large (L)",
  },
  XL: {
    chest: { min: 44, max: 46, minCm: 112, maxCm: 117 },
    length: { min: 31, max: 33, minCm: 79, maxCm: 84 },
    displayName: "Extra Large (XL)",
  },
  "2XL": {
    chest: { min: 48, max: 50, minCm: 122, maxCm: 127 },
    length: { min: 33, max: 35, minCm: 84, maxCm: 89 },
    displayName: "2XL",
  },
  XXL: {
    chest: { min: 48, max: 50, minCm: 122, maxCm: 127 },
    length: { min: 33, max: 35, minCm: 84, maxCm: 89 },
    displayName: "2XL",
  },
};

/**
 * Get size guide text for ItemVariantEditModal
 * Returns formatted text like: "Medium (M)\nChest: 36–38 in / 91–97 cm; Shirt Length: 27–29 in / 69–74 cm"
 */
export const getSizeGuideNote = (rawSize) => {
  if (!rawSize) return "";
  const size = String(rawSize).toLowerCase();

  // Map size strings to keys
  let sizeKey = null;
  if (size.includes("xs") || size.includes("extra small")) {
    sizeKey = "XS";
  } else if (size.includes("2xl") || size.includes("xxl") || size.includes("2x")) {
    sizeKey = "2XL";
  } else if (size.includes("xl") || size.includes("extra large")) {
    sizeKey = "XL";
  } else if (size.includes("l") && !size.includes("xl")) {
    sizeKey = "L";
  } else if (size.includes("m")) {
    sizeKey = "M";
  } else if (size.includes("s")) {
    sizeKey = "S";
  }

  if (!sizeKey || !SIZE_MEASUREMENTS[sizeKey]) return "";

  const measurements = SIZE_MEASUREMENTS[sizeKey];
  return `${measurements.displayName}\nChest: ${measurements.chest.min}–${measurements.chest.max} in / ${measurements.chest.minCm}–${measurements.chest.maxCm} cm; Shirt Length: ${measurements.length.min}–${measurements.length.max} in / ${measurements.length.minCm}–${measurements.length.maxCm} cm`;
};

/**
 * Get size measurements object for SizeSelector
 * Returns object with chest and length in both inches and cm
 */
export const getSizeMeasurements = (sizeKey) => {
  if (!sizeKey) return null;
  
  const size = String(sizeKey).toLowerCase().trim();
  
  // Map full names and variations to keys
  if (size.includes("xs") || size.includes("extra small") || size.includes("xsmall")) {
    return SIZE_MEASUREMENTS["XS"];
  }
  if (size.includes("2xl") || size.includes("xxl") || size.includes("2x") || size.includes("2xlarge")) {
    return SIZE_MEASUREMENTS["2XL"];
  }
  if (size.includes("xl") || size.includes("extra large") || size.includes("xlarge")) {
    // Check for 2XL first, then XL
    if (size.includes("2xl") || size.includes("xxl") || size.includes("2x")) {
      return SIZE_MEASUREMENTS["2XL"];
    }
    return SIZE_MEASUREMENTS["XL"];
  }
  if (size.includes("l") && !size.includes("xl") && size !== "small") {
    return SIZE_MEASUREMENTS["L"];
  }
  if (size.includes("m") || size === "medium") {
    return SIZE_MEASUREMENTS["M"];
  }
  if (size.includes("s") || size === "small") {
    return SIZE_MEASUREMENTS["S"];
  }
  
  // Try direct match with uppercase
  const normalized = size.toUpperCase();
  if (normalized === "XXL" || normalized === "2X") {
    return SIZE_MEASUREMENTS["2XL"];
  }
  
  return SIZE_MEASUREMENTS[normalized] || null;
};

/**
 * Format size display name
 */
export const getSizeDisplayName = (sizeKey) => {
  const measurements = getSizeMeasurements(sizeKey);
  if (measurements) {
    return measurements.displayName;
  }
  return sizeKey;
};
