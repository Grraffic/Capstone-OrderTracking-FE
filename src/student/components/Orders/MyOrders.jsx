import React, { useState } from "react";
import { FileText, ShoppingCart, CheckCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrder } from "../../../context/OrderContext";
import QRCode from "react-qr-code";

/**
 * QR Code Modal Component
 */
const QRCodeModal = ({ order, onClose }) => {
  if (!order) return null;

  const qrData = order.qrCodeData || JSON.stringify({
    orderNumber: order.orderNumber || order.id,
    studentName: order.studentName,
    studentId: order.studentId,
    items: order.items,
    orderDate: order.orderDate,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[#003363] mb-2">Order QR Code</h3>
          <p className="text-sm text-gray-600">
            Order #: <span className="font-semibold text-[#F28C28]">{order.orderNumber || order.id}</span>
          </p>
        </div>

        <div className="flex justify-center mb-6 bg-white p-6 rounded-lg border-2 border-gray-200">
          <QRCode
            value={qrData}
            size={200}
            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          />
        </div>

        <div className="text-center space-y-2 mb-6">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Student:</span> {order.studentName}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Items:</span> {order.quantity} item(s)
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Present this QR code at the claiming area
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-[#F28C28] text-white font-semibold rounded-lg hover:bg-[#d97a1f] transition-colors"
        >
          Close
        </button>
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
  const { orders, loading, error } = useOrder();
  const [viewMode, setViewMode] = useState("overview"); // "overview" or "detail"
  const [activeCategory, setActiveCategory] = useState("orders");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  // Count orders by category
  const getOrderCounts = () => {
    return {
      preOrders: orders.filter((order) => order.status === "pre_order").length,
      orders: orders.filter((order) => order.status === "pending" || order.status === "processing" || order.status === "ready" || order.status === "payment_pending").length,
      claimed: orders.filter((order) => order.status === "completed" || order.status === "claimed").length,
    };
  };

  const counts = getOrderCounts();

  // Get unique products from orders for "Suggested For You"
  const getSuggestedProducts = () => {
    const uniqueProducts = new Map();
    
    orders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
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
        return orders.filter((order) => order.status === "pre_order");
      case "orders":
        return orders.filter((order) => order.status === "pending" || order.status === "processing" || order.status === "ready" || order.status === "payment_pending");
      case "claimed":
        return orders.filter((order) => order.status === "completed" || order.status === "claimed");
      default:
        return orders;
    }
  }, [orders, activeCategory]);

  // Handle category click - switch to detail view
  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    setViewMode("detail");
  };

  // Handle back to overview
  const handleBackToOverview = () => {
    setViewMode("overview");
  };

  // Handle Show QR
  const handleShowQR = (order) => {
    setSelectedOrder(order);
    setShowQRModal(true);
  };

  // Category button component
  const CategoryButton = ({ category, icon: Icon, label, count, onClick }) => {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-3 group"
      >
        <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 hover:border-[#F28C28] hover:bg-[#FFF5E6] transition-all duration-300 group-hover:shadow-lg">
          <Icon className="w-8 h-8 text-[#003363] group-hover:text-[#F28C28] transition-colors" />
          
          {count > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#F28C28] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-bold">{count}</span>
            </div>
          )}
        </div>

        <span className="text-sm font-semibold text-[#003363] group-hover:text-[#F28C28] transition-colors">
          {label}
        </span>
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
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
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

        {/* Title Row with Order Items and Info Icon */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">
            <span className="text-[#003363]">Order </span>
            <span className="text-[#F28C28]">Items</span>
          </h1>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-2xl text-[#003363]">ⓘ</span>
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No orders found in this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-center gap-6">
                  {/* Quantity */}
                  <div className="flex-shrink-0 text-sm font-bold text-[#003363]">
                    {order.quantity}PC
                  </div>

                  {/* Image */}
                  <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                    {order.items && order.items.length > 0 && order.items[0].image ? (
                      <img
                        src={order.items[0].image}
                        alt={order.item}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{order.size || "Standard"} Size</p>
                    <h3 className="text-xl font-bold text-[#003363] mb-1">{order.item}</h3>
                    <p className="text-base text-[#F28C28] font-semibold mb-2">({order.type || "Basic Education"})</p>
                    
                    {(order.status === "ready" || order.status === "completed") && (
                      <>
                        <p className="text-sm text-[#F28C28] font-semibold mb-1">Available for Claiming</p>
                        <p className="text-xs text-[#F28C28]">
                          Your order is now available. Please proceed to the designated claiming area and present your QR code to receive your item.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Price and QR */}
                  <div className="flex-shrink-0 text-right space-y-3">
                    <div className="text-2xl font-bold text-[#003363]">FREE</div>
                    <button
                      onClick={() => handleShowQR(order)}
                      className="px-6 py-2 border-2 border-[#003363] text-[#003363] rounded-full font-semibold text-sm hover:bg-[#003363] hover:text-white transition-colors"
                    >
                      Show QR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQRModal && (
        <QRCodeModal
          order={selectedOrder}
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
