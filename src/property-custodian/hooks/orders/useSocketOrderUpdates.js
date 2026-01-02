import { useEffect } from "react";
import { useSocket } from "../../../context/SocketContext";

/**
 * useSocketOrderUpdates Hook
 *
 * Listens for real-time order updates via the shared Socket.IO connection
 *
 * @param {function} onOrderUpdated - Callback function when an order is updated
 * @returns {Object} - Socket connection status
 */
export const useSocketOrderUpdates = (onOrderUpdated) => {
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!isConnected) {
      console.log("⚠️ useSocketOrderUpdates: Socket not connected, skipping event setup");
      return;
    }

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      console.log("📡 Received order update:", data);

      if (onOrderUpdated) {
        onOrderUpdated(data);
      }
    };

    on("order:updated", handleOrderUpdate);

    // Cleanup on unmount
    return () => {
      off("order:updated", handleOrderUpdate);
    };
  }, [onOrderUpdated, isConnected, on, off]);

  return {
    isConnected,
  };
};

export default useSocketOrderUpdates;
