import { useState, useCallback } from "react";
import { parseOrderReceiptQRData } from "../../../utils/qrCodeGenerator";
import api from "../../../services/api";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * useOrderQRScanner Hook
 *
 * Manages QR scanner for order receipts with complete flow:
 * 1. Scan QR code from student's order receipt
 * 2. Parse QR code data to extract order number
 * 3. Find order in database by order number
 * 4. Update order status from "pending" to "claimed"
 * 5. Reduce inventory for all items in the order
 *
 * @returns {Object} Scanner state and functions
 */
export const useOrderQRScanner = () => {
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const openQRScanner = useCallback(() => {
    setQrScannerOpen(true);
    setError(null);
    setSuccess(null);
  }, []);

  const closeQRScanner = useCallback(() => {
    setQrScannerOpen(false);
    setError(null);
    setSuccess(null);
    setProcessing(false);
  }, []);

  /**
   * Process scanned QR code data
   * @param {string} scannedData - Raw QR code data
   * @returns {Promise<Object>} Processing result
   */
  const processScannedOrder = useCallback(async (scannedData) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      console.log("Processing scanned QR code:", scannedData);

      // Step 1: Parse QR code data
      const orderData = parseOrderReceiptQRData(scannedData);
      if (!orderData) {
        throw new Error(
          "Invalid QR code format. Please scan a valid order receipt."
        );
      }

      console.log("Parsed order data:", orderData);

      // Step 2: Find order by order number
      const orderNumber = orderData.orderNumber;
      const orderResponse = await api.get(`/orders/number/${orderNumber}`);

      if (!orderResponse.data.success || !orderResponse.data.data) {
        throw new Error("Order not found in database.");
      }

      const order = orderResponse.data.data;
      console.log("Found order:", order);

      // --- VALIDATION: Check if order contains valid items ---
      // Verify that the order has items and they can be found in inventory
      const validationItems = order.items || [];
      
      if (!validationItems || validationItems.length === 0) {
        throw new Error(
          "This order does not contain any items. Please contact support."
        );
      }

      // Optional: Verify items exist in inventory (but don't block if check fails)
      // This is just for logging/debugging purposes
      let validItemsFound = 0;
      const educationLevel = order.education_level;

      for (const item of validationItems) {
        try {
          // Fetch item details to verify it exists
          const itemSearchResponse = await api.get(`/items`, {
            params: {
              search: item.name,
              education_level: educationLevel,
            },
          });

          if (
            itemSearchResponse.data.success &&
            itemSearchResponse.data.data &&
            itemSearchResponse.data.data.length > 0
          ) {
            validItemsFound++;
          }
        } catch (catCheckError) {
          console.warn("Error checking item:", catCheckError);
          // Continue checking other items - don't block the order
        }
      }

      // Log validation result but don't block the order
      if (validItemsFound === 0) {
        console.warn("⚠️ Warning: Could not verify items in inventory, but proceeding with order claim");
      }
      // ------------------------------------------------

      // Check if order is already claimed
      if (order.status === "claimed") {
        throw new Error(
          `Order ${orderNumber} has already been claimed on ${
            order.claimed_date
              ? new Date(order.claimed_date).toLocaleDateString()
              : "a previous date"
          }.`
        );
      }

      // Step 3: Update order status to "claimed"
      const statusResponse = await api.patch(`/orders/${order.id}/status`, {
        status: "claimed",
      });

      if (!statusResponse.data.success) {
        throw new Error(
          statusResponse.data.message || "Failed to update order status"
        );
      }

      const statusResult = statusResponse.data;

      console.log("Order status updated to claimed:", statusResult.data);

      // Step 4: Reduce inventory for all items in the order
      const inventoryUpdates = [];
      const items = order.items || [];

      for (const item of items) {
        try {
          // Find inventory item by name and education level
          const inventoryResponse = await api.get(`/items`, {
            params: {
              search: item.name,
              education_level: order.education_level,
            },
          });

          if (
            !inventoryResponse.data.success ||
            !inventoryResponse.data.data ||
            inventoryResponse.data.data.length === 0
          ) {
            console.error(`Inventory item not found: ${item.name}`);
            continue;
          }

          // Get the first matching item
          const inventoryItem = inventoryResponse.data.data[0];

          // Reduce stock by the ordered quantity
          const adjustment = -item.quantity; // Negative to reduce stock
          
          // Pass size information if available (for size-specific items)
          const adjustPayload = {
            adjustment,
            reason: `Order ${orderNumber} claimed - ${item.quantity}x ${item.name}`,
          };
          
          // Include size if the item has a size (for JSON variant handling)
          if (item.size) {
            adjustPayload.size = item.size;
          }
          
          const adjustResponse = await api.patch(
            `/items/${inventoryItem.id}/adjust`,
            adjustPayload
          );

          if (adjustResponse.data.success) {
            inventoryUpdates.push({
              item: item.name,
              quantity: item.quantity,
              success: true,
            });
            console.log(
              `Inventory reduced: ${item.name} by ${item.quantity}`,
              adjustResponse.data.data
            );
          }
        } catch (itemError) {
          console.error(`Error processing item ${item.name}:`, itemError);
          inventoryUpdates.push({
            item: item.name,
            quantity: item.quantity,
            success: false,
            error: itemError.message,
          });
        }
      }

      // Success!
      const successMessage = {
        orderNumber: order.order_number,
        studentName: order.student_name,
        items: inventoryUpdates,
        message: `Order ${order.order_number} successfully claimed!`,
      };

      // Note: Socket.IO events are emitted by the backend when the order status is updated
      // No need to emit from frontend - the backend already emits "order:updated" and "order:claimed"
      console.log(
        "✅ Order claimed successfully! Backend will emit Socket.IO events."
      );

      setSuccess(successMessage);
      setProcessing(false);

      return {
        success: true,
        data: successMessage,
      };
    } catch (err) {
      console.error("Error processing scanned order:", err);
      setError(err.message);
      setProcessing(false);
      throw err;
    }
  }, []);

  /**
   * Handle QR code scanned event
   * @param {string} scannedData - Raw QR code data
   */
  const handleQRCodeScanned = useCallback(
    async (scannedData) => {
      console.log("🔍 QR Code Scanned - Starting processing...");
      try {
        const result = await processScannedOrder(scannedData);
        console.log("✅ QR Code Processing Complete:", result);
        return result;
      } catch (err) {
        // Error is already set in processScannedOrder
        console.error("❌ QR scan error:", err);
        throw err;
      }
    },
    [processScannedOrder]
  );

  return {
    qrScannerOpen,
    openQRScanner,
    closeQRScanner,
    handleQRCodeScanned,
    processing,
    error,
    success,
  };
};

export default useOrderQRScanner;
