import { useEffect } from "react";
import socketClient from "../../../utils/socketClient";
import { useActivity } from "../../../context/ActivityContext";
import { useAuth } from "../../../context/AuthContext";

/**
 * useOrderClaimedListener Hook
 * 
 * Listens for Socket.IO events when an admin claims a student's order
 * and automatically tracks the activity for the student
 * 
 * @returns {Object} - Socket connection status
 */
export const useOrderClaimedListener = () => {
  const { trackOrderClaimed } = useActivity();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    // Connect to Socket.IO server
    socketClient.connect();

    // Listen for order claimed events
    const handleOrderClaimed = (data) => {
      console.log("📡 Received order claimed event:", data);
      
      // Only track activity if this order belongs to the current user
      if (data.userId === user.uid) {
        trackOrderClaimed({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          items: data.items,
        });
        console.log("✅ Activity tracked: Order claimed");
      }
    };

    socketClient.on("order:claimed", handleOrderClaimed);

    // Cleanup on unmount
    return () => {
      socketClient.off("order:claimed", handleOrderClaimed);
    };
  }, [user?.uid, trackOrderClaimed]);

  return {
    isConnected: socketClient.isConnected(),
  };
};

export default useOrderClaimedListener;

