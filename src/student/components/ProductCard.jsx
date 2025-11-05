import React from "react";
import { ShoppingCart } from "lucide-react";
import { PRODUCT_STATUS } from "../constants/studentProducts";

const ProductCard = ({ product, onOrderClick, onPreOrderClick }) => {
  const statusInfo = PRODUCT_STATUS[product.status] || PRODUCT_STATUS.in_stock;
  const isOutOfStock = product.status === "out_of_stock";
  const isPreOrder = product.status === "pre_order";

  const handleActionClick = () => {
    if (isOutOfStock) return;

    if (isPreOrder) {
      onPreOrderClick(product);
    } else {
      onOrderClick(product);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col h-full">
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">
            {product.description}
          </p>
        )}

        {/* Action Button - Larger and more prominent */}
        <button
          onClick={handleActionClick}
          disabled={isOutOfStock}
          className={`mt-4 w-full py-3.5 px-6 rounded-lg font-bold text-base transition-all duration-200 flex items-center justify-center space-x-2 ${
            isOutOfStock
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isPreOrder
              ? "bg-white border-2 border-[#F28C28] text-[#F28C28] hover:bg-orange-50"
              : "bg-[#F28C28] text-white hover:bg-[#d97a1f] hover:shadow-lg"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>
            {isOutOfStock
              ? "Out of Stock"
              : isPreOrder
              ? "Pre-Order"
              : "Order Now"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
