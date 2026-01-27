/**
 * Education Level Mapper Utility
 * 
 * Maps UI education level labels to database values
 * Matches the property custodian mapping logic
 */

/**
 * Map UI education level label to database value
 * @param {string} uiLabel - UI label (e.g., "Preschool", "Junior Highschool")
 * @returns {string} Database value (e.g., "Kindergarten", "Junior High School")
 */
export const mapEducationLevelToDB = (uiLabel) => {
  const mapping = {
    "All Education Levels": "", // Empty string means show all (no filter applied)
    "Preschool": "Kindergarten", // UI says "Preschool" but DB stores "Kindergarten"
    "Elementary": "Elementary",
    "Junior Highschool": "Junior High School", // UI says "Junior Highschool", DB stores "Junior High School"
    "Senior Highschool": "Senior High School", // UI has no space, DB has space
    "College": "College",
  };
  return mapping[uiLabel] || uiLabel;
};

/**
 * Map UI grade level to database value
 * Converts UI format (e.g., "BSIS 4th yr") to database format (e.g., "BSIS 4th Year")
 * @param {string} uiGradeLevel - UI grade level (e.g., "Grade Level", "Grade 1", "BSIS 4th yr")
 * @returns {string} Database grade level value
 */
export const mapGradeLevelToDB = (uiGradeLevel) => {
  // If "Grade Level", return empty string to indicate no filter
  if (uiGradeLevel === "Grade Level") {
    return "";
  }
  
  // Convert college course formats from UI to database format
  // UI uses: "BSIS 4th yr" (lowercase "yr")
  // Database might use: "BSIS 4th Year" (capitalized "Year") or "BSIS - 4th Year" (with dash)
  // We'll try to match common patterns
  
  // Check if it's a college course format (contains course code and year)
  const collegeCoursePattern = /^(BSA|BSAIS|BAB|BSSW|BSIS|ACT)\s+(\d+)(st|nd|rd|th)\s+yr$/i;
  const match = uiGradeLevel.match(collegeCoursePattern);
  
  if (match) {
    // Convert to database format: "BSIS 4th Year" (capitalize Year)
    const courseCode = match[1].toUpperCase();
    const yearNumber = match[2];
    const yearSuffix = match[3];
    return `${courseCode} ${yearNumber}${yearSuffix} Year`;
  }
  
  // For other grade levels (Grade 1, Grade 2, etc.), return as is
  return uiGradeLevel;
};
