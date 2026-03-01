/**
 * QR Code Generator Utility
 *
 * Provides functions to generate QR code data for student orders
 * The QR code contains order information that can be scanned by admins
 */

/** Number of calendar days the QR code is valid from qrIssuedAt */
export const QR_VALID_DAYS = 7;

/**
 * Get remaining full calendar days until QR expires (date-only comparison).
 * @param {string} qrIssuedAt - ISO timestamp when QR was issued
 * @param {number} [validDays=QR_VALID_DAYS] - Validity period in days
 * @returns {number} Remaining days (0 = expires today or already expired; negative = expired)
 */
export const getRemainingValidityDays = (qrIssuedAt, validDays = QR_VALID_DAYS) => {
  if (!qrIssuedAt) return null;
  const issued = new Date(qrIssuedAt);
  const expiry = new Date(issued);
  expiry.setDate(expiry.getDate() + validDays);
  const now = new Date();
  // Date-only: compare year/month/day
  const expiryDate = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = expiryDate - today;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return diffDays;
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
    qrIssuedAt: new Date().toISOString(),
    qrValidDays: QR_VALID_DAYS,
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
