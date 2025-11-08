import React from "react";
import { ShoppingCart, Bell } from "lucide-react";

/**
 * ProductCarousel Component
 *
 * Displays a 3x3 grid of related products (max 9 products)
 * Allows users to switch between products without closing the modal
 */
const ProductCarousel = ({ products, onProductClick, currentProductId }) => {
  if (!products || products.length === 0) {
    return null;
  }

  // Limit to 9 products maximum
  const displayProducts = products.slice(0, 9);

  return (
    <div className="mt-8 border-t pt-6">
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#003363]">
          Other <span className="text-[#F28C28]">Products</span>
        </h2>
      </div>

      {/* 3x3 Grid Layout */}
      <div className="grid grid-cols-3 gap-4">
        {displayProducts.map((product) => {
          const isCurrentProduct = product.id === currentProductId;
          const isOutOfStock = product.status === "out_of_stock";

          return (
            <div
              key={product.id}
              onClick={() => !isCurrentProduct && onProductClick(product)}
              className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 flex flex-col h-full ${
                isCurrentProduct
                  ? "ring-2 ring-[#F28C28] opacity-75 cursor-default"
                  : "hover:shadow-xl cursor-pointer"
              }`}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-50">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />

                {/* Current Product Badge */}
                {isCurrentProduct && (
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <span className="px-3 py-1 bg-[#F28C28] text-white text-xs font-bold rounded-full">
                      Current
                    </span>
                  </div>
                )}

                {/* Pre-Order Badge - Top Left */}
                {product.status === "pre_order" && !isCurrentProduct && (
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

                {/* Action Buttons - Matching ProductCard.jsx */}
                {!isCurrentProduct && (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductClick(product);
                          }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onProductClick(product);
                        }}
                        className="px-5 py-2 bg-[#F28C28] text-white text-sm font-semibold rounded-full hover:bg-[#d97a1f] transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Order Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductCarousel;
