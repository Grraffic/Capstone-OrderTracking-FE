import { useEffect } from "react";
import { useSocket } from "../../../context/SocketContext";
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
  const { on, off, isConnected } = useSocket();

  useEffect(() => {
    if (!user?.uid || !isConnected) {
      console.log("⚠️ useOrderClaimedListener: No user or socket not connected, skipping event setup");
      return;
    }

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

    on("order:claimed", handleOrderClaimed);

    // Cleanup on unmount
    return () => {
      off("order:claimed", handleOrderClaimed);
    };
  }, [user?.uid, trackOrderClaimed, isConnected, on, off]);

  return {
    isConnected,
  };
};

export default useOrderClaimedListener;

