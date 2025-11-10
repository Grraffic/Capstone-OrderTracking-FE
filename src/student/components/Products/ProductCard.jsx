import React from "react";
import { ShoppingCart, Bell } from "lucide-react";
import { PRODUCT_STATUS } from "../../constants/studentProducts";

const ProductCard = ({
  product,
  onOrderClick,
  onPreOrderClick,
  onProductClick,
}) => {
  const statusInfo = PRODUCT_STATUS[product.status] || PRODUCT_STATUS.in_stock;
  const isOutOfStock = product.status === "out_of_stock";
  const isPreOrder = product.status === "pre_order";

  const handleOrderClick = (e) => {
    e.stopPropagation(); // Prevent triggering product click
    if (isOutOfStock) return;

    // Open product details modal for all products
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent triggering product click
    if (isOutOfStock) return;
    // Open product details modal
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleProductClick = () => {
    // Open product details modal when clicking on the card
    if (onProductClick) {
      onProductClick(product);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full cursor-pointer"
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Status Badge - Top Left for Pre-Order */}
        {isPreOrder && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-[#F28C28] text-white shadow-md">
              Pre-Order
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Product Name */}
        <h3 className="text-base font-bold text-[#003363] mb-1 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>

        {/* Education Level */}
        {product.educationLevel && (
          <p className="text-sm text-[#F28C28] font-semibold mb-3">
            ({product.educationLevel})
          </p>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow"></div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {/* Left side - Out of Stock status or Add to Cart icon */}
          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <div className="flex flex-col">
                <span className="text-xs text-red-600 font-semibold">
                  Out of Stock
                </span>
                <button className="flex items-center gap-1 text-xs text-[#003363] hover:text-[#F28C28] transition-colors mt-1">
                  <Bell size={12} />
                  <span>Remind me</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="p-2 rounded-lg border border-gray-300 hover:border-[#F28C28] hover:bg-orange-50 transition-all duration-200"
                title="Add to Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 hover:text-[#F28C28]" />
              </button>
            )}
          </div>

          {/* Right side - Order Now button */}
          {!isOutOfStock && (
            <button
              onClick={handleOrderClick}
              className="px-5 py-2 bg-[#F28C28] text-white text-sm font-semibold rounded-full hover:bg-[#d97a1f] transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Order Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
