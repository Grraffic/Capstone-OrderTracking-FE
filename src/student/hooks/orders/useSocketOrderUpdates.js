import { useEffect } from "react";
import socketClient from "../../../utils/socketClient";

/**
 * useSocketOrderUpdates Hook (Student Version)
 * 
 * Connects to Socket.IO and listens for real-time order updates for students
 * 
 * @param {function} onOrderUpdated - Callback function when an order is updated
 * @returns {Object} - Socket connection status
 */
export const useSocketOrderUpdates = (onOrderUpdated) => {
  useEffect(() => {
    // Connect to Socket.IO server
    socketClient.connect();

    // Listen for order updates
    const handleOrderUpdate = (data) => {
      console.log("📡 Received order update (Student):", data);
      
      if (onOrderUpdated) {
        onOrderUpdated(data);
      }
    };

    socketClient.on("order:updated", handleOrderUpdate);

    // Cleanup on unmount
    return () => {
      socketClient.off("order:updated", handleOrderUpdate);
    };
  }, [onOrderUpdated]);

  return {
    isConnected: socketClient.isConnected(),
  };
};

export default useSocketOrderUpdates;
