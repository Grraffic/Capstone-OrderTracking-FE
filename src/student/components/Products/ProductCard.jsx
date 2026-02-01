import React from "react";
import { useNavigate } from "react-router-dom";
import { PRODUCT_STATUS } from "../../constants/studentProducts";

const ProductCard = ({ product, blockedDueToVoid = false }) => {
  const navigate = useNavigate();
  const statusInfo = PRODUCT_STATUS[product.status] || PRODUCT_STATUS.in_stock;
  const isOutOfStock = product.status === "out_of_stock";
  const isPreOrder = product.status === "pre_order";
  const orderLimitReached = product._orderLimitReached === true;
  const isClaimed = product._isClaimed === true;
  const slotsFullForNewType = product._slotsFullForNewType === true;
  const notAllowedForStudentType = product._notAllowedForStudentType === true;
  const claimedCount = product._claimedCount || 0;
  const maxAllowed = product._maxAllowed || 0;

  const handleProductClick = () => {
    // FORCE DISABLE: If item is claimed or not allowed for student type, prevent navigation
    if (isClaimed || notAllowedForStudentType) {
      return; // Block click entirely when item has reached claimed max or is not allowed
    }
    // Suggested For You may use placeholder id (n-Name); go to all products then
    const id = product.id;
    const isPlaceholderId = typeof id === "string" && id.startsWith("n-");
    if (isPlaceholderId || id == null) {
      navigate("/all-products");
      return;
    }
    navigate(`/products/${id}`);
  };

  const isAlreadyOrdered = orderLimitReached && !notAllowedForStudentType && !isOutOfStock && !slotsFullForNewType && !isClaimed;
  // FORCE DISABLE: When blocked due to void, slot limit, claimed max reached, or not allowed for student type, card is ALWAYS disabled
  // isClaimed takes priority - if item has reached claimed max, it MUST be disabled
  // notAllowedForStudentType: item not enabled by admin for old students
  const isDisabled = isAlreadyOrdered || isClaimed || blockedDueToVoid || slotsFullForNewType || notAllowedForStudentType;

  return (
    <div
      className={`relative rounded-2xl shadow-md overflow-hidden flex flex-col h-full cursor-pointer ${
        isDisabled
          ? "bg-gray-100 hover:shadow-md"
          : "bg-white hover:shadow-xl transition-all duration-300"
      }`}
      onClick={handleProductClick}
      style={
        isDisabled
          ? undefined
          : { transition: "all 0.3s ease-in-out, transform 0.3s ease-in-out" }
      }
    >
      {/* Product Image */}
      <div
        className={`relative aspect-square ${
          isDisabled ? "bg-gray-200" : "bg-gray-50 transition-all duration-300"
        }`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover ${
            isDisabled ? "grayscale opacity-70" : "transition-all duration-300"
          }`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Pre-Order Button Overlay - Only show when out of stock and not blocked */}
        {isOutOfStock && !blockedDueToVoid && !slotsFullForNewType && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
            <button
              type="button"
              className="px-6 py-3 bg-[#F28C28] text-white font-bold rounded-xl shadow-lg hover:bg-[#E68B00] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // Handle pre-order action
                console.log("Pre-order clicked for:", product.name);
                // Navigate to product details for pre-order
                navigate(`/products/${product.id}`);
              }}
            >
              Pre-Order
            </button>
          </div>
        )}

        {/* Status Badge - Top Left for Pre-Order (legacy support) */}
        {isPreOrder && !isOutOfStock && (
          <div className="absolute top-3 left-3">
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold bg-[#F28C28] text-white shadow-md">
              Pre-Order
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Product Name - mb-0.5 for tight gap to education level (matches ProductCarousel) */}
        <h3
          className={`text-lg font-bold line-clamp-2 leading-tight mb-0.5 ${
            isDisabled ? "text-gray-500" : "text-[#003363]"
          }`}
        >
          {product.name}
        </h3>

        {/* Education Level */}
        {product.educationLevel && (
          <p
            className={`text-base font-semibold mt-0.5 ${
              isDisabled ? "text-gray-400" : "text-[#F28C28]"
            }`}
          >
            ({product.educationLevel})
          </p>
        )}

        {/* Spacer to push status to bottom */}
        <div className="flex-grow"></div>

        {/* Stock Status - Only show for out of stock items */}
        {isOutOfStock && (
          <div className="mt-3">
            <span className="text-xs text-red-600 font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
