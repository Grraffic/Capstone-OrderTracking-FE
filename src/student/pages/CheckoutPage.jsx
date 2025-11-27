import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import { useOrder } from "../../context/OrderContext";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import { inventoryAPI } from "../../services/api";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import Footer from "../../components/common/Footer";
import toast from "react-hot-toast";

/**
 * CheckoutPage Component
 *
 * Simple checkout page matching the design mockup with:
 * - Back button
 * - "Checkout" title (Check in navy, out in orange)
 * - List of cart items with image, size, name, education level, and FREE badge
 * - Orange "Checkout" button at bottom
 * - Clean, minimal design
 * 
 * Supports two modes:
 * 1. Direct checkout (Order Now) - shows only the selected item, doesn't add to cart
 * 2. Cart checkout - shows all items from cart
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items: cartItems, loading: cartLoading, clearCart } = useCart();
  const { checkoutItems, isDirectCheckout, clearCheckoutItems } = useCheckout();
  const { createOrder } = useOrder();
  const { user } = useAuth();
  const { trackCheckout } = useActivity();
  const [submitting, setSubmitting] = useState(false);

  // Determine which items to display: direct checkout items or cart items
  const items = isDirectCheckout ? checkoutItems : cartItems;
  const loading = isDirectCheckout ? false : cartLoading;

  // Handle back navigation
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Handle checkout submission
  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!user) {
      toast.error("Please log in to place an order");
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);

      // Get student education level from first item (assuming all items are for the same level)
      const educationLevel = items[0]?.inventory?.educationLevel || "General";

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // Check if any item is out of stock OR if selected size is not available
      // We need to check size-specific availability for uniform items
      const sizeAvailabilityChecks = await Promise.all(
        items.map(async (item) => {
          const selectedSize = item.size;
          const productName = item.inventory?.name;
          const productEducationLevel = item.inventory?.educationLevel;

          // Check if this is a uniform item that requires size selection
          const requiresSize =
            item.inventory?.itemType === "Uniform" ||
            item.inventory?.itemType === "PE Uniform" ||
            item.inventory?.itemType?.toLowerCase().includes("uniform") ||
            item.inventory?.category?.toLowerCase().includes("uniform");

          if (!requiresSize || selectedSize === "N/A") {
            // For non-uniform items, check overall stock
            const stock = item.inventory?.stock ?? 0;
            const status = item.inventory?.status;
            return (
              stock === 0 ||
              status === "Out of Stock" ||
              status === "out_of_stock" ||
              status?.toLowerCase() === "out of stock"
            );
          }

          // For uniform items, check if the specific size is available
          try {
            const response = await inventoryAPI.getAvailableSizes(
              productName,
              productEducationLevel
            );

            if (response.data.success && response.data.data) {
              const sizeData = response.data.data.find(s => s.size === selectedSize);
              // If size doesn't exist in inventory or has stock = 0, it's a pre-order
              return !sizeData || sizeData.stock === 0;
            }

            // If API call fails, assume it's out of stock to be safe
            return true;
          } catch (error) {
            console.error("Failed to check size availability:", error);
            // If API call fails, assume it's out of stock to be safe
            return true;
          }
        })
      );

      // Determine order type based on stock availability
      const hasOutOfStockItems = sizeAvailabilityChecks.some(isOutOfStock => isOutOfStock);
      const orderType = hasOutOfStockItems ? "pre-order" : "regular";

      // Transform cart items to order items format
      const orderItems = items.map(item => ({
        name: item.inventory?.name || "Unknown Item",
        size: item.size || "N/A",
        quantity: item.quantity || 1,
        item_type: item.inventory?.itemType || "Uniform",
        education_level: item.inventory?.educationLevel || "General",
        image: item.inventory?.image || null, // Include product image
      }));

      // Calculate total (all items are FREE, so total is 0)
      const totalAmount = 0;

      // Create order data
      const orderData = {
        order_number: orderNumber,
        student_id: user.uid,
        student_name: user.displayName || user.email,
        student_email: user.email,
        education_level: educationLevel,
        items: orderItems,
        total_amount: totalAmount,
        status: "pending",
        order_type: orderType, // Track if this is a pre-order or regular order
        notes: `${orderType === 'pre-order' ? 'Pre-order' : 'Order'} placed via ${isDirectCheckout ? 'direct' : 'cart'} checkout. ${items.length} item(s) ordered.`,
      };

      // Submit order to backend
      const createdOrder = await createOrder(orderData);

      // Track checkout activity
      trackCheckout({
        orderId: createdOrder?.id,
        orderNumber: orderNumber,
        itemCount: items.length,
        items: orderItems,
      });

      // Clear appropriate items after successful order
      if (isDirectCheckout) {
        // For direct checkout, just clear the checkout items (don't touch cart)
        clearCheckoutItems();
      } else {
        // For cart checkout, clear the cart
        await clearCart(user.uid);
      }

      toast.success("Order submitted successfully!");

      // Navigate to profile page to view the order
      setTimeout(() => {
        navigate("/student/profile");
      }, 1000);

    } catch (error) {
      console.error("Checkout error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error details:", error.response);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit order. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-16 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#003363] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section - Fixed background, stays in place */}
      <HeroSection />

      {/* Main Content - Scrollable content that overlaps hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-10 pb-8">
        {/* Main Card Container */}
        <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="p-6 sm:p-8">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="mb-6 px-4 py-2 border-2 border-[#003363] text-[#003363] rounded-full hover:bg-blue-50 transition-colors font-medium text-sm"
            >
              Back
            </button>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold text-center mb-8">
              <span className="text-[#003363]">Check</span>
              <span className="text-[#F28C28]">out</span>
            </h1>

            {/* Cart Items List */}
            <div className="space-y-4 mb-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Your cart is empty</p>
                  <button
                    onClick={() => navigate("/all-products")}
                    className="mt-4 px-6 py-2 bg-[#003363] text-white rounded-full hover:bg-[#002347] transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                  >
                    {/* Quantity Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-[#003363] font-bold text-[#003363]">
                        {item.quantity}PC
                      </div>
                    </div>

                    {/* Product Image */}
                    <div className="flex-shrink-0 w-20 h-20 bg-white rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={
                          item.inventory?.image ||
                          "/images/products/placeholder.jpg"
                        }
                        alt={item.inventory?.name || "Product"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <p className="text-xs text-gray-500 mb-1">
                        {item.size || "N/A"} Size
                      </p>
                      <h3 className="font-bold text-[#003363] text-sm sm:text-base leading-tight">
                        {item.inventory?.name || "Unknown Product"}
                      </h3>
                      <p className="text-xs text-[#F28C28] font-semibold mt-1">
                        ({item.inventory?.educationLevel || "N/A"})
                      </p>
                    </div>

                    {/* FREE Badge */}
                    <div className="flex-shrink-0">
                      <span className="inline-block px-4 py-1.5 bg-[#F28C28] text-white font-bold text-sm rounded-full">
                        FREE
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checkout Button - Fixed at Bottom */}
          {items.length > 0 && (
            <div className="p-6 sm:p-8 pt-0">
              <button
                onClick={handleCheckout}
                disabled={loading || submitting}
                className="w-full py-4 bg-[#F28C28] text-white font-bold text-lg rounded-full hover:bg-[#d97a1f] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting Order..." : loading ? "Processing..." : "Checkout"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CheckoutPage;
