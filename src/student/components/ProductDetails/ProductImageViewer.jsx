import React, { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

/**
 * ProductImageViewer Component
 *
 * Displays the main product image with zoom functionality
 * Handles image loading errors with fallback
 * Shows selected size on the image
 */
const ProductImageViewer = ({ product, selectedSize }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e) => {
    setImageError(true);
    e.target.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-100 to-orange-100 rounded-3xl overflow-hidden shadow-lg">
      {/* Product Image */}
      <div className="relative aspect-square flex items-center justify-center p-8">
        <img
          src={product.image}
          alt={product.name}
          className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
            isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
          }`}
          onError={handleImageError}
          onClick={toggleZoom}
        />

        {/* Zoom Button */}
        {!imageError && (
          <button
            onClick={toggleZoom}
            className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            title={isZoomed ? "Zoom Out" : "Zoom In"}
          >
            {isZoomed ? (
              <ZoomOut className="w-5 h-5 text-gray-700" />
            ) : (
              <ZoomIn className="w-5 h-5 text-gray-700" />
            )}
          </button>
        )}

        {/* Status Badge */}
        {product.status === "pre_order" && (
          <div className="absolute top-4 left-4">
            <span className="inline-block px-4 py-2 rounded-full text-sm font-bold bg-[#F28C28] text-white shadow-lg">
              Pre-Order
            </span>
          </div>
        )}

        {/* Selected Size Display - Bottom Left */}
        {selectedSize && (
          <div className="absolute bottom-6 left-6">
            <p className="text-3xl font-bold text-[#003363]">
              {selectedSize === "XS"
                ? "Extra Small"
                : selectedSize === "S"
                ? "Small"
                : selectedSize === "M"
                ? "Medium"
                : selectedSize === "L"
                ? "Large"
                : selectedSize === "XL"
                ? "Extra Large"
                : selectedSize === "XXL"
                ? "2X Large"
                : selectedSize}
            </p>
          </div>
        )}

        {/* Image View Selector - Left Side */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
          <button className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-lg border-2 border-[#F28C28] flex items-center justify-center hover:bg-white transition-colors shadow-md">
            <span className="text-xs font-semibold text-[#003363]">Front</span>
          </button>
          <button className="w-16 h-16 bg-white/60 backdrop-blur-sm rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-white transition-colors shadow-md">
            <span className="text-xs font-semibold text-gray-600">Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductImageViewer;
