import React from "react";
import { X, Check, Trash2, Package, Info } from "lucide-react";

import { useNavigate } from "react-router-dom";

/**
 * NotificationDropdown Component
 * 
 * Displays a list of notifications in a dropdown menu.
 * Used in the AdminHeader component.
 */
const NotificationDropdown = ({ 
  notifications = [], 
  onClose, 
  onMarkAsRead, 
  onClearAll,
  onViewOrder
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification) => {
    onMarkAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.data?.orderId || notification.orderId) {
      if (onViewOrder) {
        onViewOrder(notification.data?.orderId || notification.orderId);
      } else {
        navigate("/admin/orders");
      }
    }
  };

  return (
    <div className="absolute top-16 right-4 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fade-in-down origin-top-right">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
              <Package size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No new notifications</p>
            <p className="text-xs text-gray-400 mt-1">We'll notify you when new orders arrive</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 hover:bg-blue-50 transition-colors cursor-pointer ${
                  !notification.is_read ? "bg-blue-50/50" : "bg-white"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex gap-3">
                  <div className={`mt-1 min-w-[36px] h-9 rounded-full flex items-center justify-center ${
                    notification.type === 'order' || notification.type?.includes('order') 
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {notification.type === 'order' || notification.type?.includes('order') ? (
                      <Package size={18} />
                    ) : (
                      <Info size={18} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 mb-0.5">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 leading-snug mb-2">
                      {notification.message}
                    </p>
                    <span className="text-xs text-gray-400">
                      {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  
                  {!notification.is_read && (
                    <div className="mt-2 w-2 h-2 bg-blue-500 rounded-full shrink-0"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <button 
            onClick={() => navigate('/admin/orders')}
            className="text-sm text-[#003363] font-medium hover:underline"
          >
            View All Orders
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
