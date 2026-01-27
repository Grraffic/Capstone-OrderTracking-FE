/**
 * Course banner color and logo by program for La Verdad OrderFlow.
 * BSIS = red + BSIS.png, ACT = orange + ACT.png, BAB = blue + BAB.png, BSSW = violet + BSSW.png.
 * BSA/BSAIS = yellow + LV Logo. Preschool–senior high (Preschool, Kinder–Grade 12) = #003363 + LV Logo.
 *
 * @param {string} [courseYearLevel] - e.g. "BSIS 2nd Year", "BAB 1st Year", "Grade 10"
 * @returns {{ bg: string, text: string, label: string, logo: string }}
 */
const LV_LOGO = "/assets/image/LV Logo.png";

export const getCourseBannerStyle = (courseYearLevel) => {
  if (!courseYearLevel) return { bg: "bg-gray-600", text: "text-white", label: "", logo: LV_LOGO };
  const s = String(courseYearLevel).trim();
  const su = s.toUpperCase();

  // College programs with program logos (including ACT)
  if (su.startsWith("BSIS")) return { bg: "bg-[#8B0000]", text: "text-white", label: "BSIS", logo: "/assets/image/BSIS.png" };
  if (su.startsWith("ACT")) return { bg: "bg-[#E68B00]", text: "text-white", label: "ACT", logo: "/assets/image/ACT.png" };
  if (su.startsWith("BAB")) return { bg: "bg-[#003363]", text: "text-white", label: "BAB", logo: "/assets/image/BAB.png" };
  if (su.startsWith("BSSW")) return { bg: "bg-[#6A0DAD]", text: "text-white", label: "BSSW", logo: "/assets/image/BSSW.png" };
  if (su.startsWith("BSAIS")) return { bg: "bg-[#D4A017]", text: "text-white", label: "BSAIS", logo: LV_LOGO };
  if (su.startsWith("BSA")) return { bg: "bg-[#D4A017]", text: "text-white", label: "BSA", logo: LV_LOGO };

  // Preschool to senior high: #003363 (same as Personal Information button), LV logo
  // Prekindergarten, Kindergarten (and legacy "Kinder"), Grade 1–12
  if (/^PREKINDERGARTEN$/i.test(su) || /^KINDERGARTEN$/i.test(su) || /^KINDER$/i.test(su) || /^GRADE\s+\d{1,2}$/i.test(su)) {
    return { bg: "bg-[#003363]", text: "text-white", label: s, logo: LV_LOGO };
  }

  return { bg: "bg-gray-600", text: "text-white", label: "", logo: LV_LOGO };
};
