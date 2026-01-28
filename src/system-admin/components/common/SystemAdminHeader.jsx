import React, { useEffect, useState, useRef } from "react";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useSocket } from "../../../context/SocketContext";
import { splitDisplayName } from "../../../utils/displayName";
import { toast } from "react-hot-toast";
import NotificationDropdown from "../../../property-custodian/components/common/NotificationDropdown";
import { orderAPI } from "../../../services/api";

/**
 * SystemAdminHeader Component
 *
 * Displays the top header of the system admin dashboard with:
 * - Menu toggle button for sidebar
 * - "System Admin" title
 * - Notification bell (with dropdown)
 * - User profile section (responsive)
 *
 * Props:
 * - onMenuToggle: Function to toggle sidebar
 * - sidebarOpen: Boolean indicating if sidebar is open
 */

// localStorage key for storing cleared notification IDs
const CLEARED_NOTIFICATIONS_KEY = 'system_admin_cleared_notifications';

/**
 * Get cleared notification order IDs from localStorage
 * @returns {Set<string>} Set of cleared order IDs
 */
const getClearedNotifications = () => {
  try {
    const stored = localStorage.getItem(CLEARED_NOTIFICATIONS_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored);
    return new Set(parsed);
  } catch (error) {
    console.error("Error reading cleared notifications from localStorage:", error);
    return new Set();
  }
};

/**
 * Add order IDs to the cleared notifications list in localStorage
 * @param {string[]} orderIds - Array of order IDs to add
 */
const addToClearedNotifications = (orderIds) => {
  try {
    const cleared = getClearedNotifications();
    orderIds.forEach(id => cleared.add(id));
    localStorage.setItem(CLEARED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(cleared)));
  } catch (error) {
    console.error("Error saving cleared notifications to localStorage:", error);
    // Handle quota exceeded error gracefully
    if (error.name === 'QuotaExceededError') {
      console.warn("localStorage quota exceeded. Clearing old entries...");
      // Optionally clear old entries or notify user
    }
  }
};

const SystemAdminHeader = ({ onMenuToggle, sidebarOpen = true }) => {
  const { user } = useAuth();
  const { on, off, isConnected } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const notificationRef = useRef(null);

  const rawName = user?.displayName || user?.name || "";
  const displayName = rawName ? splitDisplayName(rawName).displayName : "System Admin";
  const userEmail = user?.email || "";
  const userAvatar = user?.photoURL || null;
  const avatarInitial = (rawName ? splitDisplayName(rawName).displayName : "S").charAt(0).toUpperCase() || "S";

  // Reset image load error when user photo URL changes
  useEffect(() => {
    setImageLoadError(false);
  }, [user?.photoURL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch pending orders on mount
  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        // Fetch pending orders (limit 5 for notifications)
        const response = await orderAPI.getOrders({ status: "pending" }, 1, 5);
        
        if (response.data && response.data.data) {
          const pendingOrders = response.data.data;
          
          // Get cleared notifications from localStorage
          const clearedNotifications = getClearedNotifications();
          
          // Filter out orders that have been cleared
          const filteredOrders = pendingOrders.filter(order => 
            !clearedNotifications.has(order.id)
          );
          
          // Transform orders to notifications
          const initialNotifications = filteredOrders.map(order => ({
            id: order.id,
            title: "New Order Received",
            message: `Order #${order.order_number} received from ${order.student_name || "Student"}`,
            type: "order",
            is_read: false, // Assume pending orders are unread in this context
            timestamp: order.created_at,
            orderId: order.id,
            data: order
          }));

          setNotifications(initialNotifications);
          setUnreadCount(initialNotifications.length);
        }
      } catch (error) {
        console.error("Failed to fetch pending orders for notifications:", error);
      }
    };

    fetchPendingOrders();
  }, []);

  // Listen for new orders
  useEffect(() => {
    if (!isConnected) return;

    const handleNewOrder = (data) => {
      console.log("🔔 New order received:", data);
      
      const orderId = data.orderId || data.id;
      
      // Check if this order has been cleared
      const clearedNotifications = getClearedNotifications();
      if (clearedNotifications.has(orderId)) {
        console.log("Order notification skipped - already cleared:", orderId);
        return;
      }
      
      // Check if we already have this notification (avoid duplicates from socket+fetch race)
      setNotifications(prev => {
        const exists = prev.some(n => n.orderId === orderId);
        if (exists) return prev;

        // Create new notification object
        const newNotification = {
          id: Date.now().toString(), // Temporary ID for local state
          title: "New Order Received",
          message: `Order #${data.orderNumber} received from ${data.studentId || "Student"}`,
          type: "order",
          is_read: false,
          timestamp: new Date().toISOString(),
          orderId: orderId, // Ensure we store ID
          data: data
        };

        // Increment unread count
        setUnreadCount(count => count + 1);
        
        return [newNotification, ...prev];
      });

      // Show toast
      toast.success(
        `New Order #${data.orderNumber} received from ${
          data.studentId || "Student"
        }`,
        {
          duration: 5000,
          position: "top-right",
          icon: "📦",
        }
      );
    };

    on("order:created", handleNewOrder);

    return () => {
      off("order:created", handleNewOrder);
    };
  }, [isConnected, on, off]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    // Recalculate unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };


  const handleClearAll = () => {
    // Extract all current notification order IDs
    const orderIds = notifications
      .map(n => n.orderId)
      .filter(id => id != null); // Filter out any null/undefined IDs
    
    // Store cleared notification IDs in localStorage
    if (orderIds.length > 0) {
      addToClearedNotifications(orderIds);
    }
    
    // Clear local state
    setNotifications([]);
    setUnreadCount(0);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between z-40 transition-all duration-300 ${
        sidebarOpen ? "left-64" : "left-20"
      }`}
    >
      {/* Left side - Menu toggle and department name */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} className="text-[#0C2340]" />
        </button>

        <h2 className="text-base sm:text-lg font-semibold text-[#0C2340] truncate max-w-[120px] sm:max-w-none">
          System Admin
        </h2>
      </div>

      {/* Right side - Notifications and user profile */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Notification bell */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className={`relative p-2 rounded-lg transition-colors ${
              showNotifications ? "bg-gray-100" : "hover:bg-gray-100"
            }`}
            aria-label="Notifications"
          >
            <Bell size={22} className="text-[#0C2340]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <NotificationDropdown 
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={handleMarkAsRead}
              onClearAll={handleClearAll}
            />
          )}
        </div>

        {/* User profile section */}
        <div className="flex items-center gap-2 sm:gap-3 pl-4 sm:pl-6 border-l border-gray-200">
          {/* Hide name/email on small screens */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-[#0C2340]">
              {displayName}
            </span>
            {userEmail && (
              <span className="text-xs text-gray-500">{userEmail}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {userAvatar && !imageLoadError ? (
              <img
                src={userAvatar}
                alt={displayName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#e68b00]"
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#003363] flex items-center justify-center border-2 border-[#e68b00] text-white text-sm font-semibold shrink-0"
                aria-label={displayName}
              >
                {avatarInitial}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SystemAdminHeader;




