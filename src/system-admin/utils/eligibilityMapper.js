/**
 * Eligibility Mapper Utility
 *
 * Maps UI education level labels to database values for eligibility management
 * UI Display: Preschool, Elementary, JHS, SHS, College
 * Database Storage: Kindergarten, Elementary, Junior High School, Senior High School, College
 */

/**
 * Map UI education level label to database value
 * @param {string} uiLabel - UI label (e.g., "Preschool", "JHS")
 * @returns {string} Database value (e.g., "Kindergarten", "Junior High School")
 */
export const mapUILevelToDB = (uiLabel) => {
  const mapping = {
    Preschool: "Kindergarten",
    Elementary: "Elementary",
    JHS: "Junior High School",
    SHS: "Senior High School",
    College: "College",
  };
  return mapping[uiLabel] || uiLabel;
};

/**
 * Map database education level value to UI label
 * @param {string} dbValue - Database value (e.g., "Kindergarten", "Junior High School")
 * @returns {string} UI label (e.g., "Preschool", "JHS")
 */
export const mapDBLevelToUI = (dbValue) => {
  const mapping = {
    Kindergarten: "Preschool",
    Elementary: "Elementary",
    "Junior High School": "JHS",
    "Senior High School": "SHS",
    College: "College",
  };
  return mapping[dbValue] || dbValue;
};

/**
 * Get all UI education level labels
 * @returns {Array<string>} Array of UI labels
 */
export const getUILevels = () => {
  return ["Preschool", "Elementary", "JHS", "SHS", "College"];
};

/**
 * Get all database education level values
 * @returns {Array<string>} Array of database values
 */
export const getDBLevels = () => {
  return [
    "Kindergarten",
    "Elementary",
    "Junior High School",
    "Senior High School",
    "College",
  ];
};

/**
 * Convert UI eligibility object to database format
 * @param {Object} uiEligibility - UI eligibility object with boolean flags
 * @returns {Array<string>} Array of database education level values
 */
export const convertUIToDB = (uiEligibility) => {
  const dbLevels = [];
  const uiToDBMap = {
    isPreschoolEligible: "Kindergarten",
    isElementaryEligible: "Elementary",
    isJHSEligible: "Junior High School",
    isSHSEligible: "Senior High School",
    isCollegeEligible: "College",
  };

  Object.keys(uiToDBMap).forEach((key) => {
    if (uiEligibility[key]) {
      dbLevels.push(uiToDBMap[key]);
    }
  });

  return dbLevels;
};

/**
 * Convert database eligibility array to UI format
 * @param {Array<string>} dbLevels - Array of database education level values
 * @returns {Object} UI eligibility object with boolean flags
 */
export const convertDBToUI = (dbLevels) => {
  const dbToUIMap = {
    Kindergarten: "isPreschoolEligible",
    Elementary: "isElementaryEligible",
    "Junior High School": "isJHSEligible",
    "Senior High School": "isSHSEligible",
    College: "isCollegeEligible",
  };

  const uiEligibility = {
    isPreschoolEligible: false,
    isElementaryEligible: false,
    isJHSEligible: false,
    isSHSEligible: false,
    isCollegeEligible: false,
  };

  if (Array.isArray(dbLevels)) {
    dbLevels.forEach((level) => {
      const uiKey = dbToUIMap[level];
      if (uiKey) {
        uiEligibility[uiKey] = true;
      }
    });
  }

  return uiEligibility;
};
