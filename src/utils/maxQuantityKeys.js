/**
 * Shared util for resolving item names to the keys used by GET /auth/max-quantities.
 * Must stay in sync with backend itemMaxOrder.js ITEM_ALIASES and resolveItemKey.
 * Alias keys match the Max Per Item spec (Preschool/Elementary/JHS/SHS/College × New/Old × Girls/Boys).
 */

/** Default max when API/profile hasn't supplied a limit. Every item has a max; use 1 to be conservative. */
export const DEFAULT_MAX_WHEN_UNKNOWN = 1;

/** Logo patch max per student per spec. (Both "logo patch" and "new logo patch" are the same item.) */
export const LOGO_PATCH_MAX_PER_STUDENT = 3;

/**
 * Default max quantity for an item when API hasn't supplied a limit.
 * Logo patch only: 3 per student; all other items: 1.
 * @param {string} name - Item display name
 * @returns {number}
 */
export function getDefaultMaxForItem(name) {
  const n = normalizeItemName(name || "");
  // Both "logo patch" and "new logo patch" are the same item
  return n.includes("logo patch")
    ? LOGO_PATCH_MAX_PER_STUDENT
    : DEFAULT_MAX_WHEN_UNKNOWN;
}

/**
 * Default max by canonical item key (from resolveItemKeyForMaxQuantity).
 * Logo patch: 3; all others: 1.
 * @param {string} key - Canonical key (e.g. "logo patch", "jogging pants")
 * @returns {number}
 */
export function getDefaultMaxByKey(key) {
  return key === "logo patch" ? LOGO_PATCH_MAX_PER_STUDENT : DEFAULT_MAX_WHEN_UNKNOWN;
}

export function normalizeItemName(name) {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Map display-name and DB variants to canonical keys returned by GET /auth/max-quantities */
const ITEM_ALIASES_FOR_MAX_QUANTITY = {
  "shorts": "short",
  "jogging pants (kindergarten)": "jogging pants",
  "jogging pants - kindergarten": "jogging pants",
  "jogging pants (preschool)": "jogging pants",
  "jogging pants - preschool": "jogging pants",
  "jogging pants (elementary)": "jogging pants",
  "jogging pants - elementary": "jogging pants",
  "jogging pants (junior high school)": "jogging pants",
  "jogging pants - junior high school": "jogging pants",
  "jogging pants (senior high school)": "jogging pants",
  "jogging pants - senior high school": "jogging pants",
  "jogging pants (college)": "jogging pants",
  "jogging pants - college": "jogging pants",
  "jogging pants (prekindergarten)": "jogging pants",
  "jogging pants - prekindergarten": "jogging pants",
  "small jogging pants": "jogging pants",
  "medium jogging pants": "jogging pants",
  "large jogging pants": "jogging pants",
  "prekindergarten jogging pants": "jogging pants",
  "logo patch (kindergarten)": "logo patch",
  "logo patch - kindergarten": "logo patch",
  "logo patch (preschool)": "logo patch",
  "logo patch - preschool": "logo patch",
  "logo patch (prekindergarten)": "logo patch",
  "logo patch - prekindergarten": "logo patch",
  "logo patch (elementary)": "logo patch",
  "logo patch - elementary": "logo patch",
  "logo patch (junior high school)": "logo patch",
  "logo patch (senior high school)": "logo patch",
  "logo patch (college)": "logo patch",
  // All "new logo patch" variants map to "logo patch" (same item as "logo patch")
  "new logo patch": "logo patch",
  "new logo patch (kindergarten)": "logo patch",
  "new logo patch - kindergarten": "logo patch",
  "new logo patch (preschool)": "logo patch",
  "new logo patch - preschool": "logo patch",
  "new logo patch (prekindergarten)": "logo patch",
  "new logo patch - prekindergarten": "logo patch",
  "new logo patch (elementary)": "logo patch",
  "new logo patch - elementary": "logo patch",
  "new logo patch (junior high school)": "logo patch",
  "new logo patch - junior high school": "logo patch",
  "new logo patch (senior high school)": "logo patch",
  "new logo patch - senior high school": "logo patch",
  "new logo patch (college)": "logo patch",
  "new logo patch - college": "logo patch",
  "kinder dress (kindergarten)": "kinder dress",
  "kinder dress - kindergarten": "kinder dress",
  "kinder necktie (kindergarten)": "kinder necktie",
  "elem skirt (elementary)": "elem skirt",
  "elem blouse (elementary)": "elem blouse",
  "jhs skirt (junior high school)": "jhs skirt",
  "jhs blouse (junior high school)": "jhs blouse",
  "shs skirt (senior high school)": "shs skirt",
  "shs blouse (senior high school)": "shs blouse",
  "shs pants (senior high school)": "shs pants",
  "shs long-sleeve (senior high school)": "shs long-sleeve",
  "college skirt (college)": "college skirt",
  "college blouse (college)": "college blouse",
  "polo straight (college)": "polo straight",
  "polo jacket (kindergarten)": "polo jacket",
  "id lace (kindergarten)": "id lace",
  "id lace (elementary)": "id lace",
  "id lace (junior high school)": "id lace",
  "id lace (senior high school)": "id lace",
  "id lace (college)": "id lace",
  "elementary skirt": "elem skirt",
  "elementary blouse": "elem blouse",
  "junior high skirt": "jhs skirt",
  "junior high blouse": "jhs blouse",
  "senior high skirt": "shs skirt",
  "senior high blouse": "shs blouse",
  "senior high pants": "shs pants",
  "senior high long-sleeve": "shs long-sleeve",
  "kindergarten jogging pants": "jogging pants",
  "preschool jogging pants": "jogging pants",
  "elementary jogging pants": "jogging pants",
  "junior high school jogging pants": "jogging pants",
  "senior high school jogging pants": "jogging pants",
  "college jogging pants": "jogging pants",
  "necktie (girls)": "necktie girls",
  "necktie (boys)": "necktie boys",
  "number patch (grade level)": "number patch",
  "number patch (per grade)": "number patch",
  "jersey": "jersey",
  "pe jersey": "jersey",
  "jersey (kindergarten)": "jersey",
  "jersey (preschool)": "jersey",
  "id lace (preschool)": "id lace",
};

/**
 * Resolve item name to the key used by GET /auth/max-quantities.
 * @param {string} name - Item name (e.g. "Shorts", "Kinder dress (Kindergarten)")
 * @returns {string} Canonical key (e.g. "short", "kinder dress")
 */
export function resolveItemKeyForMaxQuantity(name) {
  const n = normalizeItemName(name);
  // Any "X Jogging Pants" (e.g. "Small Jogging Pants") counts as "jogging pants" for limits
  if (n && n.includes("jogging pants")) return "jogging pants";
  // "New Logo Patch" and "Logo Patch" are the SAME item - always normalize to "logo patch"
  // The "new" is just text, they're identical items (matches backend itemMaxOrder.js)
  if (n && (n.includes("new logo patch") || n.includes("logo patch"))) return "logo patch";
  return ITEM_ALIASES_FOR_MAX_QUANTITY[n] ?? n;
}
