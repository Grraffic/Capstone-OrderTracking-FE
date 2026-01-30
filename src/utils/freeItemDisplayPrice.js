/**
 * Display price for free items (e.g. Logo Patch) when stored price is 0.
 * Used so we can show the product price with strikethrough above "Free" in cart and orders.
 */

function normalizeForMatch(name) {
  return (name || "").toLowerCase().trim();
}

/**
 * Whether the item is a known free item that should show a product price above "Free".
 * @param {string} itemName
 * @returns {boolean}
 */
export function isFreeItemWithDisplayPrice(itemName) {
  const n = normalizeForMatch(itemName);
  return n.includes("logo patch");
}

/**
 * Default display price (PHP) for free items like Logo Patch when stored price is 0.
 * Admin can set the product price in the item master; when set, cart/orders use it.
 * This fallback is used only when the stored price is 0 so strikethrough still shows.
 */
export const FREE_ITEM_DISPLAY_PRICE_DEFAULT = 50;

/**
 * Get the price to display above "Free" (strikethrough) for an item.
 * Uses stored price when > 0; for free items (e.g. logo patch) with price 0, returns a default.
 * @param {string} itemName - Item name (e.g. "Logo Patch", "New Logo Patch (College)")
 * @param {number} storedPrice - Price from cart/order/item (may be 0)
 * @returns {number} Price to use for display (strikethrough)
 */
export function getDisplayPriceForFreeItem(itemName, storedPrice) {
  const num = Number(storedPrice);
  if (num > 0) return num;
  if (isFreeItemWithDisplayPrice(itemName)) return FREE_ITEM_DISPLAY_PRICE_DEFAULT;
  return 0;
}
