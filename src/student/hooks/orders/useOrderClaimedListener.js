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
    if ((!user?.uid && !user?.id) || !isConnected) {
      console.log("⚠️ useOrderClaimedListener: No user or socket not connected, skipping event setup");
      return;
    }

    // Listen for order claimed events
    const handleOrderClaimed = (data) => {
      console.log("📡 Received order claimed event:", data);
      console.log("🔍 Current user.uid:", user.uid);
      console.log("🔍 Current user.id:", user.id);
      console.log("🔍 Event userId:", data.userId);

      // Check if this order belongs to the current user (support both uid and id)
      const currentUserId = user.uid || user.id;
      const eventUserId = data.userId;
      
      if (eventUserId && currentUserId && (eventUserId === currentUserId || String(eventUserId) === String(currentUserId))) {
        trackOrderClaimed({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          items: data.items,
        });
        console.log("✅ Activity tracked: Order claimed");
      } else {
        console.log("⚠️ Order claimed event received but userId doesn't match current user");
        console.log("⚠️ Expected:", currentUserId);
        console.log("⚠️ Received:", eventUserId);
      }
    };

    on("order:claimed", handleOrderClaimed);

    // Cleanup on unmount
    return () => {
      off("order:claimed", handleOrderClaimed);
    };
  }, [user?.uid, user?.id, trackOrderClaimed, isConnected, on, off]);

  return {
    isConnected,
  };
};

export default useOrderClaimedListener;

