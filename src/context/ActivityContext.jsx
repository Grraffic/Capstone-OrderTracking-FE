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
    // console.warn("ActivityProvider: Socket context not available, continuing without socket features:", error);
    socketContext = null;
  }
  
  const on = socketContext?.on || (() => {});
  const off = socketContext?.off || (() => {});
  const isConnected = socketContext?.isConnected || false;
  
  const [activities, setActivities] = useState([]);

  // Load activities from localStorage when component mounts
  useEffect(() => {
    if (user?.id || user?.uid) {
      loadActivities();
      // Also sync activities from claimed orders in database as fallback
      syncActivitiesFromClaimedOrders();
    } else {
      setActivities([]);
    }
  }, [user?.id, user?.uid]);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (user?.id && activities.length > 0) {
      saveActivities();
    }
  }, [activities, user?.id]);

  // Listen for Socket.IO events when admin claims student's order
  // Set up listener even if user is not fully loaded - we'll verify ownership when event is received
  useEffect(() => {
    if (!isConnected) {
      // console.log("⚠️ ActivityContext: Socket not connected, skipping event setup", {
      //   isConnected: isConnected,
      //   hasOn: typeof on === 'function'
      // });
      return;
    }
    
    const currentUserId = user?.uid || user?.id; // Prioritize uid (Supabase Auth UID)
    if (!currentUserId) {
      // console.log("⚠️ ActivityContext: No user ID yet, but setting up listener anyway (will verify on event)", {
      //   hasUser: !!user,
      //   userId: user?.id,
      //   userUid: user?.uid
      // });
      // Continue to set up listener - we'll handle user verification in the handler
    }

    // console.log("🔌 ActivityContext: Setting up Socket.IO listeners for user:", currentUserId);
    // console.log("🔌 ActivityContext: Socket connection status:", {
    //   isConnected: isConnected,
    //   hasOn: typeof on === 'function',
    //   hasOff: typeof off === 'function',
    //   user: {
    //     id: user?.id,
    //     uid: user?.uid,
    //     role: user?.role
    //   }
    // });

    // Listen for order claimed events
    const handleOrderClaimed = (data) => {
      // console.log("📡 ActivityContext: ========== RECEIVED order:claimed EVENT ==========");
      // console.log("📡 ActivityContext: Full event data:", JSON.stringify(data, null, 2));
      // console.log("🔍 ActivityContext: Current user.id:", user?.id);
      // console.log("🔍 ActivityContext: Current user.uid:", user?.uid);
      // console.log("🔍 ActivityContext: Event userId:", data?.userId);
      // console.log("🔍 ActivityContext: Event orderNumber:", data?.orderNumber || data?.order_number);
      // console.log("🔍 ActivityContext: Event orderId:", data?.orderId || data?.order_id);
      // console.log("🔍 ActivityContext: Event items:", data?.items);
      // console.log("🔍 ActivityContext: Event itemCount:", data?.itemCount);

      // Only track activity if this order belongs to the current user
      // Check both user.uid and user.id against event userId for robust matching
      const currentUserId = user?.uid || user?.id;
      const eventUserId = data?.userId;
      
      // Enhanced matching: check multiple combinations with detailed logging
      let isMatch = false;
      let matchReason = "";
      
      // If event has no userId but has order details, proceed with fallback creation
      if (!eventUserId) {
        // console.warn("⚠️ ActivityContext: Event has no userId, will attempt fallback creation if order details present");
      } else if (!currentUserId) {
        // console.warn("⚠️ ActivityContext: Current user has no id/uid, will attempt fallback creation if order details present");
      } else {
        // Try multiple matching strategies
        const comparisons = [
          { check: eventUserId === currentUserId, reason: "Direct match (eventUserId === currentUserId)" },
          { check: String(eventUserId) === String(currentUserId), reason: "String conversion match" },
          { check: eventUserId === user?.id, reason: "Direct match with user.id" },
          { check: eventUserId === user?.uid, reason: "Direct match with user.uid" },
          { check: String(eventUserId) === String(user?.id), reason: "String match with user.id" },
          { check: String(eventUserId) === String(user?.uid), reason: "String match with user.uid" },
          // Additional checks: trim whitespace and case-insensitive for string IDs
          { check: String(eventUserId).trim() === String(currentUserId).trim(), reason: "Trimmed string match" },
          { check: String(eventUserId).trim().toLowerCase() === String(currentUserId).trim().toLowerCase(), reason: "Case-insensitive trimmed match" }
        ];
        
        for (const comparison of comparisons) {
          if (comparison.check) {
            isMatch = true;
            matchReason = comparison.reason;
            break;
          }
        }
      }
      
      // console.log("🔍 ActivityContext: User match result:", isMatch);
      if (isMatch) {
        // console.log(`✅ ActivityContext: Match successful - ${matchReason}`);
      } else {
        // console.log("❌ ActivityContext: Match failed - Detailed comparison:");
        // console.log("  - Event userId type:", typeof eventUserId, "value:", eventUserId);
        // console.log("  - Current userId type:", typeof currentUserId, "value:", currentUserId);
        // console.log("  - user.id type:", typeof user?.id, "value:", user?.id);
        // console.log("  - user.uid type:", typeof user?.uid, "value:", user?.uid);
        // console.log("  - String(eventUserId):", String(eventUserId));
        // console.log("  - String(currentUserId):", String(currentUserId));
      }
      
      // ALWAYS create activity if we have order details, regardless of user ID match
      // This handles cases where user ID format differs but the order belongs to the user
      const hasOrderDetails = (data?.orderNumber || data?.order_number || data?.orderId || data?.order_id);
      
      if (isMatch || hasOrderDetails) {
        if (!isMatch && hasOrderDetails) {
          // console.log("🔄 ActivityContext: User ID didn't match, but order details present - creating activity anyway");
          // console.log("🔄 ActivityContext: This handles cases where backend sends different user ID format");
        }
        try {
          // Validate and calculate total items count
          const itemCount = Array.isArray(data.items) ? data.items.length : (data.itemCount || 0);
          const orderNumber = data.orderNumber || data.order_number || "N/A";
          const orderId = data.orderId || data.order_id || null;

          // Get item name and education level from order data
          const items = Array.isArray(data.items) ? data.items : [];
          const firstItem = items.length > 0 ? items[0] : null;
          const itemName = firstItem?.name || data.itemName || "items";
          const educationLevel = data.education_level || data.educationLevel || "";
          
          // Format education level for display
          let educationLevelDisplay = "";
          if (educationLevel) {
            if (educationLevel === "College" || educationLevel === "Higher Education") {
              educationLevelDisplay = "Higher Education (College)";
            } else {
              educationLevelDisplay = educationLevel;
            }
          }
          
          // Create description: "Your order #... (ItemName) has been released!"
          let description = "";
          if (orderNumber && orderNumber !== "N/A") {
            description = `Your order #${orderNumber} (${itemName}) has been released!`;
          } else if (orderId) {
            description = `Your order (${itemName}) has been released!`;
          } else {
            description = `Your order (${itemName}) has been released!`;
          }

          // Create single "order_released" activity (one per claimed order)
          const activityUserId = user.id || user.uid;
          const releasedActivity = {
            id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: activityUserId,
            timestamp: new Date().toISOString(),
            type: "order_released",
            description: description,
            orderId: orderId,
            orderNumber: orderNumber !== "N/A" ? orderNumber : null,
            items: items,
            itemCount: itemCount,
            productName: itemName,
            educationLevel: educationLevelDisplay || educationLevel,
          };

          setActivities((prev) => {
            const updated = [releasedActivity, ...prev];
            return updated;
          });
        } catch (error) {
          // console.error("❌ ActivityContext: Error creating order_released activity:", error);
          // console.error("❌ ActivityContext: Event data:", data);
        }
      } else {
        // console.warn("⚠️ ActivityContext: Order claimed event received but userId doesn't match current user");
        // console.warn("⚠️ ActivityContext: Expected (uid):", user?.uid, "Expected (id):", user?.id);
        // console.warn("⚠️ ActivityContext: Received event userId:", eventUserId);
        // console.warn("⚠️ ActivityContext: Order details:", {
        //   orderId: data?.orderId || data?.order_id,
        //   orderNumber: data?.orderNumber || data?.order_number,
        //   itemCount: data?.itemCount || (Array.isArray(data?.items) ? data.items.length : 0)
        // });
        
        // Fallback: Try to create activity anyway if we have order details
        // This handles cases where user ID format differs but the order belongs to the user
        const orderNumber = data?.orderNumber || data?.order_number;
        const orderId = data?.orderId || data?.order_id;
        
        if (orderNumber || orderId) {
          // console.log("🔄 ActivityContext: Attempting fallback activity creation despite user ID mismatch");
          // console.log("🔄 ActivityContext: This might be the user's order with different ID format");
          
          try {
            // Create activities with a note that user ID didn't match
            const itemCount = Array.isArray(data.items) ? data.items.length : (data.itemCount || 0);
            const items = Array.isArray(data.items) ? data.items : [];
            const firstItem = items.length > 0 ? items[0] : null;
            const itemName = firstItem?.name || data.itemName || "items";
            const educationLevel = data.education_level || data.educationLevel || "";
            
            let educationLevelDisplay = "";
            if (educationLevel) {
              if (educationLevel === "College" || educationLevel === "Higher Education") {
                educationLevelDisplay = "Higher Education (College)";
              } else {
                educationLevelDisplay = educationLevel;
              }
            }
            
            let description = "";
            if (orderNumber && orderNumber !== "N/A") {
              description = `Your order #${orderNumber} (${itemName}) has been released!`;
            } else {
              description = `Your order (${itemName}) has been released!`;
            }

            const activityUserId = user.id || user.uid;
            const releasedActivity = {
              id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              userId: activityUserId,
              timestamp: new Date().toISOString(),
              type: "order_released",
              description: description,
              orderId: orderId,
              orderNumber: orderNumber !== "N/A" ? orderNumber : null,
              items: items,
              itemCount: itemCount,
              productName: itemName,
              educationLevel: educationLevelDisplay || educationLevel,
            };

            setActivities((prev) => {
              const updated = [releasedActivity, ...prev];
              return updated;
            });
            // console.log("✅ ActivityContext: Fallback activities tracked successfully");
          } catch (fallbackError) {
            // console.error("❌ ActivityContext: Error in fallback activity creation:", fallbackError);
            // console.warn("⚠️ ActivityContext: This order will NOT create an activity for the current user");
            // console.warn("⚠️ ActivityContext: This might indicate a user ID mismatch between backend and frontend");
            // console.warn("⚠️ ActivityContext: Check backend logs to see what userId was sent in the event");
          }
        } else {
          // console.warn("⚠️ ActivityContext: This order will NOT create an activity for the current user");
          // console.warn("⚠️ ActivityContext: No order number or ID available for fallback matching");
          // console.warn("⚠️ ActivityContext: This might indicate a user ID mismatch between backend and frontend");
          // console.warn("⚠️ ActivityContext: Check backend logs to see what userId was sent in the event");
        }
      }
    };

    // console.log("🔌 ActivityContext: Registering order:claimed event listener");
    // console.log("🔌 ActivityContext: on function type:", typeof on, "is function:", typeof on === 'function');
    
    if (typeof on !== 'function') {
      // console.error("❌ ActivityContext: 'on' is not a function! Cannot register listener.");
      return;
    }
    
    try {
      on("order:claimed", handleOrderClaimed);
      // console.log("✅ ActivityContext: Successfully registered order:claimed listener");
      // console.log("✅ ActivityContext: Listener is now active and will receive events");
    } catch (error) {
      // console.error("❌ ActivityContext: Error registering order:claimed listener:", error);
    }

    // Cleanup on unmount
    return () => {
      // console.log("🧹 ActivityContext: Cleaning up order:claimed listener");
      off("order:claimed", handleOrderClaimed);
    };
  }, [user?.id, user?.uid, isConnected, on, off]);

  // Also listen for custom events from NotificationContext as a fallback
  // This ensures activities are created even if order:claimed Socket.IO event doesn't work
  useEffect(() => {
    const handleNotificationEvent = (event) => {
      const { orderNumber, orderId, items, itemCount, itemNames, message } = event.detail;
      // console.log("📝 ActivityContext: Received order-claimed-from-notification event:", event.detail);
      
      if (!orderNumber && !orderId) {
        // console.warn("⚠️ ActivityContext: Notification event has no order details");
        return;
      }
      
      try {
        // Create description from notification message or build it
        const itemsArray = Array.isArray(items) ? items : [];
        const firstItem = itemsArray.length > 0 ? itemsArray[0] : null;
        const itemName = firstItem?.name || itemNames || "items";
        const itemNamesValue = itemNames || (itemsArray.length > 0 ? itemsArray.map(i => i.name).join(", ") : "items");

        let description = message;
        if (!description || !description.trim()) {
          description = `Your order #${orderNumber} (${itemNamesValue}) has been released!`;
        }

        // Create single order_released activity
        const releasedActivity = {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user?.id || user?.uid,
          timestamp: new Date().toISOString(),
          type: "order_released",
          description: description,
          orderId: orderId,
          orderNumber: orderNumber,
          items: itemsArray,
          itemCount: itemCount || itemsArray.length,
          productName: itemName,
        };

        setActivities((prev) => {
          const updated = [releasedActivity, ...prev];
          return updated;
        });
        // console.log("✅ ActivityContext: Activities created successfully from notification");
      } catch (error) {
        // console.error("❌ ActivityContext: Error creating activities from notification event:", error);
      }
    };

    window.addEventListener('order-claimed-from-notification', handleNotificationEvent);
    // console.log("🔌 ActivityContext: Registered listener for order-claimed-from-notification custom event");

    return () => {
      window.removeEventListener('order-claimed-from-notification', handleNotificationEvent);
      // console.log("🧹 ActivityContext: Removed listener for order-claimed-from-notification custom event");
    };
  }, [user?.id, user?.uid]);

  /**
   * Load activities from localStorage
   */
  const loadActivities = () => {
    try {
      // Try both user.id and user.uid to handle different userId formats
      const userId = user?.id || user?.uid;
      if (!userId) {
        // console.log("📂 No user ID available, cannot load activities");
        return;
      }
      
      // Try loading with user.id first, then user.uid as fallback
      let saved = localStorage.getItem(`activities_${user.id}`);
      if (!saved && user.uid && user.uid !== user.id) {
        saved = localStorage.getItem(`activities_${user.uid}`);
        if (saved) {
          // console.log(`📂 Loaded activities using user.uid as key`);
        }
      }
      
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter activities to only include those belonging to the current user
        // This ensures activities with mismatched userIds are excluded
        const currentUserId = user.id || user.uid;
        const currentUserUid = user.uid;
        const currentUserDbId = user.id;
        
        const filtered = parsed.filter((activity) => {
          const activityUserId = activity.userId;
          if (!activityUserId) {
            // console.warn("⚠️ loadActivities: Activity missing userId, excluding:", activity);
            return false;
          }
          
          // Match if userId matches any of the current user's IDs
          const matches = 
            activityUserId === currentUserId ||
            activityUserId === currentUserUid ||
            activityUserId === currentUserDbId ||
            String(activityUserId) === String(currentUserId) ||
            String(activityUserId) === String(currentUserUid) ||
            String(activityUserId) === String(currentUserDbId);
          
          if (!matches) {
            // console.log("⚠️ loadActivities: Activity userId mismatch, excluding:", {
            //   activityUserId: activityUserId,
            //   currentUserId: currentUserId,
            //   activityType: activity.type,
            //   activityOrderNumber: activity.orderNumber
            // });
          }
          
          return matches;
        });
        
        const claimedCount = filtered.filter(a => a.type === 'claimed').length;
        const orderReleasedCount = filtered.filter(a => a.type === 'order_released').length;
        setActivities(filtered);
        // console.log(`📂 Loaded ${filtered.length} activities from localStorage (${claimedCount} claimed, ${orderReleasedCount} order_released) for user ${currentUserId}`);
        
        if (parsed.length !== filtered.length) {
          // console.log(`📂 Filtered out ${parsed.length - filtered.length} activities with mismatched userId`);
        }
      } else {
        // console.log("📂 No saved activities found in localStorage");
      }
    } catch (error) {
      // console.error("Error loading activities:", error);
    }
  };

  /**
   * Sync activities from claimed orders in database
   * This ensures activities are created even if Socket.IO events fail
   */
  const syncActivitiesFromClaimedOrders = async () => {
    try {
      if (!user?.id && !user?.uid) {
        // console.log("📡 syncActivitiesFromClaimedOrders: No user ID available");
        return;
      }

      const userId = user.id || user.uid;
      // console.log(`📡 syncActivitiesFromClaimedOrders: Syncing activities from claimed orders for user ${userId}`);

      // Import orderAPI
      const { orderAPI } = await import("../services/api");
      
      // Fetch claimed orders for this student
      const response = await orderAPI.getOrders({ status: "claimed" }, 1, 100);
      
      if (response?.data?.success && response.data.data) {
        const claimedOrders = Array.isArray(response.data.data) ? response.data.data : [];
        // console.log(`📡 syncActivitiesFromClaimedOrders: Found ${claimedOrders.length} claimed orders in database`);
        
        // Get existing activity order numbers to avoid duplicates
        const existingOrderNumbers = new Set(
          activities
            .filter(a => a.type === 'claimed' || a.type === 'order_released')
            .map(a => a.orderNumber)
            .filter(Boolean)
        );
        
        // Create activities for claimed orders that don't have activities yet
        const newActivities = [];
        for (const order of claimedOrders) {
          const orderNumber = order.order_number || order.orderNumber;
          const orderId = order.id;
          
          // Skip if we already have an activity for this order
          if (existingOrderNumbers.has(orderNumber)) {
            continue;
          }
          
          // Verify this order belongs to the current user
          const orderStudentId = order.student_id;
          const orderStudentEmail = order.student_email;
          const currentUserId = user.id || user.uid;
          const currentUserEmail = user.email;
          
          // Match by student_id or email
          const belongsToUser = 
            (orderStudentId && (orderStudentId === currentUserId || String(orderStudentId) === String(currentUserId))) ||
            (orderStudentEmail && orderStudentEmail === currentUserEmail);
          
          if (!belongsToUser) {
            // console.log(`📡 syncActivitiesFromClaimedOrders: Order ${orderNumber} does not belong to current user, skipping`);
            continue;
          }
          
          // Create activity from order data
          const items = Array.isArray(order.items) ? order.items : [];
          const itemCount = items.length || 0;
          const firstItem = items.length > 0 ? items[0] : null;
          const itemName = firstItem?.name || "items";
          const educationLevel = order.education_level || order.educationLevel || "";
          
          let educationLevelDisplay = "";
          if (educationLevel) {
            if (educationLevel === "College" || educationLevel === "Higher Education") {
              educationLevelDisplay = "Higher Education (College)";
            } else {
              educationLevelDisplay = educationLevel;
            }
          }
          
          const description = orderNumber
            ? `Your order #${orderNumber} (${itemName}) has been released!`
            : `Your order (${itemName}) has been released!`;

          const activityUserId = user.id || user.uid;
          const releasedActivity = {
            id: `activity_sync_${orderId}_${Date.now()}_released`,
            userId: activityUserId,
            timestamp: order.claimed_date || order.updated_at || order.created_at || new Date().toISOString(),
            type: "order_released",
            description: description,
            orderId: orderId,
            orderNumber: orderNumber,
            items: items,
            itemCount: itemCount,
            productName: itemName,
            educationLevel: educationLevelDisplay || educationLevel,
          };

          newActivities.push(releasedActivity);
          // console.log(`📡 syncActivitiesFromClaimedOrders: Created activities for order ${orderNumber}`);
        }
        
        if (newActivities.length > 0) {
          // console.log(`📡 syncActivitiesFromClaimedOrders: Adding ${newActivities.length} new activities from database`);
          setActivities((prev) => {
            // Merge with existing, avoiding duplicates by orderNumber
            const existingOrderNumbersSet = new Set(
              prev
                .filter(a => a.type === 'claimed' || a.type === 'order_released')
                .map(a => a.orderNumber)
                .filter(Boolean)
            );
            
            const uniqueNewActivities = newActivities.filter(a => 
              !a.orderNumber || !existingOrderNumbersSet.has(a.orderNumber)
            );
            
            return [...uniqueNewActivities, ...prev];
          });
          // console.log(`✅ syncActivitiesFromClaimedOrders: Successfully synced ${newActivities.length} activities from database`);
        } else {
          // console.log(`📡 syncActivitiesFromClaimedOrders: No new activities to sync`);
        }
      } else {
        // console.log(`📡 syncActivitiesFromClaimedOrders: No claimed orders found or API error`);
      }
    } catch (error) {
      // console.error("❌ syncActivitiesFromClaimedOrders: Error syncing activities from database:", error);
      // Don't throw - this is a background sync operation
    }
  };

  /**
   * Save activities to localStorage
   * Limit to 50 most recent activities to prevent quota exceeded errors
   */
  const saveActivities = () => {
    try {
      // Use consistent userId format (same as checkout activities use user.id)
      const userId = user?.id || user?.uid;
      if (!userId) {
        // console.warn("💾 Cannot save activities - no user ID available");
        return;
      }
      
      // Keep only the 50 most recent activities
      const limitedActivities = activities.slice(0, 50);
      const claimedCount = limitedActivities.filter(a => a.type === 'claimed').length;
      const orderReleasedCount = limitedActivities.filter(a => a.type === 'order_released').length;
      
      // Save using consistent key format (user.id if available, otherwise user.uid)
      const storageKey = `activities_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(limitedActivities));
      // console.log(`💾 Saved ${limitedActivities.length} activities to localStorage (${claimedCount} claimed, ${orderReleasedCount} order_released) using key: ${storageKey}`);
    } catch (error) {
      // console.error("Error saving activities:", error);
      // If still quota exceeded, try clearing old activities
      if (error.name === 'QuotaExceededError') {
        try {
          const userId = user?.id || user?.uid;
          if (userId) {
            const emergencyLimit = activities.slice(0, 20);
            localStorage.setItem(`activities_${userId}`, JSON.stringify(emergencyLimit));
            // console.log(`💾 Emergency save: Reduced to ${emergencyLimit.length} activities`);
          }
        } catch (e) {
          // console.error("Emergency save also failed:", e);
        }
      }
    }
  };

  /**
   * Add a new activity
   * @param {Object} activity - Activity details
   */
  const addActivity = (activity) => {
    // Use consistent userId format (user.id if available, otherwise user.uid)
    const userId = user?.id || user?.uid;
    if (!userId) {
      // console.warn("⚠️ ActivityContext: Cannot add activity - no user ID available");
      return;
    }

    const newActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userId, // Use consistent format
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
   * Get all activities for the current user
   * Filters activities to ensure only activities belonging to the current user are returned
   */
  const getActivities = () => {
    if (!user) {
      // console.log("📊 getActivities: No user, returning empty array");
      return [];
    }
    
    // Get current user IDs (both formats for compatibility)
    const currentUserId = user.id || user.uid;
    const currentUserUid = user.uid;
    const currentUserDbId = user.id;
    
    if (!currentUserId) {
      // console.log("📊 getActivities: No user ID available, returning empty array");
      return [];
    }
    
    // Filter activities to only include those belonging to the current user
    // Check both userId formats for compatibility
    const filtered = activities.filter((activity) => {
      const activityUserId = activity.userId;
      if (!activityUserId) {
        // console.warn("⚠️ getActivities: Activity missing userId:", activity);
        return false; // Exclude activities without userId
      }
      
      // Match if userId matches any of the current user's IDs
      const matches = 
        activityUserId === currentUserId ||
        activityUserId === currentUserUid ||
        activityUserId === currentUserDbId ||
        String(activityUserId) === String(currentUserId) ||
        String(activityUserId) === String(currentUserUid) ||
        String(activityUserId) === String(currentUserDbId);
      
      if (!matches) {
        // console.log("⚠️ getActivities: Activity userId mismatch:", {
        //   activityUserId: activityUserId,
        //   currentUserId: currentUserId,
        //   currentUserUid: currentUserUid,
        //   currentUserDbId: currentUserDbId,
        //   activityType: activity.type,
        //   activityOrderNumber: activity.orderNumber
        // });
      }
      
      return matches;
    });
    
    // Deduplicate: for claimed/order_released, keep only one per orderNumber (prefer order_released)
    const claimTypes = ["claimed", "order_released"];
    const onePerOrder = new Map();
    for (const a of filtered) {
      if (!claimTypes.includes(a.type) || !a.orderNumber) continue;
      const existing = onePerOrder.get(a.orderNumber);
      if (!existing || (existing.type !== "order_released" && a.type === "order_released")) {
        onePerOrder.set(a.orderNumber, a);
      }
    }
    const keptIds = new Set([...onePerOrder.values()].map((a) => a.id));
    const deduped = filtered.filter(
      (a) => !claimTypes.includes(a.type) || !a.orderNumber || keptIds.has(a.id)
    );

    return deduped;
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
