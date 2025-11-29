import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Check,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { useNotification } from "../../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Get user display name, email, and photo
  const userName = user?.displayName || user?.name || "Student";
  const userEmail = user?.email || "";
  const userPhoto = user?.photoURL || user?.photo_url || null;

  // Determine if user is a student based on email
  const isStudent = userEmail.endsWith("@student.laverdad.edu.ph");

  // Get cart item count
  const cartCount = getCartCount();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    if (isProfileOpen || isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen, isNotificationOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    // Navigate to orders page if it's a restock notification
    if (notification.type === "restock") {
      navigate("/student/profile");
      setIsNotificationOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-2 sm:px-4 md:px-6 lg:px-8 bg-transparent">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 shadow-gray-800 rounded-lg sm:rounded-xl shadow-md bg-white/90 backdrop-blur-md h-16 sm:h-18 md:h-20">
          {/* Left side - Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="../../../assets/image/LV Logo.png"
              alt="La Verdad Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-full"
              onError={(e) => {
                e.target.src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%233B82F6"/%3E%3Ctext x="50" y="60" font-size="40" text-anchor="middle" fill="white"%3ELV%3C/text%3E%3C/svg%3E';
              }}
            />
            <h1 className="text-base sm:text-lg md:text-xl font-semibold">
              <span className="text-[#003363] font-SFPro">La Verdad</span>
              <span className="text-[#F28C28] font-SFPro"> OrderFlow</span>
            </h1>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3 md:space-x-4">
            {/* Notification Icon - Desktop */}
            <div className="hidden md:block relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Notifications {unreadCount > 0 && `(${unreadCount})`}
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Notification List */}
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.is_read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatNotificationTime(notification.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => handleDeleteNotification(e, notification.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                aria-label="Delete notification"
                              >
                                <Trash2 className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 text-center">
                      <button
                        onClick={() => {
                          navigate("/student/profile");
                          setIsNotificationOpen(false);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Icon - Desktop */}
            <button
              onClick={() => navigate("/student/cart")}
              className="hidden md:flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 relative"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e68b00] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile - Desktop */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 hover:bg-gray-50 rounded-full pl-1 pr-3 py-1 transition-colors"
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#C5A572]"
                    onError={(e) => {
                      console.error("❌ Failed to load profile image:", userPhoto);
                      console.error("Image error:", e);
                      // Fallback to initials if image fails to load
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log("✅ Profile image loaded successfully:", userPhoto);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#003363] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-800">
                    {userName}
                  </span>
                  {isStudent && (
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full">
                      Student
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userEmail}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/student/profile");
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      // Navigate to orders page
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>My Orders</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate("/student/settings");
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>

                  <hr className="my-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 pt-4 px-3 sm:px-4 md:px-6 bg-white/90 backdrop-blur-md rounded-b-lg shadow-md">
            <div className="flex flex-col space-y-2">
              {/* User Info - Mobile */}
              <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#C5A572]"
                    onError={(e) => {
                      console.error("❌ Failed to load profile image (mobile):", userPhoto);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log("✅ Profile image loaded successfully (mobile):", userPhoto);
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-[#003363] rounded-full flex items-center justify-center text-white font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800">
                    {userName}
                  </span>
                  {isStudent && (
                    <span className="text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                      Student
                    </span>
                  )}
                </div>
              </div>

              {/* Notifications - Mobile */}
              <button
                onClick={() => {
                  navigate("/student/profile");
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative">
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
              </button>

              {/* Cart - Mobile */}
              <button
                onClick={() => {
                  navigate("/student/cart");
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center relative">
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#e68b00] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  Shopping Cart {cartCount > 0 && `(${cartCount})`}
                </span>
              </button>

              <hr className="my-2" />

              {/* Profile - Mobile */}
              <button
                onClick={() => {
                  navigate("/student/profile");
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">
                  My Profile
                </span>
              </button>

              {/* Orders - Mobile */}
              <button className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">
                  My Orders
                </span>
              </button>

              {/* Settings - Mobile */}
              <button
                onClick={() => {
                  navigate("/student/settings");
                  setIsMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">
                  Settings
                </span>
              </button>

              <hr className="my-2" />

              {/* Logout - Mobile */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-600">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
