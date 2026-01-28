/**
 * Master list of all uniform item names (deduplicated, correct names and Pascal case).
 * Used for Add Item name suggestions in Property Custodian.
 * Keep in sync with backend src/config/itemMasterList.js.
 *
 * Source: Preschool, Elementary, JHS, SHS, College.
 */
export const ITEM_MASTER_LIST = [
  "Kinder Dress",
  "Kinder Necktie",
  "ID Lace",
  "Short",
  "Polo Jacket",
  "Elementary Skirt",
  "Elementary Blouse",
  "Ordinary Necktie",
  "Jersey",
  "Jogging Pants",
  "Number Patch",
  "JHS skirt",
  "JHS blouse",
  "Logo Patch",
  "SHS Skirt",
  "SHS Blouse",
  "Necktie Girls",
  "SHS Pants",
  "SHS Long-Sleeve",
  "Necktie Boys",
  "College Skirt",
  "College Blouse",
  "Pants",
  "Polo straight",
];

/**
 * Item name suggestions per education level (for easy find/complete).
 * Shown exactly as listed so users can easily find or complete the name.
 * Keys match EDUCATION_LEVELS value (Kindergarten, Elementary, etc.).
 */
export const EDUCATION_LEVEL_ITEM_NAMES = {
  Kindergarten: [
    "Kinder Dress",
    "Kinder Necktie",
    "ID Lace",
    "Short",
    "Polo Jacket",
  ],
  Elementary: [
    "Elementary Skirt",
    "Elementary Blouse",
    "Ordinary Necktie",
    "Jersey",
    "Jogging Pants",
    "ID Lace",
    "Number Patch",
    "Short",
    "Polo Jacket",
  ],
  "Junior High School": [
    "JHS skirt",
    "JHS blouse",
    "Ordinary Necktie",
    "Jersey",
    "Jogging Pants",
    "ID Lace",
    "Logo Patch",
    "Number patch",
    "Short",
    "Polo Jacket",
  ],
  "Senior High School": [
    "SHS Skirt",
    "SHS Blouse",
    "Necktie Girls",
    "Jersey",
    "Jogging Pants",
    "ID Lace",
    "Logo Patch",
    "Number Patch",
    "SHS Pants",
    "SHS Long-Sleeve",
    "Necktie Boys",
  ],
  College: [
    "College Skirt",
    "College Blouse",
    "Ordinary Necktie",
    "Jersey",
    "Jogging Pants",
    "ID Lace",
    "Logo Patch",
    "Pants",
    "Polo straight",
  ],
};

/** Label for “suggestions for” hint (education level → short label) */
export const EDUCATION_LEVEL_LABELS = {
  Kindergarten: "Preschool",
  Elementary: "Elementary",
  "Junior High School": "Junior High",
  "Senior High School": "Senior High",
  College: "College",
};
