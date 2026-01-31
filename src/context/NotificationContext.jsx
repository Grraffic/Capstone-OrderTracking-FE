import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import axios from "axios";
import toast from "react-hot-toast";

const NotificationContext = createContext();

/**
 * useNotification Hook
 * Access notification context
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

/**
 * NotificationProvider - Manages user notifications
 * Handles:
 * - Fetching notifications from backend
 * - Real-time Socket.IO updates for restock notifications
 * - Marking notifications as read
 * - Notification count management
 */
export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { on, off, isConnected } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user?.uid || user?.id) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Periodically refresh notifications to catch any missed Socket.IO events
      // This ensures notifications are received even if Socket.IO event doesn't match
      const refreshInterval = setInterval(() => {
        fetchNotifications();
        fetchUnreadCount();
      }, 60000); // Refresh every 60 seconds
      
      return () => clearInterval(refreshInterval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.uid, user?.id]);

  // Listen for Socket.IO restock notifications
  useEffect(() => {
    const currentUserId = user?.uid || user?.id;
    if (!currentUserId || !isConnected) {
      console.log("⚠️ NotificationContext: No user or socket not connected, skipping event setup");
      return;
    }

    console.log("🔌 NotificationContext: Setting up Socket.IO listeners for user:", currentUserId);

    // Listen for inventory restock events
    const handleInventoryRestocked = (data) => {
      console.log("📡 Received items:restocked event:", data);
      console.log("🔍 Current user.uid:", user?.uid);
      console.log("🔍 Current user.id:", user?.id);
      console.log("🔍 Event userId:", data.userId);

      // Only add notification if it's for the current user (support both uid and id)
      const currentUserId = user?.uid || user?.id;
      const eventUserId = data.userId;
      const isMatch = eventUserId && currentUserId && (eventUserId === currentUserId || String(eventUserId) === String(currentUserId));
      console.log("🔍 Match?", isMatch);

      if (isMatch) {
        const newNotification = data.notification;

        // Check if notification already exists (avoid duplicates)
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === newNotification.id);
          if (exists) {
            console.log("⚠️ Notification already exists, skipping duplicate");
            return prev;
          }
          return [newNotification, ...prev];
        });

        // Increment unread count
        setUnreadCount((prev) => prev + 1);

        console.log("✅ Notification added: Item restocked");

        // Show browser notification if permission granted and API is available
        // Note: Notification API is not available in iOS WebKit (Safari/Chrome/Brave)
        if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
          try {
            new window.Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/logo.png",
            });
          } catch (error) {
            console.warn("Failed to show browser notification:", error);
          }
        }
      } else {
        console.log("⚠️ Restock notification received but userId doesn't match current user");
        console.log("⚠️ Expected:", user?.uid || user?.id);
        console.log("⚠️ Received:", data.userId);
      }
    };

    on("items:restocked", handleInventoryRestocked);

    // Listen for order release notifications
    const handleOrderReleased = (data) => {
      console.log("📡 Received notification:created event:", data);
      console.log("🔍 Current user.uid:", user?.uid);
      console.log("🔍 Current user.id:", user?.id);
      console.log("🔍 Event userId:", data.userId);
      
      // Check if this notification is for the current user (support both uid and id)
      const currentUserId = user?.uid || user?.id;
      const eventUserId = data.userId;
      const isMatch = eventUserId && currentUserId && (eventUserId === currentUserId || String(eventUserId) === String(currentUserId));
      console.log("🔍 Match?", isMatch);

      // Only add notification if it's for the current user
      if (isMatch && data.notification) {
        const newNotification = data.notification;

        // Add to notifications list
        setNotifications((prev) => {
          // Check if notification already exists (avoid duplicates)
          const exists = prev.some((n) => n.id === newNotification.id);
          if (exists) return prev;
          return [newNotification, ...prev];
        });

        // Increment unread count
        setUnreadCount((prev) => prev + 1);

        console.log("✅ Notification added: Order released");

        // Show toast notification
        toast.success(newNotification.message || "Your order has been released!", {
          duration: 4000,
          icon: "✅",
        });

        // Show browser notification if permission granted and API is available
        // Note: Notification API is not available in iOS WebKit (Safari/Chrome/Brave)
        if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
          try {
            new window.Notification(newNotification.title, {
              body: newNotification.message,
              icon: "/logo.png",
            });
          } catch (error) {
            console.warn("Failed to show browser notification:", error);
          }
        }
      } else {
        console.log("⚠️ Order release notification received but userId doesn't match current user");
        console.log("⚠️ Expected:", user?.uid || user?.id);
        console.log("⚠️ Received:", data.userId);
      }
    };

    on("notification:created", handleOrderReleased);

    // Request notification permission if API is available
    // Note: Notification API is not available in iOS WebKit (Safari/Chrome/Brave)
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        if (window.Notification.permission === "default") {
          window.Notification.requestPermission().catch((error) => {
            console.warn("Failed to request notification permission:", error);
          });
        }
      } catch (error) {
        console.warn("Notification API not supported on this device:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      off("items:restocked", handleInventoryRestocked);
      off("notification:created", handleOrderReleased);
    };
  }, [user?.uid, user?.id, isConnected, on, off]);

  /**
   * Fetch all notifications for the current user
   */
  const fetchNotifications = async (unreadOnly = false) => {
    const userId = user?.uid || user?.id;
    if (!userId) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notifications`, {
        params: {
          userId: userId,
          unreadOnly,
        },
      });

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = async () => {
    const userId = user?.uid || user?.id;
    if (!userId) return;

    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        params: {
          userId: userId,
        },
      });

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/notifications/${notificationId}/read`
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, is_read: true } : notif
          )
        );

        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    const userId = user?.uid || user?.id;
    if (!userId) return;

    try {
      const response = await axios.patch(
        `${API_URL}/notifications/mark-all-read`,
        {
          userId: userId,
        }
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, is_read: true }))
        );

        // Reset unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   */
  const deleteNotification = async (notificationId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/notifications/${notificationId}`
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== notificationId)
        );

        // Decrement unread count if notification was unread
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  /**
   * Clear all notifications (local only)
   */
  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;

