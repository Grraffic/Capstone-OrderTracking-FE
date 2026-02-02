import React from "react";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product, blockedDueToVoid = false }) => {
  const navigate = useNavigate();
  const isOutOfStock = product.status === "out_of_stock";
  const isPreOrder = product.status === "pre_order";
  const orderLimitReached = product._orderLimitReached === true;
  const isClaimed = product._isClaimed === true;
  const slotsFullForNewType = product._slotsFullForNewType === true;
  const notAllowedForStudentType = product._notAllowedForStudentType === true;

  const handleProductClick = () => {
    // Allow navigation even when disabled - students can still view product details
    // The product details page will handle showing disabled state for ordering
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
  // EXCEPTION: Out of stock items (pre-order) are NOT disabled - users can still place pre-orders
  // UNLESS: Old students without permission cannot place pre-orders (same as eligibility check)
  const isDisabled = (isAlreadyOrdered || isClaimed || blockedDueToVoid || slotsFullForNewType || notAllowedForStudentType) && 
                     (!isOutOfStock || notAllowedForStudentType);

  return (
    <div
      className={`relative rounded-2xl shadow-md overflow-hidden flex flex-col h-full cursor-pointer ${
        isDisabled
          ? "bg-gray-100 hover:shadow-md"
          : "bg-white hover:shadow-xl"
      }`}
      onClick={handleProductClick}
    >
      {/* Product Image */}
      <div
        className={`relative aspect-square ${
          isDisabled ? "bg-gray-200" : "bg-gray-50"
        }`}
      >
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover ${
            isDisabled ? "grayscale opacity-70" : ""
          }`}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />

        {/* Background Overlay for Disabled Items - Show for disabled items including pre-orders without permission */}
        {isDisabled && (
          <div className="absolute inset-0 bg-[#F3F3F3] opacity-50"></div>
        )}

        {/* Order Limit Badge - Show when order limit is reached */}
        {orderLimitReached && !isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#BFBFBF] text-white px-6 py-2 rounded-xl shadow-lg font-bold text-sm drop-shadow-md">
              Order Limit
            </div>
          </div>
        )}


        {/* Pre-Order Button Overlay - Show when out of stock and not blocked (even if order limit reached) */}
        {/* Old students without permission cannot place pre-orders */}
        {isOutOfStock && !blockedDueToVoid && !slotsFullForNewType && !notAllowedForStudentType && (
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
        <h3 className="text-lg font-bold line-clamp-2 leading-tight mb-0.5 text-[#003363]">
          {product.name}
        </h3>

        {/* Education Level */}
        {product.educationLevel && (
          <p className="text-base font-semibold mt-0.5 text-[#F28C28]">
            ({product.educationLevel})
          </p>
        )}

        {/* Order Limit Description - Show when item is disabled but not out of stock */}
        {isDisabled && !isOutOfStock && (
          <p className="text-xs italic text-[#F10000] opacity-60 mt-2">
            You have already reached your order quota for this school year
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
