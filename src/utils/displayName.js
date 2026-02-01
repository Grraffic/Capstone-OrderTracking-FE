/**
 * Split full name for display: handles "Rafael Ramos" (space) and "leorenzbien.rodriguez" (dot).
 * For names with 3+ words (e.g., "Leorenz bien rodriguez"), takes first word as firstName and last word as lastName.
 * Returns { firstName, lastName, displayName } with displayName as "First Last" (capitalized).
 */
export function splitDisplayName(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return { firstName: "", lastName: "", displayName: "" };
  }
  const s = fullName.trim();
  if (!s) return { firstName: "", lastName: "", displayName: "" };
  const bySpace = s.split(/\s+/);
  let firstName = "";
  let lastName = "";
  if (bySpace.length >= 2) {
    // For 2+ words: all words except the last are firstName, last word is lastName
    firstName = bySpace.slice(0, -1).join(" "); // All words except the last
    lastName = bySpace[bySpace.length - 1]; // Take only the last word
  } else if (bySpace[0].includes(".")) {
    const byDot = bySpace[0].split(".");
    if (byDot.length >= 2) {
      // For dot-separated names: first part is firstName, last part is lastName
      firstName = byDot[0];
      lastName = byDot[byDot.length - 1]; // Take only the last part
    } else {
      firstName = bySpace[0];
    }
  } else {
    firstName = bySpace[0];
  }
  // Capitalize each word in firstName and lastName separately
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  
  const displayName = [capitalizeWords(firstName), capitalizeWords(lastName)]
    .filter(Boolean)
    .join(" ");
  return { firstName, lastName, displayName };
}
