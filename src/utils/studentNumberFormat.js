/**
 * Student number format: YY-NNNNNIII
 *
 * - YY: 2-digit school year (e.g., 22 for 2022–2023)
 * - NNNNN: 5-digit enrollment number (zero-padded, e.g., 00023)
 * - III: 3 letters = initials (First, Middle, Last name), e.g., Rafael S Ramos → RSR
 *
 * Example: 22-00023RSR
 */

export const STUDENT_NUMBER_PATTERN = /^\d{2}-\d{5}[A-Za-z]{3}$/;

/** Placeholder / example for the input */
export const STUDENT_NUMBER_PLACEHOLDER = "22-00023RSR";

/** Short hint for the input (pattern description) */
export const STUDENT_NUMBER_FORMAT_HINT =
  "Format: YY-NNNNNIII (e.g. 22 = school year, 00023 = enrollment no., RSR = your initials: First, Middle, Last)";

/**
 * Get suggested 3-letter initials from full name (First, Middle, Last).
 * "Rafael S Ramos" → "RSR"
 * "Juan Dela Cruz" → "JDC" (first, first of "Dela", first of "Cruz" = J, D, C)
 * @param {string} fullName
 * @returns {string} 3 uppercase letters or empty string
 */
export function getSuggestedInitials(fullName) {
  if (!fullName || typeof fullName !== "string") return "";
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  if (parts.length === 2) {
    const a = parts[0].charAt(0).toUpperCase();
    const b = parts[1].charAt(0).toUpperCase();
    return a + b + b; // First, Last, Last (e.g. "Rafael Ramos" → RRR)
  }
  // 3+ parts: first, middle (second), last (e.g. "Rafael S Ramos" → RSR)
  const f = parts[0].charAt(0).toUpperCase();
  const m = parts[1].charAt(0).toUpperCase();
  const l = parts[parts.length - 1].charAt(0).toUpperCase();
  return f + m + l;
}

/**
 * Validate student number against YY-NNNNNIII.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidStudentNumber(value) {
  if (!value || typeof value !== "string") return false;
  return STUDENT_NUMBER_PATTERN.test(value.trim());
}

/**
 * Normalize input: trim, optionally uppercase the 3-letter suffix.
 * Does not change structure (e.g. does not add hyphen).
 * @param {string} value
 * @returns {string}
 */
export function normalizeStudentNumber(value) {
  if (!value || typeof value !== "string") return "";
  const s = value.trim();
  if (!s) return "";
  const match = s.match(/^(\d{2})-?(\d{5})([A-Za-z]{3})$/);
  if (match) {
    const [, yy, num, letters] = match;
    return `${yy}-${num}${letters.toUpperCase()}`;
  }
  return s;
}

/**
 * Determine student type (old/new) based on student number year.
 * Extracts the 2-digit year prefix (YY) from format YY-NNNNNIII,
 * converts to full year (20YY), and compares with current year.
 * Returns "old" if year < current year, "new" if year >= current year.
 * 
 * @param {string} studentNumber - Student number in format YY-NNNNNIII
 * @returns {string|null} - "old", "new", or null if invalid
 */
export function getStudentTypeFromStudentNumber(studentNumber) {
  if (!studentNumber || typeof studentNumber !== "string") return null;
  
  // Try to extract year prefix even if not fully formatted yet
  // This allows real-time detection as user types (e.g., "22" or "22-")
  const trimmed = studentNumber.trim();
  if (!trimmed) return null;
  
  // Match YY at the start, optionally followed by hyphen and more characters
  const yearMatch = trimmed.match(/^(\d{2})/);
  if (!yearMatch) return null;
  
  const yearPrefix = parseInt(yearMatch[1], 10);
  if (isNaN(yearPrefix) || yearPrefix < 0 || yearPrefix > 99) return null;
  
  const fullYear = 2000 + yearPrefix; // 22 -> 2022, 26 -> 2026
  const currentYear = new Date().getFullYear(); // e.g., 2026
  
  return fullYear < currentYear ? "old" : "new";
}