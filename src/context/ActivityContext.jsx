import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const ActivityContext = createContext();

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  return context;
};

/**
 * ActivityProvider - Manages user activity tracking
 * Tracks actions like: add to cart, checkout, order placement, claiming
 */
export const ActivityProvider = ({ children }) => {
  const { user } = useAuth();
  // Safely get socket context - useSocket might throw if not within SocketProvider
  let socketContext;
  try {
    socketContext = useSocket();
  } catch (error) {
    console.warn("ActivityProvider: Socket context not available, continuing without socket features:", error);
    socketContext = null;
  }
  
  const on = socketContext?.on || (() => {});
  const off = socketContext?.off || (() => {});
  const isConnected = socketContext?.isConnected || false;
  
  const [activities, setActivities] = useState([]);

  // Load activities from localStorage when component mounts
  useEffect(() => {
    if (user?.id) {
      loadActivities();
    } else {
      setActivities([]);
    }
  }, [user?.id]);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (user?.id && activities.length > 0) {
      saveActivities();
    }
  }, [activities, user?.id]);

  // Listen for Socket.IO events when admin claims student's order
  useEffect(() => {
    const currentUserId = user?.uid || user?.id; // Prioritize uid (Supabase Auth UID)
    if (!currentUserId || !isConnected) {
      console.log("⚠️ ActivityContext: No user or socket not connected, skipping event setup");
      return;
    }

    console.log("🔌 ActivityContext: Setting up Socket.IO listeners for user:", currentUserId);

    // Listen for order claimed events
    const handleOrderClaimed = (data) => {
      console.log("📡 Received order claimed event:", data);
      console.log("🔍 Current user.id:", user?.id);
      console.log("🔍 Current user.uid:", user?.uid);
      console.log("🔍 Event userId:", data.userId);

      // Only track activity if this order belongs to the current user
      // Prioritize user.uid (Supabase Auth UID) for matching
      const currentUserId = user?.uid || user?.id; // Changed: uid first
      const eventUserId = data.userId;
      const isMatch = eventUserId && currentUserId && (
        eventUserId === currentUserId || 
        String(eventUserId) === String(currentUserId)
      );
      console.log("🔍 Match?", isMatch);
      
      if (isMatch) {
        // Calculate total items count
        const itemCount = data.items?.length || 0;

        // Create "order_released" activity (order was released by property custodian)
        const releasedActivity = {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          timestamp: new Date().toISOString(),
          type: "order_released",
          description: `Your order #${data.orderNumber} with ${itemCount} item(s) has been released`,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          items: data.items,
          itemCount: itemCount,
        };

        setActivities((prev) => [releasedActivity, ...prev]);
        console.log("✅ Activity tracked: Order released");
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
  }, [user?.id, user?.uid, isConnected, on, off]);

  /**
   * Load activities from localStorage
   */
  const loadActivities = () => {
    try {
      const saved = localStorage.getItem(`activities_${user.id}`);
      if (saved) {
        setActivities(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading activities:", error);
    }
  };

  /**
   * Save activities to localStorage
   * Limit to 50 most recent activities to prevent quota exceeded errors
   */
  const saveActivities = () => {
    try {
      // Keep only the 50 most recent activities
      const limitedActivities = activities.slice(0, 50);
      localStorage.setItem(`activities_${user.id}`, JSON.stringify(limitedActivities));
      console.log(`💾 Saved ${limitedActivities.length} activities to localStorage`);
    } catch (error) {
      console.error("Error saving activities:", error);
      // If still quota exceeded, try clearing old activities
      if (error.name === 'QuotaExceededError') {
        try {
          const emergencyLimit = activities.slice(0, 20);
          localStorage.setItem(`activities_${user.id}`, JSON.stringify(emergencyLimit));
          console.log(`💾 Emergency save: Reduced to ${emergencyLimit.length} activities`);
        } catch (e) {
          console.error("Emergency save also failed:", e);
        }
      }
    }
  };

  /**
   * Add a new activity
   * @param {Object} activity - Activity details
   */
  const addActivity = (activity) => {
    if (!user?.id) return;

    const newActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      timestamp: new Date().toISOString(),
      ...activity,
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  /**
   * Track "Add to Cart" action
   */
  const trackAddToCart = (product) => {
    addActivity({
      type: "cart_add",
      description: `Added ${product.name} to cart`,
      productName: product.name,
      productId: product.id,
      educationLevel: product.education_level || product.educationLevel,
      size: product.size,
      quantity: product.quantity || 1,
    });
  };

  /**
   * Track "Checkout" action
   */
  const trackCheckout = (orderData) => {
    addActivity({
      type: "checkout",
      description: `Checked out ${orderData.itemCount} item(s)`,
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      itemCount: orderData.itemCount,
      items: orderData.items,
    });
  };

  /**
   * Track "Order Placed" action
   */
  const trackOrderPlaced = (orderData) => {
    addActivity({
      type: "order_placed",
      description: `Placed order #${orderData.orderNumber}`,
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      itemCount: orderData.itemCount,
      educationLevel: orderData.educationLevel,
    });
  };

  /**
   * Track "Order Claimed" action
   */
  const trackOrderClaimed = (orderData) => {
    addActivity({
      type: "claimed",
      description: `Claimed order #${orderData.orderNumber}`,
      orderId: orderData.orderId,
      orderNumber: orderData.orderNumber,
      items: orderData.items,
    });
  };

  /**
   * Track "Remove from Cart" action
   */
  const trackRemoveFromCart = (product) => {
    addActivity({
      type: "cart_remove",
      description: `Removed ${product.name} from cart`,
      productName: product.name,
      productId: product.id,
      educationLevel: product.education_level || product.educationLevel,
    });
  };

  /**
   * Get all activities
   */
  const getActivities = () => {
    return activities;
  };

  /**
   * Get activities filtered by type
   */
  const getActivitiesByType = (type) => {
    return activities.filter((activity) => activity.type === type);
  };

  /**
   * Clear all activities (for testing)
   */
  const clearActivities = () => {
    setActivities([]);
    if (user?.id) {
      localStorage.removeItem(`activities_${user.id}`);
    }
  };

  const value = {
    activities,
    addActivity,
    trackAddToCart,
    trackCheckout,
    trackOrderPlaced,
    trackOrderClaimed,
    trackRemoveFromCart,
    getActivities,
    getActivitiesByType,
    clearActivities,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
