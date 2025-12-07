import React, { useState } from "react";
import { X, Calendar, Package, User, Mail } from "lucide-react";

/**
 * EditOrderModal Component
 * 
 * A detailed modal for viewing and editing order information
 * Matches the Figma design with two-column layout
 */
const EditOrderModal = ({ isOpen, onClose, order }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Parse items if they're stored as JSON string
  const parseItems = (items) => {
    if (!items) return [];
    if (typeof items === 'string') {
      try {
        return JSON.parse(items);
      } catch (e) {
        console.error('Failed to parse items:', e);
        return [];
      }
    }
    return Array.isArray(items) ? items : [];
  };

  const [editedItems, setEditedItems] = useState([]);

  // Update items when order changes
  React.useEffect(() => {
    if (order) {
      setEditedItems(parseItems(order.items));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Handle size change for an item
  const handleSizeChange = (itemIndex, newSize) => {
    const updated = [...editedItems];
    updated[itemIndex] = { ...updated[itemIndex], size: newSize };
    setEditedItems(updated);
  };

  // Handle release item
  const handleReleaseItem = () => {
    // TODO: Implement release item logic
    console.log("Release item clicked");
  };

  // Handle edit toggle
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save changes
      console.log("Saving changes:", editedItems);
      // TODO: Call API to update order
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-8 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-[#0C2340] mb-2">Orders</h2>
              <div className="flex items-center gap-2 text-sm text-[#e68b00] mb-1">
                <Calendar size={16} />
                <span className="font-medium">{formatDate(order.order_date || order.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package size={16} className="text-gray-500" />
                <span className="text-[#e68b00] font-semibold">Transaction no.#{order.order_number}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Release Item Button */}
              <button
                onClick={handleReleaseItem}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Release Item
              </button>

              {/* Edit Order Button */}
              <button
                onClick={handleEditToggle}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isEditing
                    ? "bg-[#e68b00] text-white hover:bg-[#d97706]"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isEditing ? "Save Changes" : "Edit Order"}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-red-50 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} className="text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT COLUMN: Order Details */}
            <div>
              <h3 className="text-lg font-bold text-[#0C2340] mb-4">Order Details</h3>
              
              <div className="space-y-4">
                {(editedItems || []).map((item, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex gap-4">
                      {/* Item Thumbnail */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                            <Package size={24} className="text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-bold text-[#0C2340] text-sm">{item.name}</h4>
                          <span className="text-gray-500 text-sm font-light">₱{(item.price || 0).toFixed(2)}</span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2">
                          Item Type: {item.category || "Uniform"}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-gray-600">Quantity: {item.quantity}</span>
                          
                          {/* Size Dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Size:</span>
                            <select
                              value={item.size || "N/A"}
                              onChange={(e) => handleSizeChange(index, e.target.value)}
                              disabled={!isEditing}
                              className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                                isEditing
                                  ? "border-2 border-[#e68b00] text-[#e68b00] bg-white hover:bg-amber-50 cursor-pointer"
                                  : "border border-gray-300 text-gray-700 bg-gray-100 cursor-not-allowed"
                              }`}
                            >
                              <option value="Small">Small (S)</option>
                              <option value="Medium">Medium (M)</option>
                              <option value="Large">Large (L)</option>
                              <option value="Extra Large">Extra Large (XL)</option>
                              <option value="N/A">N/A</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Student Info */}
            <div>
              <h3 className="text-lg font-bold text-[#0C2340] mb-4">Student Info</h3>
              
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                {/* Student Profile */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {order.student_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0C2340] text-base">{order.student_name}</h4>
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 min-w-[120px]">Grade Level:</span>
                    <span className="text-[#0C2340] font-medium">{order.education_level}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-600 min-w-[120px]">Grade Level Category:</span>
                    <span className="text-[#0C2340] font-medium">{order.education_level}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-gray-600 mt-0.5" />
                    <span className="text-gray-600 min-w-[100px]">Email:</span>
                    <span className="text-blue-600 font-medium break-all">{order.student_email}</span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-[#0C2340] text-base mb-4">Order History</h4>
                
                <div className="space-y-3">
                  {/* Order Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0C2340]">Order Date</p>
                      <p className="text-xs text-gray-600">
                        {formatDate(order.order_date || order.created_at)} at {formatTime(order.order_date || order.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Updated Status */}
                  {order.updated_at && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#e68b00] mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0C2340]">Updated: Status to {order.status}</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(order.updated_at)} at {formatTime(order.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Claimed Date */}
                  {order.claimed_date && (
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#0C2340]">Order Claimed</p>
                        <p className="text-xs text-gray-600">
                          {formatDate(order.claimed_date)} at {formatTime(order.claimed_date)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderModal;
