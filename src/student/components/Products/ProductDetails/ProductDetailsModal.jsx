import React, { useState } from "react";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ProductImageViewer from "./ProductImageViewer";
import ProductInfo from "./ProductInfo";
import SizeSelector from "./SizeSelector";
import ProductCarousel from "./ProductCarousel";

/**
 * ProductDetailsModal Component
 *
 * Main modal container for displaying product details
 * Features:
 * - Split layout (image left, details right)
 * - Gradient background
 * - Search bar at top
 * - Back button
 * - Size selection with visual feedback
 * - Quantity selector
 * - Add to Cart and Order Now buttons
 * - Related products carousel
 */
const ProductDetailsModal = ({
  isOpen,
  onClose,
  product,
  availableSizes,
  selectedSize,
  onSizeSelect,
  sizeConfirmed,
  quantity,
  onQuantityChange,
  relatedProducts,
  onProductSwitch,
  onAddToCart,
  onOrderNow,
  requiresSizeSelection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen || !product) return null;

  const isOutOfStock = product.status === "out_of_stock";

  // Check if order button should be disabled
  const isOrderDisabled =
    isOutOfStock || (requiresSizeSelection && !selectedSize);

  const handleAddToCart = () => {
    if (isOrderDisabled) return;
    onAddToCart({
      product,
      size: selectedSize,
      quantity,
    });
  };

  const handleOrderNow = () => {
    if (isOrderDisabled) return;
    onOrderNow({
      product,
      size: selectedSize,
      quantity,
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search for product in relatedProducts
    if (searchQuery.trim() && relatedProducts) {
      const foundProduct = relatedProducts.find((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (foundProduct && onProductSwitch) {
        onProductSwitch(foundProduct);
        setSearchQuery(""); // Clear search after switching
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container with Gradient Background */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-blue-50 via-orange-50 to-blue-50 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Scrollable Content */}
          <div
            className="overflow-y-auto custom-scrollbar"
            data-modal-content
            style={{
              maxHeight: "90vh",
              scrollbarWidth: "thin",
              scrollbarColor: "#d1d5db #f3f4f6",
            }}
          >
            {/* Main Content - Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
              {/* Left Side - Product Image with Logo Overlay */}
              <div className="lg:sticky lg:top-0 lg:self-start relative">
                {/* Logo and Title - Overlay on Image */}
                <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#003363] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">LV</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#003363] bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
                    Basic Education
                  </h2>
                </div>

                <ProductImageViewer
                  product={product}
                  selectedSize={selectedSize}
                />
              </div>

              {/* Right Side - Product Details with Search Bar */}
              <div className="space-y-6 bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                {/* Search Bar and Back Button - Top of Right Panel */}
                <div className="flex items-center gap-3 mb-4">
                  {/* Search Bar - Matching AllProducts.jsx style */}
                  <form onSubmit={handleSearchSubmit} className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search for items"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#003363] focus:border-transparent text-sm"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <button
                        type="submit"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#003363] text-white p-2 rounded-full hover:bg-[#002347] transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </form>

                  {/* Back Button */}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border-2 border-[#003363] text-[#003363] rounded-full hover:bg-[#003363] hover:text-white transition-all duration-200 flex items-center gap-2 font-semibold flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
                {/* FREE Badge - Top Right */}
                <div className="flex justify-end">
                  <span className="px-4 py-1 bg-white border-2 border-[#003363] text-[#003363] rounded-full text-sm font-bold">
                    FREE
                  </span>
                </div>

                {/* Product Info */}
                <ProductInfo product={product} />

                {/* Size Selector */}
                {requiresSizeSelection && (
                  <SizeSelector
                    availableSizes={availableSizes}
                    selectedSize={selectedSize}
                    onSizeSelect={onSizeSelect}
                    sizeConfirmed={sizeConfirmed}
                  />
                )}

                {/* Quantity Selector */}
                {!isOutOfStock && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Quantity:
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="p-2 rounded-lg border-2 border-gray-300 hover:border-[#F28C28] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold text-gray-800 min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onQuantityChange(quantity + 1)}
                        className="p-2 rounded-lg border-2 border-gray-300 hover:border-[#F28C28] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOrderDisabled}
                    className="flex-1 px-6 py-3 bg-white border-2 border-[#003363] text-[#003363] font-semibold rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart</span>
                  </button>

                  {/* Order Now Button */}
                  <button
                    onClick={handleOrderNow}
                    disabled={isOrderDisabled}
                    className="flex-1 px-6 py-3 bg-[#F28C28] text-white font-semibold rounded-lg hover:bg-[#d97a1f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Order Now
                  </button>
                </div>

                {/* Size Selection Warning */}
                {requiresSizeSelection && !selectedSize && (
                  <p className="text-sm text-red-600 text-center">
                    Please select a size before ordering
                  </p>
                )}
              </div>
            </div>

            {/* Related Products Carousel */}
            <div className="px-6 md:px-8 pb-8">
              <ProductCarousel
                products={relatedProducts}
                onProductClick={onProductSwitch}
                currentProductId={product.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
