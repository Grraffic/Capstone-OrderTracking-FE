import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
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
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, loading } = useCart();

  // Handle back navigation
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Handle checkout submission
  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // TODO: Implement order submission and QR code generation
    toast.success("Order submitted! Generating QR code...");
    console.log("Checkout items:", items);
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
                disabled={loading}
                className="w-full py-4 bg-[#F28C28] text-white font-bold text-lg rounded-full hover:bg-[#d97a1f] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Checkout"}
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
