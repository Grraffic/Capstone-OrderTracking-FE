import { useState, useCallback } from "react";
import { parseOrderReceiptQRData, getRemainingValidityDays } from "../../../utils/qrCodeGenerator";
import api from "../../../services/api";

/**
 * useOrderQRScanner Hook
 *
 * Manages QR scanner for order receipts with two-step flow:
 * 1. Scan QR code → fetch and validate order → show order in popup (do NOT release yet)
 * 2. User confirms → update order status to "claimed" and reduce inventory
 *
 * @returns {Object} Scanner state and functions
 */
export const useOrderQRScanner = () => {
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  /** Order fetched after scan; show in confirmation modal before releasing */
  const [scannedOrder, setScannedOrder] = useState(null);

  const openQRScanner = useCallback(() => {
    setQrScannerOpen(true);
    setError(null);
    setSuccess(null);
    setScannedOrder(null);
  }, []);

  const closeQRScanner = useCallback(() => {
    setQrScannerOpen(false);
    setError(null);
    setSuccess(null);
    setProcessing(false);
    setScannedOrder(null);
  }, []);

  /** Close only the scanner overlay; keep scannedOrder so confirmation modal can show. */
  const closeScannerOnly = useCallback(() => {
    setQrScannerOpen(false);
  }, []);

  const dismissScannedOrder = useCallback(() => {
    setScannedOrder(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(null);
  }, []);

  /**
   * Claim order: update status to "claimed" and reduce inventory.
   * @param {Object} order - Full order from API (must have id, order_number, student_name, items, education_level)
   * @returns {Promise<Object>} Success message object
   */
  const claimOrder = useCallback(async (order) => {
    const orderNumber = order.order_number;

    const statusResponse = await api.patch(`/orders/${order.id}/status`, {
      status: "claimed",
    });

    if (!statusResponse.data.success) {
      throw new Error(
        statusResponse.data.message || "Failed to update order status"
      );
    }

    const inventoryUpdates = [];
    const items = order.items || [];

    for (const item of items) {
      try {
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

        const inventoryItem = inventoryResponse.data.data[0];
        const adjustment = -item.quantity;
        const adjustPayload = {
          adjustment,
          reason: `Order ${orderNumber} claimed - ${item.quantity}x ${item.name}`,
        };
        if (item.size) adjustPayload.size = item.size;

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

    return {
      orderNumber,
      studentName: order.student_name,
      items: inventoryUpdates,
      message: `Order ${orderNumber} successfully claimed!`,
    };
  }, []);

  /**
   * Fetch and validate order from scanned QR data. Does NOT claim; sets scannedOrder for confirmation modal.
   * @param {string} scannedData - Raw QR code data
   */
  const handleQRCodeScanned = useCallback(
    async (scannedData) => {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      setScannedOrder(null);

      try {
        const orderData = parseOrderReceiptQRData(scannedData);
        if (!orderData) {
          throw new Error(
            "Invalid QR code format. Please scan a valid order receipt."
          );
        }

        // If QR has issue date, reject when expired (legacy QRs without qrIssuedAt are allowed)
        if (orderData.qrIssuedAt != null) {
          const remaining = getRemainingValidityDays(orderData.qrIssuedAt);
          if (remaining < 0) {
            const msg =
              "This QR code has expired. Please ask the student to open their order again to get a new QR code.";
            setError(msg);
            setProcessing(false);
            throw new Error(msg);
          }
        }

        const orderNumber = orderData.orderNumber;
        const orderResponse = await api.get(`/orders/number/${orderNumber}`);

        if (!orderResponse.data.success || !orderResponse.data.data) {
          throw new Error("Order not found in database.");
        }

        const order = orderResponse.data.data;
        const validationItems = order.items || [];

        if (!validationItems || validationItems.length === 0) {
          throw new Error(
            "This order does not contain any items. Please contact support."
          );
        }

        if (order.status === "claimed") {
          throw new Error(
            `Order ${orderNumber} has already been claimed on ${
              order.claimed_date
                ? new Date(order.claimed_date).toLocaleDateString()
                : "a previous date"
            }.`
          );
        }

        setScannedOrder(order);
        setProcessing(false);
        return { success: true, order };
      } catch (err) {
        console.error("Error processing scanned order:", err);
        setError(err.message);
        setProcessing(false);
        throw err;
      }
    },
    []
  );

  /**
   * Confirm release: claim the scanned order (update status + reduce inventory), then clear scannedOrder.
   */
  const confirmReleaseOrder = useCallback(async () => {
    if (!scannedOrder) return;
    setProcessing(true);
    setError(null);
    try {
      const successMessage = await claimOrder(scannedOrder);
      setSuccess({
        ...successMessage,
        releasedAt: new Date(),
      });
      setScannedOrder(null);
    } catch (err) {
      console.error("Error claiming order:", err);
      setError(err.message || "Failed to release order.");
    } finally {
      setProcessing(false);
    }
  }, [scannedOrder, claimOrder]);

  return {
    qrScannerOpen,
    openQRScanner,
    closeQRScanner,
    closeScannerOnly,
    handleQRCodeScanned,
    processing,
    error,
    success,
    scannedOrder,
    confirmReleaseOrder,
    dismissScannedOrder,
    clearSuccess,
  };
};

export default useOrderQRScanner;
