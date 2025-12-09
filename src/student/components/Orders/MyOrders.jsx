import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  ShoppingCart,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrder } from "../../../context/OrderContext";
import { useAuth } from "../../../context/AuthContext";
import QRCode from "react-qr-code";
import { generateOrderReceiptQRData } from "../../../utils/qrCodeGenerator";
import { useSocketOrderUpdates } from "../../hooks/orders/useSocketOrderUpdates";

/**
 * Helper function to download SVG as PNG
 */
const downloadSVGAsPNG = (svgElement, filename) => {
  try {
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true);
    
    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const width = svgRect.width || 256;
    const height = svgRect.height || 256;
    
    // Serialize SVG to string
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    
    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    canvas.width = width;
    canvas.height = height;
    
    // Set white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    
    // Convert SVG to image and draw on canvas
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert canvas to PNG and download
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = filename;
      downloadLink.href = pngFile;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
    
    img.onerror = () => {
      console.error("Failed to load SVG image");
      alert("Failed to download QR code. Please try again.");
    };
    
    // Convert SVG to data URL
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  } catch (error) {
    console.error("Error downloading QR code:", error);
    alert("Failed to download QR code. Please try again.");
  }
};

/**
 * QR Code Modal Component
 */
const QRCodeModal = ({ order, onClose, profileData }) => {
  const [qrError, setQrError] = React.useState(null);

  if (!order) return null;

  // Create structured order data for QR generation
  const minimalQRData = {
    type: "order_receipt",
    orderNumber: order.orderNumber || order.order_number || order.id || "N/A",
    studentName: order.studentName || order.student_name || "Student",
    studentId: order.studentId || order.student_id || "N/A",
    items: (order.items || []).map((item) => ({
      name: item.name || "Item",
      quantity: item.quantity || 1,
      size: item.size || "N/A",
    })),
    quantity: order.quantity || (order.items || []).length,
    orderDate: order.orderDate || order.created_at || new Date().toISOString(),
    educationLevel:
      order.educationLevel || order.education_level || order.type || "General",
    status: order.status || "pending",
  };

  let qrData;

  try {
    // Use the utility function to generate QR data
    qrData = generateOrderReceiptQRData(minimalQRData);
    console.log("QR Code Generated:", qrData);
  } catch (error) {
    console.error("Error generating QR data:", error);
    setQrError("Failed to generate QR code data: " + error.message);
    qrData = JSON.stringify({
      type: "order_receipt",
      orderNumber: order.orderNumber || order.order_number || order.id,
      error: "Data generation failed",
    });
  }

  // Get item names for display
  const itemNames =
    (order.items || []).map((item) => item.name || "Item").join(", ") ||
    "No items";

  // Get course and year level from profile data
  const getCourseYearLevel = () => {
    if (profileData?.courseYearLevel) {
      return profileData.courseYearLevel;
    }
    // Fallback to education level if course info not available
    return minimalQRData.educationLevel
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const courseYearLevel = getCourseYearLevel();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-2 sm:p-4 pt-20 sm:pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 md:p-8 relative mt-4 sm:mt-6 md:mt-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors z-10"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-4 sm:mb-6 pr-8">
          <h3 className="text-base sm:text-lg md:text-xl font-bold">
            <span className="text-[#003363]">{itemNames}</span>{" "}
            <span className="text-xs sm:text-sm font-semibold">
              <span className="text-[#F28C28]">({courseYearLevel}</span>
              <span className="text-gray-400"> | </span>
              <span className="text-[#F28C28]">Student)</span>
            </span>
          </h3>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border-4 sm:border-6 md:border-8 border-[#003363] shadow-lg">
            {qrError ? (
              <div className="text-center p-4 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] md:w-[256px] md:h-[256px] flex items-center justify-center">
                <div>
                  <p className="text-red-500 font-semibold mb-2 text-sm sm:text-base">
                    QR Code Error
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">{qrError}</p>
                </div>
              </div>
            ) : (
              <QRCode
                value={qrData}
                size={
                  window.innerWidth < 640
                    ? 180
                    : window.innerWidth < 768
                    ? 220
                    : 256
                }
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                level="M"
                data-qr-code="true"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => window.print()}
            className="flex-1 py-2 px-3 sm:px-4 text-xs sm:text-sm bg-white border-2 border-[#003363] text-[#003363] rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            Print QR
          </button>
          <button
            onClick={() => {
              // Find the SVG element (react-qr-code generates SVG)
              const svgElement = document.querySelector('svg[data-qr-code="true"]');
              if (!svgElement) {
                // Fallback: try to find any SVG in the modal container
                const modalContainer = document.querySelector('.bg-white.p-3\\ sm\\:p-4\\ md\\:p-6');
                if (modalContainer) {
                  const modalSvg = modalContainer.querySelector('svg');
                  if (modalSvg) {
                    downloadSVGAsPNG(modalSvg, `QR-${minimalQRData.orderNumber}.png`);
                    return;
                  }
                }
                alert("QR code not found. Please try again.");
                return;
              }
              downloadSVGAsPNG(svgElement, `QR-${minimalQRData.orderNumber}.png`);
            }}
            className="flex-1 py-2 px-3 sm:px-4 text-xs sm:text-sm bg-white border-2 border-[#003363] text-[#003363] rounded-full font-semibold hover:bg-gray-50 transition-colors"
          >
            Download QR
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded">
          <p className="text-red-600 font-bold text-xs sm:text-sm mb-2">
            Disclaimer:
          </p>
          <p className="text-[10px] sm:text-xs text-gray-700 leading-relaxed">
            This QR code is valid only for claiming{" "}
            <span className="font-semibold text-[#003363]">
              Order #{minimalQRData.orderNumber} — {itemNames} (
              {courseYearLevel})
            </span>
            , issued to student{" "}
            <span className="font-semibold text-[#003363]">
              {minimalQRData.studentId}-{minimalQRData.studentName}
            </span>
            . Any attempt to use this code for other orders, items, or by other
            individuals will be considered invalid.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * MyOrders Component - Two View System
 * Overview: Category buttons + Suggested products
 * Detail: Order list when category is clicked
 */
const MyOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, loading, error } = useOrder();
  const { user } = useAuth();

  // Initialize state from location state if available (for navigation from checkout)
  const [viewMode, setViewMode] = useState(
    location.state?.viewMode || "overview"
  ); // "overview" or "detail"
  const [activeCategory, setActiveCategory] = useState(
    location.state?.activeCategory || "orders"
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Update state when location state changes (e.g., navigation from checkout)
  useEffect(() => {
    if (location.state?.viewMode) {
      setViewMode(location.state.viewMode);
    }
    if (location.state?.activeCategory) {
      setActiveCategory(location.state.activeCategory);
    }
    // Clear location state after reading it to prevent stale state
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Count orders by category
  const getOrderCounts = () => {
    return {
      preOrders: orders.filter((order) => order.order_type === "pre-order")
        .length,
      orders: orders.filter(
        (order) =>
          order.order_type !== "pre-order" &&
          (order.status === "pending" ||
            order.status === "processing" ||
            order.status === "ready" ||
            order.status === "payment_pending")
      ).length,
      claimed: orders.filter(
        (order) =>
          order.order_type !== "pre-order" &&
          (order.status === "completed" || order.status === "claimed")
      ).length,
    };
  };

  const counts = getOrderCounts();

  // Handle Socket.IO real-time order updates
  const handleOrderUpdate = useCallback((data) => {
    console.log("📡 Student - Real-time order update received:", data);
    // The OrderContext should handle refetching
    // If you need manual refetch, uncomment below
    // refetchOrders();
  }, []);

  // Connect to Socket.IO for real-time updates
  useSocketOrderUpdates(handleOrderUpdate);

  // Get unique products from orders for "Suggested For You"
  const getSuggestedProducts = () => {
    const uniqueProducts = new Map();

    orders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          if (item.image && !uniqueProducts.has(item.name)) {
            uniqueProducts.set(item.name, {
              name: item.name,
              image: item.image,
              educationLevel: item.education_level || order.type,
              itemType: item.item_type || "Uniform",
            });
          }
        });
      }
    });

    return Array.from(uniqueProducts.values()).slice(0, 5); // Show max 5 products
  };

  const suggestedProducts = getSuggestedProducts();

  // Filter orders based on active category
  const filteredOrders = React.useMemo(() => {
    switch (activeCategory) {
      case "preOrders":
        return orders.filter((order) => order.order_type === "pre-order");
      case "orders":
        return orders.filter(
          (order) =>
            order.order_type !== "pre-order" &&
            (order.status === "pending" ||
              order.status === "processing" ||
              order.status === "ready" ||
              order.status === "payment_pending")
        );
      case "claimed":
        return orders.filter(
          (order) =>
            order.order_type !== "pre-order" &&
            (order.status === "completed" || order.status === "claimed")
        );
      default:
        return orders;
    }
  }, [orders, activeCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Handle category click - switch to detail view
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setViewMode("detail");
    setCurrentPage(1); // Reset to first page when switching categories
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setViewMode("overview");
    setCurrentPage(1); // Reset pagination
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get dynamic title based on active category
  const getCategoryTitle = () => {
    switch (activeCategory) {
      case "preOrders":
        return { first: "Pre", second: "Orders" };
      case "orders":
        return { first: "Order", second: "Items" };
      case "claimed":
        return { first: "Claimed", second: "Orders" };
      default:
        return { first: "Order", second: "Items" };
    }
  };

  const titleParts = getCategoryTitle();

  // Helper function to determine education level based on grade or type
  const getEducationLevel = (item, order) => {
    // Check if education_level exists in item or order
    const educationLevel =
      item?.education_level || order?.type || order?.education_level;

    if (educationLevel) {
      const levelLower = educationLevel.toLowerCase();

      // Map education levels
      if (levelLower.includes("college") || levelLower.includes("higher")) {
        return "College";
      }
      if (levelLower.includes("senior") || levelLower.includes("shs")) {
        return "Senior High School";
      }
      if (levelLower.includes("junior") || levelLower.includes("jhs")) {
        return "Junior High School";
      }
      if (levelLower.includes("elementary") || levelLower.includes("basic")) {
        return "Elementary";
      }

      // Return as-is if it's already formatted
      return educationLevel;
    }

    // Check grade level
    const grade = item?.grade || order?.grade;
    if (grade) {
      const gradeNum = parseInt(grade);
      if (gradeNum >= 1 && gradeNum <= 6) {
        return "Elementary";
      }
      if (gradeNum >= 7 && gradeNum <= 10) {
        return "Junior High School";
      }
      if (gradeNum >= 11 && gradeNum <= 12) {
        return "Senior High School";
      }
    }

    return "General";
  };

  // Handle Show QR
  const handleShowQR = (order) => {
    console.log("handleShowQR called with order:", order);
    console.log("Order properties:", {
      id: order.id,
      orderNumber: order.orderNumber,
      order_number: order.order_number,
      studentName: order.studentName,
      student_name: order.student_name,
      items: order.items,
      quantity: order.quantity,
    });
    setSelectedOrder(order);
    setShowQRModal(true);
  };

  // Category button component
  const CategoryButton = ({ category, icon: Icon, label, count, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Define styles and content for each category
    const categoryConfig = {
      preOrders: {
        hoverBg: 'hover:bg-[#9FCDFF]',
        hoverBorder: 'hover:border-[#9FCDFF]',
        tooltipBg: 'bg-[#9FCDFF]',
        tooltipArrow: 'border-b-[#9FCDFF]',
        title: 'Pre-Orders',
        message: 'Your pre-order is now on process. Check your notification for more updates.'
      },
      orders: {
        hoverBg: 'hover:bg-[#FFCF85]',
        hoverBorder: 'hover:border-[#FFCF85]',
        tooltipBg: 'bg-[#F3BC62]',
        tooltipArrow: 'border-b-[#F3BC62]',
        title: 'Orders',
        message: 'Your orders are now ready for claiming. Please have your QR code prepared for verification during the claiming process.'
      },
      claimed: {
        hoverBg: 'hover:bg-[#9AE799]',
        hoverBorder: 'hover:border-[#9AE799]',
        tooltipBg: 'bg-[#9AE799]',
        tooltipArrow: 'border-b-[#9AE799]',
        title: 'Claimed Orders',
        message: 'Your orders are now complete. Digital receipts are now available in your order history.'
      }
    };

    const config = categoryConfig[category] || categoryConfig.orders;

    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex flex-col items-center gap-3 group relative"
      >
        <div 
          className={`relative w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 ${config.hoverBorder} ${config.hoverBg} transition-all duration-300 group-hover:shadow-lg`}
        >
          <Icon className="w-8 h-8 text-[#003363] transition-colors" />

          {count > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#F28C28] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">{count}</span>
            </div>
          )}
        </div>

        <span className="text-sm font-semibold text-[#003363] transition-colors">
          {label}
        </span>

        {/* Tooltip */}
        {showTooltip && (
          <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 w-64 ${config.tooltipBg} text-[#003363] text-sm p-4 rounded-lg shadow-lg z-50`}>
            {/* Arrow */}
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent ${config.tooltipArrow}`}></div>
            
            <p className="font-bold mb-2">{config.title}</p>
            <p className="text-xs leading-relaxed">
              {config.message}
            </p>
          </div>
        )}
      </button>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003363]"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center text-red-500 py-16">
        <p className="text-lg font-semibold">Error loading orders</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  // OVERVIEW VIEW - Category buttons + Suggested products
  if (viewMode === "overview") {
    return (
      <div className="space-y-12">
        {/* Title */}
        <h2 className="text-4xl font-bold">
          <span className="text-[#003363]">My </span>
          <span className="text-[#F28C28]">Orders</span>
        </h2>

        {/* Category Buttons */}
        <div className="flex items-center justify-center gap-16 py-8">
          <CategoryButton
            category="preOrders"
            icon={FileText}
            label="Pre-Orders"
            count={counts.preOrders}
            onClick={() => handleCategoryClick("preOrders")}
          />
          <CategoryButton
            category="orders"
            icon={ShoppingCart}
            label="Orders"
            count={counts.orders}
            onClick={() => handleCategoryClick("orders")}
          />
          <CategoryButton
            category="claimed"
            icon={CheckCircle}
            label="Claimed"
            count={counts.claimed}
            onClick={() => handleCategoryClick("claimed")}
          />
        </div>

        {/* Suggested For You Section */}
        {suggestedProducts.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">
                <span className="text-gray-700">Suggested </span>
                <span className="text-[#F28C28]">For You</span>
              </h3>
              <button
                onClick={() => navigate("/all-products")}
                className="flex items-center gap-2 text-[#F28C28] hover:text-[#d97a1f] font-semibold transition-colors"
              >
                <span>Explore More Products</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {suggestedProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src =
                          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h4 className="font-bold text-sm text-[#003363] line-clamp-2 mb-1">
                      {product.name}
                    </h4>
                    <p className="text-xs text-[#F28C28] font-semibold">
                      ({product.educationLevel})
                    </p>
                    {product.itemType && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.itemType}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DETAIL VIEW - Order list
  return (
    <>
      <div className="space-y-6">
        {/* Header with Back Button (left) and Navigation Tabs (right) */}
        <div className="flex items-start justify-between mb-6">
          {/* Left side: Back button */}
          <button
            onClick={handleBackToOverview}
            className="p-3 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <span className="text-2xl text-[#003363]">←</span>
          </button>

          {/* Right side: Navigation Tabs */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveCategory("preOrders")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                activeCategory === "preOrders"
                  ? "text-[#003363] border-b-2 border-[#F28C28]"
                  : "text-gray-600 hover:text-[#003363]"
              }`}
            >
              Pre-Orders
            </button>
            <button
              onClick={() => setActiveCategory("orders")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                activeCategory === "orders"
                  ? "text-[#F28C28] border-b-2 border-[#F28C28]"
                  : "text-gray-600 hover:text-[#003363]"
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveCategory("claimed")}
              className={`text-sm font-semibold pb-1 transition-colors ${
                activeCategory === "claimed"
                  ? "text-[#F28C28] border-b-2 border-[#F28C28]"
                  : "text-gray-600 hover:text-[#003363]"
              }`}
            >
              Claimed
            </button>
          </div>
        </div>

        {/* Title Row with Dynamic Title and Info Icon */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">
            <span className="text-[#003363]">{titleParts.first} </span>
            <span className="text-[#F28C28]">{titleParts.second}</span>
          </h1>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-2xl text-[#003363]">ⓘ</span>
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-500">No orders found in this category</p>
          </div>
        ) : (
          <>
            {/* Single Border Container */}
            <div className="bg-white rounded-lg border-2 border-gray-200 divide-y divide-gray-200">
              {paginatedOrders.map((order, orderIndex) => (
                <div key={order.id} className="p-6">
                  {/* Order Items List */}
                  <div className="space-y-4 mb-4">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="space-y-2">
                          <div className="flex items-center gap-6">
                            {/* Quantity - Left Side (No background) */}
                            <div className="flex-shrink-0 w-12 flex items-start justify-center">
                              <span className="text-[#003363] font-bold text-sm">
                                {item.quantity || 1}PC
                              </span>
                            </div>

                            {/* Item Image */}
                            <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name || order.item}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src =
                                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No Image
                                </div>
                              )}
                            </div>

                            {/* Item Details - Reorganized */}
                            <div className="flex-1">
                              {/* Size */}
                              <p className="text-sm text-gray-600 mb-1">
                                {item.size || order.size || "Standard"}
                              </p>
                              {/* Item Name */}
                              <h4 className="text-lg font-bold text-[#003363] mb-1">
                                {item.name || order.item}
                              </h4>
                              {/* Education Level */}
                              <p className="text-sm text-[#F28C28] font-semibold">
                                {getEducationLevel(item, order)}
                              </p>

                              {/* Available for Claiming - Inline (only for Orders tab) */}
                              {activeCategory === "orders" &&
                                (order.status === "ready" ||
                                  order.status === "completed") && (
                                  <p className="text-sm text-[#F28C28] font-semibold mt-2">
                                    Available for Claiming
                                  </p>
                                )}
                            </div>

                            {/* Price */}
                            <div className="flex-shrink-0 text-right">
                              <div className="text-xl font-bold text-[#003363]">
                                FREE
                              </div>
                            </div>
                          </div>

                          {/* Claiming Message - Below item (only for Orders tab) */}
                          {activeCategory === "orders" &&
                            (order.status === "ready" ||
                              order.status === "completed") && (
                              <div className="ml-[84px]">
                                <p className="text-xs text-[#F28C28]">
                                  Your order is now available. Please proceed to
                                  the designated claiming area and present your
                                  QR code to receive your item.
                                </p>
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-6">
                        {/* Quantity - Left Side (No background) */}
                        <div className="flex-shrink-0 w-12 flex items-start justify-center">
                          <span className="text-[#003363] font-bold text-sm">
                            {order.quantity || 1}PC
                          </span>
                        </div>

                        <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                        <div className="flex-1">
                          {/* Size */}
                          <p className="text-sm text-gray-600 mb-1">
                            {order.size || "Standard"}
                          </p>
                          {/* Item Name */}
                          <h4 className="text-lg font-bold text-[#003363] mb-1">
                            {order.item}
                          </h4>
                          {/* Education Level */}
                          <p className="text-sm text-[#F28C28] font-semibold">
                            {getEducationLevel({}, order)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xl font-bold text-[#003363]">
                            FREE
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show QR Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleShowQR(order)}
                      disabled={activeCategory === "preOrders"}
                      className={`px-6 py-2 border-2 rounded-full font-semibold text-sm transition-colors ${
                        activeCategory === "preOrders"
                          ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                          : "border-[#003363] text-[#003363] hover:bg-[#003363] hover:text-white"
                      }`}
                      title={
                        activeCategory === "preOrders"
                          ? "QR code not available for pre-orders"
                          : "Show QR code"
                      }
                    >
                      Show QR
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > itemsPerPage && (
              <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  {/* Page Info */}
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>

                  {/* Navigation Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Back
                    </button>

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-[#003363] text-white hover:bg-[#002347] shadow-md"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <QRCodeModal
          order={selectedOrder}
          profileData={user}
          onClose={() => {
            setShowQRModal(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </>
  );
};

export default MyOrders;
