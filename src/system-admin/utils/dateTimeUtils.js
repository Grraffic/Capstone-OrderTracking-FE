/**
 * Date/Time Utility Functions
 *
 * Helper functions for formatting and parsing dates/times
 * for the maintenance mode feature
 */

/**
 * Format date from YYYY-MM-DD to DD.MM.YYYY
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} Date in DD.MM.YYYY format
 */
export const formatDateToDisplay = (dateString) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString + "T00:00:00");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
};

/**
 * Format date from DD.MM.YYYY to YYYY-MM-DD
 * @param {string} dateString - Date in DD.MM.YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateToAPI = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Handle DD.MM.YYYY format
    const parts = dateString.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    
    return dateString;
  } catch (error) {
    console.error("Error parsing date:", error);
    return dateString;
  }
};

/**
 * Format time from HH:MM (24-hour) to HH:MM AM/PM (12-hour)
 * @param {string} timeString - Time in HH:MM format (24-hour)
 * @returns {string} Time in HH:MM AM/PM format
 */
export const formatTimeToDisplay = (timeString) => {
  if (!timeString) return "";
  
  try {
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, "0");
    return `${String(displayHours).padStart(2, "0")}:${displayMinutes} ${period}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeString;
  }
};

/**
 * Format time from HH:MM AM/PM (12-hour) to HH:MM (24-hour)
 * @param {string} timeString - Time in HH:MM AM/PM format
 * @returns {string} Time in HH:MM format (24-hour)
 */
export const formatTimeToAPI = (timeString) => {
  if (!timeString) return null;
  
  try {
    // If already in HH:MM format (24-hour), return as is
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // Parse HH:MM AM/PM format
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }
      
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    }
    
    return timeString;
  } catch (error) {
    console.error("Error parsing time:", error);
    return timeString;
  }
};

/**
 * Validate time range
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {boolean} True if end time is after start time
 */
export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return true;
  
  try {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return endTotal > startTotal;
  } catch (error) {
    console.error("Error validating time range:", error);
    return false;
  }
};
