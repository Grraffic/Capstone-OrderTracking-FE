/**
 * QR Code Generator Utility
 *
 * Provides functions to generate QR code data for student orders
 * The QR code contains order information that can be scanned by admins
 */

/** Default number of weekdays (Mon–Fri) the QR/order is valid from order creation. Must match VOID_UNCLAIMED_AFTER_DAYS. */
export const QR_VALID_DAYS = 7;

/**
 * Add N weekdays (Mon–Fri) to a date. Saturday/Sunday are skipped.
 * @param {Date} startDate - Start date (time ignored)
 * @param {number} count - Number of weekdays to add
 * @returns {Date} Resulting date (start of day)
 */
function addWeekdays(startDate, count) {
  const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  let added = 0;
  while (added < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() >= 1 && d.getDay() <= 5) added++;
  }
  return d;
}

/**
 * Count weekdays (Mon–Fri) between two dates inclusive.
 * @param {Date} from - Start date
 * @param {Date} to - End date
 * @returns {number} Number of weekdays in [from, to]
 */
function countWeekdaysBetween(from, to) {
  const fromD = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toD = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  if (fromD.getTime() > toD.getTime()) return 0;
  let count = 0;
  const cur = new Date(fromD);
  while (cur.getTime() <= toD.getTime()) {
    if (cur.getDay() >= 1 && cur.getDay() <= 5) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/**
 * Get remaining weekdays (Mon–Fri only) until QR/order expires. Aligns with backend VOID_UNCLAIMED_AFTER_DAYS.
 * @param {string} qrIssuedAt - ISO timestamp when order was created / QR validity started
 * @param {number} [validDays=QR_VALID_DAYS] - Validity period in weekdays
 * @returns {number|null} Remaining weekdays (0 = expires today; negative = expired); null if no date
 */
export const getRemainingValidityDays = (qrIssuedAt, validDays = QR_VALID_DAYS) => {
  if (!qrIssuedAt) return null;
  const issued = new Date(qrIssuedAt);
  const issuedStart = new Date(issued.getFullYear(), issued.getMonth(), issued.getDate());
  const expiry = addWeekdays(issuedStart, validDays);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (today.getTime() > expiry.getTime()) {
    const past = countWeekdaysBetween(expiry, today);
    return past === 0 ? -1 : -past;
  }
  if (today.getTime() === expiry.getTime()) return 0;
  return countWeekdaysBetween(today, expiry);
};

/**
 * Generate QR code data for an order receipt
 * @param {Object} orderData - Order information
 * @returns {string} JSON string to be encoded in QR code
 */
export const generateOrderReceiptQRData = (orderData) => {
  // Validate and ensure all required fields have realistic values
  const orderNumber = orderData.orderNumber || orderData.order_number;
  if (!orderNumber) {
    throw new Error("Order number is required for QR code generation");
  }

  const studentId = orderData.studentId || orderData.student_id || "unknown";
  const studentName = orderData.studentName || orderData.student_name || "Unknown Student";
  const studentEmail = orderData.studentEmail || orderData.student_email || "";
  
  // Ensure items array is valid and has realistic data
  const items = (orderData.items || []).map((item) => ({
    name: item.name || "Unknown Item",
    quantity: item.quantity || 1,
    size: item.size || "N/A",
  }));

  if (items.length === 0) {
    throw new Error("Order must contain at least one item for QR code generation");
  }

  const totalItems = orderData.quantity || items.length;
  const orderDate = orderData.orderDate || orderData.order_date || orderData.created_at || new Date().toISOString();
  const educationLevel = orderData.educationLevel || orderData.education_level || orderData.type || "General";
  const status = orderData.status || "pending";
  const totalAmount = orderData.totalAmount || orderData.total_amount || 0;

  // Use order's created/issued time so countdown is from order creation, not from when modal opened
  const qrIssuedAt = orderData.qrIssuedAt
    ? new Date(orderData.qrIssuedAt).toISOString()
    : new Date().toISOString();
  const qrValidDays = typeof orderData.qrValidDays === "number" ? orderData.qrValidDays : QR_VALID_DAYS;

  const qrData = {
    type: "order_receipt",
    orderNumber,
    studentId,
    studentName,
    studentEmail,
    items,
    totalItems,
    totalAmount,
    orderDate,
    educationLevel,
    status,
    qrIssuedAt,
    qrValidDays,
  };

  // Validate the generated QR data structure
  if (!qrData.orderNumber || !qrData.studentName || qrData.items.length === 0) {
    throw new Error("Invalid QR code data: missing required fields");
  }

  return JSON.stringify(qrData);
};

/**
 * Parse QR code data from scanned string
 * @param {string} qrString - Scanned QR code string
 * @returns {Object|null} Parsed order data or null if invalid
 */
export const parseOrderReceiptQRData = (qrString) => {
  try {
    const data = JSON.parse(qrString);

    // Validate that it's an order receipt QR code
    if (data.type !== "order_receipt" || !data.orderNumber) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Failed to parse QR code data:", error);
    return null;
  }
};

/**
 * Generate a unique order number
 * Format: ORD-YYYYMMDD-XXXXX (e.g., ORD-20250115-12345)
 * @returns {string} Unique order number
 */
export const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, "0");

  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Validate order data before generating QR code
 * @param {Object} orderData - Order data to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.orderNumber && !orderData.order_number) {
    errors.push("Order number is required");
  }

  if (!orderData.studentName && !orderData.student_name) {
    errors.push("Student name is required");
  }

  if (!orderData.items || orderData.items.length === 0) {
    errors.push("Order must contain at least one item");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
