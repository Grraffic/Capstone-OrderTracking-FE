import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import socketClient from "../utils/socketClient";
import axios from "axios";

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.uid]);

  // Listen for Socket.IO restock notifications
  useEffect(() => {
    if (!user?.uid) {
      console.log("⚠️ NotificationContext: No user.uid, skipping Socket.IO setup");
      return;
    }

    console.log("🔌 NotificationContext: Setting up Socket.IO for user:", user.uid);

    // Connect to Socket.IO server
    socketClient.connect();
    console.log("🔌 NotificationContext: Socket.IO connection initiated");

    // Listen for inventory restock events
    const handleInventoryRestocked = (data) => {
      console.log("📡 Received inventory:restocked event:", data);
      console.log("🔍 Current user.uid:", user.uid);
      console.log("🔍 Event userId:", data.userId);
      console.log("🔍 Match?", data.userId === user.uid);

      // Only add notification if it's for the current user
      if (data.userId === user.uid) {
        const newNotification = data.notification;

        // Add to notifications list
        setNotifications((prev) => [newNotification, ...prev]);

        // Increment unread count
        setUnreadCount((prev) => prev + 1);

        console.log("✅ Notification added: Item restocked");

        // Show browser notification if permission granted
        if (Notification.permission === "granted") {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/logo.png",
          });
        }
      } else {
        console.log("⚠️ Restock notification received but userId doesn't match current user");
        console.log("⚠️ Expected:", user.uid);
        console.log("⚠️ Received:", data.userId);
      }
    };

    socketClient.on("inventory:restocked", handleInventoryRestocked);

    // Request notification permission
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      socketClient.off("inventory:restocked", handleInventoryRestocked);
    };
  }, [user?.uid]);

  /**
   * Fetch all notifications for the current user
   */
  const fetchNotifications = async (unreadOnly = false) => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/notifications`, {
        params: {
          userId: user.uid,
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
    if (!user?.uid) return;

    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`, {
        params: {
          userId: user.uid,
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
    if (!user?.uid) return;

    try {
      const response = await axios.patch(
        `${API_URL}/notifications/mark-all-read`,
        {
          userId: user.uid,
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

