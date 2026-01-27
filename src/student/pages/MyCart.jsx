import React, { useState, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import { groupCartItemsByVariations } from "../../utils/groupCartItems";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import Footer from "../../components/common/Footer";
import toast from "react-hot-toast";

/**
 * MyCart Component
 *
 * Student cart page displaying selected items with the following features:
 * - View all cart items with product details
 * - Edit mode to select and remove multiple items
 * - Update quantities with +/- controls
 * - Responsive design (mobile, tablet, desktop)
 * - No pricing displayed (uniforms are free for students)
 * - Order submission from cart
 */
const MyCart = () => {
  const navigate = useNavigate();
  const { items, loading, updateCartItem, removeFromCart, clearCart } =
    useCart();
  const { useCartCheckout } = useCheckout();
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Group items by variations
  const groupedItems = useMemo(() => {
    return groupCartItemsByVariations(items);
  }, [items]);

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate("/all-products");
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (editMode) {
      setSelectedItems([]); // Clear selections when exiting edit mode
    }
  };

  // Handle checkbox selection
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle select all (select all individual cart items, not groups)
  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  // Handle quantity update
  const handleQuantityChange = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  // Handle remove selected items
  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to remove");
      return;
    }

    try {
      // Remove all selected items
      await Promise.all(selectedItems.map((itemId) => removeFromCart(itemId)));
      setSelectedItems([]);
      setEditMode(false);
      toast.success(`${selectedItems.length} item(s) removed from cart`);
    } catch (error) {
      console.error("Failed to remove items:", error);
      toast.error("Failed to remove items");
    }
  };

  // Handle order now
  const handleOrderNow = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Set to cart checkout mode (all items from cart)
    useCartCheckout();

    // Navigate to checkout page
    navigate("/student/checkout");
  };

  // Empty cart state
  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <HeroSection heading="Item Cart" align="bottom-center" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-10 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Start adding items to your cart to see them here
              </p>
              <button
                onClick={() => navigate("/all-products")}
                className="px-6 py-3 bg-[#e68b00] text-white rounded-lg hover:bg-[#d17d00] transition-colors font-medium"
              >
                Browse Products
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection heading="Item Cart" align="bottom-center" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-10 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Cart Container */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                {/* Edit Button */}
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 text-sm font-medium text-[#0C2340] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {editMode ? "Done" : "Edit"}
                </button>
              </div>

              {/* Title and Item Count */}
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  <span className="text-[#0C2340]">My</span>
                  <span className="text-[#e68b00]">Cart</span>
                </h1>
                <div className="flex items-center justify-center text-gray-600">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    {groupedItems.length} {groupedItems.length === 1 ? "Product" : "Products"} 
                    {items.length > groupedItems.length && (
                      <span className="ml-1 text-gray-500">
                        ({items.length} {items.length === 1 ? "item" : "items"})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Edit Mode Actions */}
              {editMode && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-[#0C2340] hover:underline font-medium"
                  >
                    {selectedItems.length === items.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove ({selectedItems.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product List - Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {editMode && <th className="w-12 px-6 py-4"></th>}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0C2340]">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0C2340]">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0C2340]">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0C2340]">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groupedItems.map((group) => {
                    const isExpanded = expandedGroups.has(group.groupKey);
                    const hasMultipleVariations = group.variations.length > 1;
                    
                    return (
                      <React.Fragment key={group.groupKey}>
                        {/* Main Group Row */}
                        <tr className="hover:bg-gray-50 transition-colors bg-gray-50">
                          {/* Checkbox */}
                          {editMode && (
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={group.variations.every((v) =>
                                  selectedItems.includes(v.id)
                                )}
                                onChange={() => {
                                  const allSelected = group.variations.every((v) =>
                                    selectedItems.includes(v.id)
                                  );
                                  if (allSelected) {
                                    setSelectedItems((prev) =>
                                      prev.filter(
                                        (id) =>
                                          !group.variations.some((v) => v.id === id)
                                      )
                                    );
                                  } else {
                                    setSelectedItems((prev) => [
                                      ...prev,
                                      ...group.variations
                                        .filter((v) => !prev.includes(v.id))
                                        .map((v) => v.id),
                                    ]);
                                  }
                                }}
                                className="w-5 h-5 text-[#e68b00] border-gray-300 rounded focus:ring-[#e68b00]"
                              />
                            </td>
                          )}

                          {/* Product Info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <img
                                src={group.image || "/assets/image/card1.png"}
                                alt={group.name}
                                className="w-16 h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src = "/assets/image/card1.png";
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {group.name}
                                </p>
                                <p className="text-sm text-[#e68b00]">
                                  ({group.educationLevel})
                                </p>
                                {hasMultipleVariations && (
                                  <button
                                    onClick={() => toggleGroup(group.groupKey)}
                                    className="mt-1 flex items-center text-xs text-gray-600 hover:text-[#e68b00] transition-colors"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <ChevronUp className="w-3 h-3 mr-1" />
                                        Hide variations
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3 mr-1" />
                                        Show {group.variations.length} size{group.variations.length > 1 ? "s" : ""}
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Size - Show first variation or "Multiple" */}
                          <td className="px-6 py-4">
                            {hasMultipleVariations ? (
                              <span className="text-gray-700">
                                {isExpanded ? "Multiple" : `${group.variations[0].size} +${group.variations.length - 1}`}
                              </span>
                            ) : (
                              <span className="text-gray-700">
                                {group.variations[0]?.size || "N/A"}
                              </span>
                            )}
                          </td>

                          {/* Total Quantity */}
                          <td className="px-6 py-4">
                            <span className="text-gray-700 font-medium">
                              {group.totalQuantity}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4">
                            <span className="font-semibold text-green-600">
                              Free
                            </span>
                          </td>
                        </tr>

                        {/* Variations Rows (when expanded) */}
                        {isExpanded &&
                          group.variations.map((variation) => (
                            <tr
                              key={variation.id}
                              className="hover:bg-orange-50 transition-colors bg-orange-50/30"
                            >
                              {/* Checkbox */}
                              {editMode && (
                                <td className="px-6 py-4 pl-16">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(variation.id)}
                                    onChange={() => handleSelectItem(variation.id)}
                                    className="w-5 h-5 text-[#e68b00] border-gray-300 rounded focus:ring-[#e68b00]"
                                  />
                                </td>
                              )}

                              {/* Variation Info */}
                              <td className="px-6 py-4 pl-16">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 rounded-full bg-[#e68b00]"></div>
                                  <span className="text-sm text-gray-600">
                                    {variation.size}
                                  </span>
                                </div>
                              </td>

                              {/* Size */}
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-700">
                                  {variation.size}
                                </span>
                              </td>

                              {/* Quantity */}
                              <td className="px-6 py-4">
                                {editMode ? (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          variation.id,
                                          variation.quantity,
                                          -1
                                        )
                                      }
                                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                      disabled={variation.quantity <= 1}
                                    >
                                      <Minus className="w-4 h-4 text-gray-700" />
                                    </button>
                                    <span className="w-8 text-center font-medium text-sm">
                                      {variation.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleQuantityChange(
                                          variation.id,
                                          variation.quantity,
                                          1
                                        )
                                      }
                                      className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                    >
                                      <Plus className="w-4 h-4 text-gray-700" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-700">
                                    {variation.quantity}
                                  </span>
                                )}
                              </td>

                              {/* Price */}
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-green-600">
                                  Free
                                </span>
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product List - Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {groupedItems.map((group) => {
                const isExpanded = expandedGroups.has(group.groupKey);
                const hasMultipleVariations = group.variations.length > 1;

                return (
                  <div key={group.groupKey} className="p-4">
                    {/* Main Group Card */}
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      {editMode && (
                        <input
                          type="checkbox"
                          checked={group.variations.every((v) =>
                            selectedItems.includes(v.id)
                          )}
                          onChange={() => {
                            const allSelected = group.variations.every((v) =>
                              selectedItems.includes(v.id)
                            );
                            if (allSelected) {
                              setSelectedItems((prev) =>
                                prev.filter(
                                  (id) =>
                                    !group.variations.some((v) => v.id === id)
                                )
                              );
                            } else {
                              setSelectedItems((prev) => [
                                ...prev,
                                ...group.variations
                                  .filter((v) => !prev.includes(v.id))
                                  .map((v) => v.id),
                              ]);
                            }
                          }}
                          className="mt-1 w-5 h-5 text-[#e68b00] border-gray-300 rounded focus:ring-[#e68b00]"
                        />
                      )}

                      {/* Product Image */}
                      <img
                        src={group.image || "/assets/image/card1.png"}
                        alt={group.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "/assets/image/card1.png";
                        }}
                      />

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {group.name}
                        </h3>
                        <p className="text-sm text-[#e68b00] mb-2">
                          ({group.educationLevel})
                        </p>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">
                              {hasMultipleVariations
                                ? `Sizes: ${group.variations.length}`
                                : `Size: ${group.variations[0]?.size || "N/A"}`}
                            </span>
                          </div>
                          <span className="font-semibold text-green-600">
                            Free
                          </span>
                        </div>

                        {/* Total Quantity */}
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Total Qty:</span>{" "}
                          {group.totalQuantity}
                        </div>

                        {/* Expand/Collapse Button */}
                        {hasMultipleVariations && (
                          <button
                            onClick={() => toggleGroup(group.groupKey)}
                            className="flex items-center text-xs text-[#e68b00] hover:text-[#d17d00] font-medium mt-2"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4 mr-1" />
                                Hide variations
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Show {group.variations.length} size{group.variations.length > 1 ? "s" : ""}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Variations List (when expanded) */}
                    {isExpanded && hasMultipleVariations && (
                      <div className="mt-4 ml-12 space-y-3">
                        {group.variations.map((variation) => (
                          <div
                            key={variation.id}
                            className="flex items-center gap-3 p-3 rounded-xl border-2 bg-orange-50 border-[#e68b00] shadow-sm"
                          >
                            {/* Checkbox */}
                            {editMode && (
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(variation.id)}
                                onChange={() => handleSelectItem(variation.id)}
                                className="w-4 h-4 text-[#e68b00] border-gray-300 rounded focus:ring-[#e68b00]"
                              />
                            )}

                            {/* Variation Info */}
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#0C2340]">
                                {group.name} {variation.size}
                              </p>
                              <p className="text-xs text-[#e68b00]">
                                Size: {variation.size}
                              </p>
                            </div>

                            {/* Quantity Controls */}
                            {editMode ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      variation.id,
                                      variation.quantity,
                                      -1
                                    )
                                  }
                                  className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full transition-colors border border-gray-300"
                                  disabled={variation.quantity <= 1}
                                >
                                  <Minus className="w-3 h-3 text-gray-700" />
                                </button>
                                <span className="w-6 text-center font-medium text-sm">
                                  {variation.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleQuantityChange(
                                      variation.id,
                                      variation.quantity,
                                      1
                                    )
                                  }
                                  className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full transition-colors border border-gray-300"
                                >
                                  <Plus className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Qty:</span>{" "}
                                {variation.quantity}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer - Order Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={handleOrderNow}
                disabled={items.length === 0 || loading}
                className="w-full py-4 bg-[#e68b00] text-white font-semibold rounded-lg hover:bg-[#d17d00] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Order Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyCart;
