/**
 * QR Code Generator Utility
 *
 * Provides functions to generate QR code data for student orders
 * The QR code contains order information that can be scanned by admins
 */

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
