import React from "react";
import { useAuth } from "../../../../context/AuthContext";

/**
 * ProductCarousel Component
 *
 * Displays a single row of related products (max 3 products)
 * Allows users to switch between products without closing the modal
 */
const ProductCarousel = ({ products, onProductClick, currentProductId }) => {
  const { user } = useAuth();
  
  if (!products || products.length === 0) {
    return null;
  }

  // Limit to 3 products maximum for single row display
  const displayProducts = products.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Section Header with Divider */}
      <div className="border-t-2 border-gray-200 pt-6">
        <h2 className="text-2xl font-bold">
          <span className="text-[#003363]">Other </span>
          <span className="text-[#F28C28]">Products</span>
        </h2>
      </div>

      {/* Responsive Grid Layout - Max 3 Products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayProducts.map((product) => {
          const isCurrentProduct = product.id === currentProductId;
          const isOutOfStock = product.status === "out_of_stock";
          
          // Check if item is gender-specific and if user's gender matches
          const itemGender = product.forGender || product.for_gender || "Unisex";
          const isGenderSpecific = itemGender !== "Unisex";
          const userGender = user?.gender || null;
          const genderMismatch = isGenderSpecific && userGender && userGender !== itemGender && !isCurrentProduct;

          return (
            <div
              key={product.id}
              onClick={() => !isCurrentProduct && !genderMismatch && onProductClick(product)}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 flex flex-col h-full relative ${
                isCurrentProduct
                  ? "ring-4 ring-[#F28C28] opacity-75 cursor-default"
                  : genderMismatch
                  ? "cursor-not-allowed opacity-60"
                  : "hover:shadow-2xl hover:scale-105 cursor-pointer"
              }`}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
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
                {/* Product Name - no min-height so gap to (College) matches All Products */}
                <h3 className="text-base font-bold text-[#003363] mb-0.5 line-clamp-2 leading-tight">
                  {product.name}
                </h3>

                {/* Education Level - gap matches All Products ProductCard */}
                {product.educationLevel && (
                  <p className="text-sm text-[#F28C28] font-semibold mt-0.5">
                    ({product.educationLevel})
                  </p>
                )}

                {/* Gender Label - Show if item is gender-specific */}
                {isGenderSpecific && (
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    For {itemGender}
                  </p>
                )}

                {/* Gender Mismatch Overlay */}
                {genderMismatch && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#F3F3F3]/60 z-10">
                    <span className="px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-full shadow-lg">
                      For {itemGender} only
                    </span>
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
