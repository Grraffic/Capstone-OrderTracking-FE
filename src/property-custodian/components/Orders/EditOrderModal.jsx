import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Package, User, Mail } from "lucide-react";

/**
 * EditOrderModal Component
 *
 * A detailed modal for viewing and editing order information.
 * When finance changes item size (e.g. Small → Medium at student request), saving
 * updates the order items, regenerates the student's QR code with the new size, and
 * unreleased/available inventory automatically reflects the change (old size returned, new size reserved).
 */
import { itemsAPI, orderAPI } from "../../../services/api";

const EditOrderModal = ({ isOpen, onClose, order, onOrderUpdated, onOpenQRScanner }) => {
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
  const [itemDetailsMap, setItemDetailsMap] = useState({}); // Stores fetched details per item name
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Update items when order changes and fetch pricing details
  React.useEffect(() => {
    if (order) {
      const items = parseItems(order.items);
      setEditedItems(items);
      
      // Fetch details for each item to get pricing/stock info
      items.forEach(async (item) => {
        try {
          const response = await itemsAPI.getAvailableSizes(item.name, order.education_level);
          if (response.data.success) {
             setItemDetailsMap(prev => ({
                ...prev,
                [item.name]: response.data.data
             }));
             
             // If the current item has price 0, try to update it immediately from the fetched data
             if (!item.price && item.size) {
                const matchingVariant = response.data.data.find(v => v.size === item.size);
                if (matchingVariant) {
                   setEditedItems(prevItems => prevItems.map(i => {
                      if (i.name === item.name && i.size === item.size) {
                         return { ...i, price: matchingVariant.price };
                      }
                      return i;
                   }));
                }
             }
          }
        } catch (error) {
          console.error(`Failed to fetch details for ${item.name}`, error);
        }
      });
    }
  }, [order]);
  
  // Helper to get price for a specific size
  const getPriceForSize = (itemName, size) => {
     const details = itemDetailsMap[itemName] || [];
     // Try to find exact size match or abbreviation match
     const variant = details.find(d => {
        // Handle mapped sizes (e.g. "Small" vs "Small (S)")
        // Since we normalized backend response to be "Small", "Medium" etc.
        // And frontend usually has "Small", "Medium" etc.
        return d.size === size || size.includes(d.size) || d.size.includes(size);
     });
     return variant ? variant.price : 0;
  };

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
    const item = updated[itemIndex];
    
    // Lookup new price
    const newPrice = getPriceForSize(item.name, newSize);
    
    updated[itemIndex] = { 
       ...updated[itemIndex], 
       size: newSize,
       price: newPrice || updated[itemIndex].price // Fallback to existing if 0
    };
    setEditedItems(updated);
  };

  // Handle release item: close edit modal and open QR scanner to scan student's QR for release
  const handleReleaseItem = () => {
    onClose?.();
    onOpenQRScanner?.();
  };

  // Handle edit toggle / save
  const handleEditToggle = async () => {
    if (!isEditing) {
      setIsEditing(true);
      setSaveError(null);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const totalAmount = (editedItems || []).reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0
      );
      const payload = {
        items: editedItems,
        total_amount: totalAmount,
      };
      const res = await orderAPI.updateOrder(order.id, payload);
      if (res?.data) {
        setIsEditing(false);
        onOrderUpdated?.();
        onClose?.();
      } else {
        setSaveError(res?.message || "Failed to update order");
      }
    } catch (err) {
      setSaveError(err?.response?.data?.message || err?.message || "Failed to update order");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000
      }}
      onClick={(e) => {
        // Close modal when clicking outside (but not on the modal content)
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col relative z-[10001]"
        style={{ zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#0C2340] mb-1 sm:mb-2">Orders</h2>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#e68b00] mb-1">
                <Calendar size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="font-medium truncate">{formatDate(order.order_date || order.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Package size={14} className="sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                <span className="text-[#e68b00] font-semibold truncate">Transaction no.#{order.order_number}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
              {/* Release Item Button */}
              <button
                onClick={handleReleaseItem}
                className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm whitespace-nowrap"
              >
                <span className="hidden sm:inline">Release Item</span>
                <span className="sm:hidden">Release</span>
              </button>

              {/* Edit Order Button */}
              <button
                onClick={handleEditToggle}
                disabled={saving}
                className={`px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  isEditing
                    ? "bg-[#e68b00] text-white hover:bg-[#d97706] disabled:opacity-60"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {saving ? "Saving..." : isEditing ? "Save" : "Edit"}
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X size={18} className="sm:w-5 sm:h-6 text-red-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Save error */}
        {saveError && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-2 px-3 sm:px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* LEFT COLUMN: Order Details */}
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#0C2340] mb-3 sm:mb-4">Order Details</h3>
              
              <div className="space-y-3 sm:space-y-4">
                {(editedItems || []).map((item, index) => (
                  <div 
                    key={index}
                    className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Item Thumbnail */}
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                            <Package size={18} className="sm:w-6 sm:h-6 text-gray-600" />
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1 gap-2">
                          <h4 className="font-bold text-[#0C2340] text-xs sm:text-sm truncate">{item.name}</h4>
                          <span className="text-gray-500 text-xs sm:text-sm font-light flex-shrink-0">₱{(item.price || getPriceForSize(item.name, item.size) || 0).toFixed(2)}</span>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-1.5 sm:mb-2">
                          Item Type: {item.category || "Uniform"}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
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
                              {/* If we have fetched details, use them to populate options */}
                              {itemDetailsMap[item.name] && itemDetailsMap[item.name].length > 0 ? (
                                 itemDetailsMap[item.name].map((variant, vIdx) => (
                                    <option key={vIdx} value={variant.size}>
                                       {variant.size}
                                    </option>
                                 ))
                              ) : (
                                 // Fallback options
                                <>
                                  <option value="Small">Small (S)</option>
                                  <option value="Medium">Medium (M)</option>
                                  <option value="Large">Large (L)</option>
                                  <option value="Extra Large">Extra Large (XL)</option>
                                  <option value="N/A">N/A</option>
                                </>
                              )}
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
              <h3 className="text-base sm:text-lg font-bold text-[#0C2340] mb-3 sm:mb-4">Student Info</h3>
              
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200 mb-4 sm:mb-6">
                {/* Student Profile */}
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md">
                    {order.student_data?.photo_url || order.student_data?.avatar_url ? (
                      <img 
                        src={order.student_data.photo_url || order.student_data.avatar_url} 
                        alt={order.student_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full flex items-center justify-center text-white font-bold text-base sm:text-xl ${
                        order.student_data?.photo_url || order.student_data?.avatar_url ? 'hidden' : ''
                      }`}
                    >
                      {order.student_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'N/A'}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-[#0C2340] text-sm sm:text-base truncate">{order.student_name}</h4>
                    {order.student_data?.email && (
                       <p className="text-xs text-gray-500 truncate">{order.student_data.email}</p>
                    )}
                  </div>
                </div>

                {/* Student Details */}
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-gray-600 sm:min-w-[140px]">Education Level:</span>
                    <span className="text-[#0C2340] font-medium sm:ml-[8px]">{order.education_level || "All Education Levels"}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-gray-600 sm:min-w-[140px]">Grade Level Category:</span>
                    <span className="text-[#0C2340] font-medium">
                      {(() => {
                        // Get course year & level from student_data (from student settings)
                        const courseYearLevel = order.student_data?.course_year_level || 
                                               order.student_data?.courseYearLevel || 
                                               order.course_year_level ||
                                               order.courseYearLevel;
                        
                        // Always show course year level if available (e.g., "BSIS 1st Year", "Grade 10")
                        if (courseYearLevel) {
                          return courseYearLevel;
                        }
                        
                        // If education level is College but no course year level, show N/A
                        if (order.education_level === "College") {
                          return "N/A";
                        }
                        
                        // For non-college, show the education level as fallback
                        return order.education_level || "All Education Levels";
                      })()}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="sm:w-3.5 sm:h-3.5 text-gray-600" />
                      <span className="text-gray-600 sm:min-w-[100px]">Email:</span>
                    </div>
                    <span className="text-blue-600 font-medium break-all">{order.student_email}</span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-200">
                <h4 className="font-bold text-[#0C2340] text-sm sm:text-base mb-3 sm:mb-4">Order History</h4>
                
                <div className="space-y-2.5 sm:space-y-3">
                  {/* Order Date */}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#0C2340]">Order Date</p>
                      <p className="text-xs text-gray-600 break-words">
                        {formatDate(order.order_date || order.created_at)} at {formatTime(order.order_date || order.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Updated Status */}
                  {order.updated_at && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#e68b00] mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#0C2340]">Updated: Status to {order.status}</p>
                        <p className="text-xs text-gray-600 break-words">
                          {formatDate(order.updated_at)} at {formatTime(order.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Claimed Date */}
                  {order.claimed_date && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#0C2340]">Order Claimed</p>
                        <p className="text-xs text-gray-600 break-words">
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
    </div>,
    document.body
  );
};

export default EditOrderModal;
