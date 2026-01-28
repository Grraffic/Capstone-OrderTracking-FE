/**
 * Split full name for display: handles "Rafael Ramos" (space) and "leorenzbien.rodriguez" (dot).
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
    firstName = bySpace[0];
    lastName = bySpace.slice(1).join(" ");
  } else if (bySpace[0].includes(".")) {
    const byDot = bySpace[0].split(".");
    if (byDot.length >= 2) {
      firstName = byDot[0];
      lastName = byDot.slice(1).join(".");
    } else {
      firstName = bySpace[0];
    }
  } else {
    firstName = bySpace[0];
  }
  const displayName = [firstName, lastName]
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
  return { firstName, lastName, displayName };
}
