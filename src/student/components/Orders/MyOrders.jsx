import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
import { orderAPI, itemsAPI, authAPI } from "../../../services/api";
import { useCart } from "../../../context/CartContext";
import { resolveItemKeyForMaxQuantity, getDefaultMaxForItem } from "../../../utils/maxQuantityKeys";
import { getDisplayPriceForFreeItem } from "../../../utils/freeItemDisplayPrice";
import ProductCard from "../Products/ProductCard";
import { useItems } from "../../../property-custodian/hooks/items/useItems";
import { categoryFromItemType } from "../../constants/studentProducts";

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
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="QR code for order"
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
/** Get order date for sorting (created_at, orderDate, or updated_at) */
const getOrderDate = (order) => {
  const raw =
    order.created_at ||
    order.createdAt ||
    order.orderDate ||
    order.updated_at ||
    order.updatedAt;
  return raw ? new Date(raw).getTime() : 0;
};

const MyOrders = ({ sortOrder = "newest", variant }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHistoryView = variant === "history";

  const { orders, loading, error, fetchOrders } = useOrder();
  const { user } = useAuth();

  // Safety check: ensure orders is always an array
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Ensure orders are fetched when component mounts (safety net)
  useEffect(() => {
    console.log(`🔍 MyOrders: Component mounted/updated`, {
      hasUser: !!user,
      userId: user?.uid || user?.id,
      ordersCount: safeOrders.length,
      loading
    });
    
    // If we have a user but no orders and not loading, try to fetch
    if (user && safeOrders.length === 0 && !loading && fetchOrders) {
      console.log(`🔍 MyOrders: No orders found, triggering fetchOrders as safety net`);
      fetchOrders();
    }
  }, [user, safeOrders.length, loading, fetchOrders]);

  // When variant="history", show claimed orders in detail view only (Order History)
  const [viewMode, setViewMode] = useState(
    isHistoryView ? "detail" : (location.state?.viewMode || "overview")
  );
  const [activeCategory, setActiveCategory] = useState(
    isHistoryView ? "claimed" : (location.state?.activeCategory || "orders")
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [orderAvailability, setOrderAvailability] = useState({}); // { orderId: boolean }
  const [checkingAvailability, setCheckingAvailability] = useState({}); // { orderId: boolean }
  const [convertingOrders, setConvertingOrders] = useState({}); // { orderId: boolean }
  const [cancellingOrders, setCancellingOrders] = useState({}); // { orderId: boolean }
  const [orderToCancel, setOrderToCancel] = useState(null); // order for cancel confirmation
  const [maxQuantities, setMaxQuantities] = useState({});
  const [alreadyOrdered, setAlreadyOrdered] = useState({});
  const [claimedItems, setClaimedItems] = useState({});
  const [totalItemLimit, setMaxItemsPerOrder] = useState(null);
  const [slotsUsedFromPlacedOrders, setSlotsUsedFromPlacedOrders] = useState(0);
  const [blockedDueToVoid, setBlockedDueToVoid] = useState(false);

  const { items: cartItems } = useCart();

  // State for fetching all products (same as AllProducts)
  const [userEducationLevel, setUserEducationLevel] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile to get education level (same as AllProducts)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await authAPI.getProfile();
        const userData = response.data;
        setUserEducationLevel(userData.educationLevel || null);
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setUserEducationLevel(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      fetchUserProfile();
    } else {
      setProfileLoading(false);
    }
  }, [user]);

  // Fetch max quantities and already-ordered for Order History "Order Again" and Suggested For You (disable when limit reached)
  useEffect(() => {
    if (!user) return;
    const fetchMaxQuantities = async () => {
      try {
        const res = await authAPI.getMaxQuantities();
        setMaxQuantities(res.data?.maxQuantities ?? {});
        setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
        setClaimedItems(res.data?.claimedItems ?? {});
        setMaxItemsPerOrder(res.data?.totalItemLimit ?? null);
        setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? Object.keys(res.data?.alreadyOrdered ?? {}).length);
        setBlockedDueToVoid(res.data?.blockedDueToVoid === true);
      } catch (err) {
        if (err?.response?.data?.maxQuantities != null)
          setMaxQuantities(err.response.data.maxQuantities);
        if (err?.response?.data?.alreadyOrdered != null)
          setAlreadyOrdered(err.response.data.alreadyOrdered);
        if (err?.response?.data?.claimedItems != null)
          setClaimedItems(err.response.data.claimedItems);
        if (err?.response?.data?.totalItemLimit != null)
          setMaxItemsPerOrder(err.response.data.totalItemLimit);
        if (err?.response?.data?.slotsUsedFromPlacedOrders != null)
          setSlotsUsedFromPlacedOrders(err.response.data.slotsUsedFromPlacedOrders);
        if (err?.response?.data?.blockedDueToVoid != null)
          setBlockedDueToVoid(err.response.data.blockedDueToVoid === true);
      }
    };
    fetchMaxQuantities();
  }, [user]);

  // Fetch all items using useItems hook (same as AllProducts)
  const { items: allItems, fetchItems: fetchAllItems } = useItems({
    skipInitialFetch: true,
  });

  const eligibilityLevel =
    userEducationLevel === "Vocational" ? "College" : userEducationLevel;

  // Fetch items once profile is loaded (same as AllProducts)
  useEffect(() => {
    if (!fetchAllItems) return;
    if (user && profileLoading) return;
    if (eligibilityLevel) {
      fetchAllItems(eligibilityLevel);
    } else {
      fetchAllItems();
    }
  }, [user, profileLoading, eligibilityLevel, fetchAllItems]);

  // Update state when location state changes (e.g., navigation from checkout). Skip when history variant.
  useEffect(() => {
    if (isHistoryView) return;
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
  }, [location.state, isHistoryView]);

  // Count orders by category
  const getOrderCounts = () => {
    return {
      preOrders: safeOrders.filter((order) => order.order_type === "pre-order")
        .length,
      orders: safeOrders.filter(
        (order) =>
          order.order_type !== "pre-order" &&
          (order.status === "pending" ||
            order.status === "processing" ||
            order.status === "ready" ||
            order.status === "payment_pending")
      ).length,
      claimed: safeOrders.filter(
        (order) =>
          order.order_type !== "pre-order" &&
          (order.status === "completed" || order.status === "claimed")
      ).length,
    };
  };

  const counts = getOrderCounts();

  // Handle Socket.IO real-time order updates
  const handleOrderUpdate = useCallback((data) => {
    console.log("📡 MyOrders - Real-time order update received:", data);
    console.log("📡 MyOrders - Order status:", data.status);
    console.log("📡 MyOrders - Order ID:", data.orderId || data.order?.id);
    console.log("📡 MyOrders - Order Number:", data.order?.order_number);
    console.log("📡 MyOrders - Current activeCategory:", activeCategory);
    console.log("📡 MyOrders - Current orders count:", orders.length);
    
    // The OrderContext should handle refetching, but we can also manually refetch here
    // to ensure the UI updates immediately
    if (data.status && (data.status === "claimed" || data.status === "completed")) {
      console.log("📡 MyOrders - Order claimed/completed, refreshing orders and max quantities");
      console.log("📡 MyOrders - Order details:", {
        id: data.order?.id || data.orderId,
        orderNumber: data.order?.order_number,
        status: data.status,
        items: data.order?.items?.map(i => i.name).join(", ")
      });
      
      // If order was just claimed and user is viewing "orders" tab, switch to "claimed" tab
      // to show them the order immediately
      if (data.status === "claimed" && activeCategory === "orders") {
        console.log("📡 MyOrders - Switching to Claimed tab to show the claimed order");
        setActiveCategory("claimed");
      }
      
      // OrderContext will handle the refetch, but we also call it here with a slight delay
      // to ensure the UI updates after OrderContext has processed the update
      // This ensures the order appears in the correct category
      console.log("📡 MyOrders - Scheduling fetchOrders to refresh order list");
      setTimeout(() => {
        console.log("📡 MyOrders - Executing fetchOrders...");
        fetchOrders().then(() => {
          console.log("✅ MyOrders: Orders refreshed, checking if claimed order appears...");
          // Verify the order appears in the filtered list
          const claimedOrders = orders.filter(
            (order) =>
              order.order_type !== "pre-order" &&
              (order.status === "completed" || order.status === "claimed")
          );
          const orderExists = claimedOrders.some(
            o => o.id === (data.order?.id || data.orderId) || 
                 o.orderNumber === data.order?.order_number
          );
          if (orderExists) {
            console.log("✅ MyOrders: Claimed order found in filtered list!");
          } else {
            console.warn("⚠️ MyOrders: Claimed order not found in filtered list yet. Order may need another refresh.");
          }
        });
      }, 500); // Wait for OrderContext to complete its refetch first
      
      // Refetch max quantities to update claimedItems
      if (user) {
        console.log("📡 MyOrders - Refreshing max quantities to update claimedItems");
        authAPI.getMaxQuantities()
          .then((res) => {
            console.log("📡 MyOrders - Max quantities refreshed, claimedItems:", res.data?.claimedItems);
            setMaxQuantities(res.data?.maxQuantities ?? {});
            setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
            setClaimedItems(res.data?.claimedItems ?? {});
            setMaxItemsPerOrder(res.data?.totalItemLimit ?? null);
            setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? Object.keys(res.data?.alreadyOrdered ?? {}).length);
            setBlockedDueToVoid(res.data?.blockedDueToVoid === true);
          })
          .catch((err) => {
            console.error("❌ MyOrders - Error refreshing max quantities after order claim:", err);
          });
      }
    } else {
      console.log("📡 MyOrders - Order update received but status is not claimed/completed:", data.status);
    }
  }, [fetchOrders, user, activeCategory, orders.length]);

  // Connect to Socket.IO for real-time updates
  useSocketOrderUpdates(handleOrderUpdate);

  // Diagnostic: Log claimed orders whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      const claimedOrders = orders.filter(
        (order) =>
          order.order_type !== "pre-order" &&
          (order.status === "completed" || order.status === "claimed")
      );
      
      console.log(`🔍 MyOrders Diagnostic: Total orders: ${orders.length}, Claimed orders: ${claimedOrders.length}`);
      
      if (claimedOrders.length > 0) {
        console.log(`✅ MyOrders Diagnostic: Claimed orders available:`, claimedOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          claimedDate: o.claimedDate,
          items: o.items?.map(i => `${i.quantity}x ${i.name}`).join(", ") || "N/A"
        })));
      } else {
        console.log(`⚠️ MyOrders Diagnostic: No claimed orders found in current orders array`);
        console.log(`⚠️ MyOrders Diagnostic: All order statuses:`, orders.map(o => ({
          orderNumber: o.orderNumber,
          status: o.status,
          order_type: o.order_type
        })));
      }
    }
  }, [orders]);

  // Transform all items to products (same logic as AllProducts)
  const transformedProducts = useMemo(() => {
    // Group items by name and education level
    const groupedItems = allItems.reduce((acc, item) => {
      const key = `${item.name}-${item.educationLevel}`;

      if (!acc[key]) {
        acc[key] = {
          items: [],
          totalStock: 0,
        };
      }

      acc[key].items.push(item);
      acc[key].totalStock += item.stock || 0;

      return acc;
    }, {});

    // Convert grouped items to product format
    return Object.values(groupedItems).map((group) => {
      // Use the first item as the base (they all have the same name and education level)
      const baseItem = group.items[0];
      const totalStock = group.totalStock;

      // Map inventory status to product status based on total stock
      let status = "in_stock";
      if (totalStock === 0) {
        status = "out_of_stock";
      } else if (totalStock < 20) {
        status = "limited_stock";
      }

      const itemType = baseItem.itemType ?? baseItem.item_type ?? "";
      const productName = baseItem.name ?? "";
      return {
        id: baseItem.id,
        name: baseItem.name,
        type: baseItem.itemType?.toLowerCase() || "other",
        category: categoryFromItemType(itemType, productName),
        status: status,
        image: baseItem.image || "/images/products/placeholder.jpg",
        price: 0, // FREE for students - price hidden
        description: baseItem.description || baseItem.descriptionText || "",
        educationLevel: baseItem.educationLevel,
        itemType: baseItem.itemType,
        forGender: baseItem.forGender || baseItem.for_gender || "Unisex",
        for_gender: baseItem.for_gender || baseItem.forGender || "Unisex", // Also include snake_case for compatibility
        stock: totalStock, // Use total stock across all sizes
        sizes: group.items.map((i) => i.size).filter((s) => s !== "N/A"), // Collect all sizes
        // Keep original item data for order submission
        _originalItem: baseItem,
      };
    });
  }, [allItems]);

  // Filter products by user gender (same as AllProducts)
  const filteredAllProducts = useMemo(() => {
    let filtered = [...transformedProducts];

    // Filter by user gender: only show Unisex or items for the user's gender
    if (user?.gender) {
      filtered = filtered.filter((p) => {
        const fg = (p.for_gender || p.forGender || "Unisex").toString().trim();
        return fg === "Unisex" || fg === user.gender;
      });
    }

    return filtered;
  }, [transformedProducts, user?.gender]);

  // Use all products for "Suggested For You" (same as AllProducts)
  const rawSuggestedProducts = useMemo(() => {
    return filteredAllProducts.slice(0, 5); // Show max 5 products
  }, [filteredAllProducts]);

  // Cart slot count and slots left (same logic as AllProducts) for enriching suggested products
  const cartSlotKeys = React.useMemo(() => {
    const set = new Set();
    (cartItems || []).forEach((i) => {
      const k = resolveItemKeyForMaxQuantity(i.inventory?.name || i.name || "");
      if (k) set.add(k);
    });
    return set;
  }, [cartItems]);
  const cartSlotCount = cartSlotKeys.size;
  const slotsLeftForThisOrder =
    totalItemLimit != null && Number(totalItemLimit) > 0
      ? Math.max(0, Number(totalItemLimit) - (Number(slotsUsedFromPlacedOrders) || 0))
      : 0;
  const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";

  // Enrich suggested products with limit flags so they show disabled when same as All Products
  // Same logic as AllProducts to ensure consistency
  const suggestedProductsWithLimit = useMemo(() => {
    return rawSuggestedProducts.map((p) => {
      const key = resolveItemKeyForMaxQuantity(p.name);
      const keyMissing = maxQuantities[key] === undefined || maxQuantities[key] === null;
      const educationLevelRaw = (p.educationLevel || p.education_level || "").toString().trim().toLowerCase();
      const isForAllEducationLevels =
        educationLevelRaw === "all education levels" || educationLevelRaw === "general";
      const treatAsAllowedForOldStudent = isForAllEducationLevels;
      const max =
        isOldStudent && keyMissing && !treatAsAllowedForOldStudent
          ? 0
          : (maxQuantities[key] ?? getDefaultMaxForItem(p.name));
      const notAllowedForStudentType =
        isOldStudent && keyMissing && !treatAsAllowedForOldStudent;
      const alreadyOrd = alreadyOrdered[key] ?? 0;
      const claimedForItem = claimedItems[key] ?? 0;
      const isClaimed = claimedForItem > 0;
      const inCart = (cartItems || []).filter(
        (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
      ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      const effectiveMax = Math.max(0, max - inCart - alreadyOrd);
      const isNewItemType = key && !cartSlotKeys.has(key);
      const slotsFullForNewType =
        totalItemLimit != null &&
        Number(totalItemLimit) > 0 &&
        isNewItemType &&
        cartSlotCount >= slotsLeftForThisOrder;
      return {
        ...p,
        _orderLimitReached: effectiveMax < 1 || isClaimed,
        _isClaimed: isClaimed,
        _slotsFullForNewType: slotsFullForNewType,
        _notAllowedForStudentType: notAllowedForStudentType,
      };
    });
  }, [rawSuggestedProducts, maxQuantities, alreadyOrdered, claimedItems, cartItems, cartSlotKeys, cartSlotCount, totalItemLimit, slotsLeftForThisOrder, isOldStudent]);

  // Filter orders based on active category, then sort by date (oldest/newest/all)
  const filteredOrders = React.useMemo(() => {
    console.log(`🔍 MyOrders: Filtering orders for category "${activeCategory}". Total orders: ${orders.length}`);
    let list;
    switch (activeCategory) {
      case "preOrders":
        list = orders.filter((order) => order.order_type === "pre-order");
        break;
      case "orders":
        list = orders.filter(
          (order) =>
            order.order_type !== "pre-order" &&
            (order.status === "pending" ||
              order.status === "processing" ||
              order.status === "ready" ||
              order.status === "payment_pending")
        );
        break;
      case "claimed":
        list = orders.filter(
          (order) =>
            order.order_type !== "pre-order" &&
            (order.status === "completed" || order.status === "claimed")
        );
        // Log filtering results for debugging
        if (list.length > 0) {
          console.log(`✅ MyOrders: Filtered ${list.length} claimed/completed orders for display`);
          console.log(`✅ MyOrders: Claimed order details:`, list.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            items: o.items?.map(i => i.name).join(", ")
          })));
        } else {
          console.log(`⚠️ MyOrders: No claimed orders found. Total orders: ${orders.length}`);
          const allStatuses = orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {});
          console.log(`⚠️ MyOrders: Order status breakdown:`, allStatuses);
          console.log(`⚠️ MyOrders: Sample orders:`, orders.slice(0, 3).map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            order_type: o.order_type
          })));
        }
        break;
      default:
        list = [...orders];
    }
    // Sort by date: oldest first (asc), newest first (desc), all = newest first
    if (sortOrder === "oldest") {
      list = [...list].sort(
        (a, b) => getOrderDate(a) - getOrderDate(b)
      );
    } else if (sortOrder === "newest" || sortOrder === "all") {
      list = [...list].sort(
        (a, b) => getOrderDate(b) - getOrderDate(a)
      );
    }
    return list;
  }, [orders, activeCategory, sortOrder]);

  // Order History: flatten claimed orders into one card per item (for history card layout)
  const historyCards = React.useMemo(() => {
    if (!isHistoryView) return [];
    const cards = [];
    filteredOrders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          cards.push({ order, item });
        });
      } else {
        cards.push({
          order,
          item: {
            name: order.item || "Item",
            image: order.image,
            quantity: order.quantity || 1,
            size: order.size,
            education_level: order.type || order.education_level,
          },
        });
      }
    });
    return cards;
  }, [isHistoryView, filteredOrders]);

  // Pagination: for history use flattened cards, otherwise orders
  const listForPagination = isHistoryView ? historyCards : filteredOrders;
  const totalPages = Math.ceil(listForPagination.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  const paginatedHistoryCards = historyCards.slice(startIndex, endIndex);

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

  // Get dynamic title based on active category (Order History when variant=history)
  const getCategoryTitle = () => {
    if (isHistoryView) return { first: "Order", second: "History" };
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

  // Check if pre-order items are available
  const checkPreOrderAvailability = useCallback(async (order) => {
    if (!order || order.order_type !== "pre-order") {
      return false;
    }

    // Must use UUID id, not order_number
    const orderId = order.id;
    
    if (!orderId) {
      console.error("Order missing UUID id:", order);
      return false;
    }
    
    // Prevent duplicate checks
    if (checkingAvailability[orderId]) {
      return orderAvailability[orderId] || false;
    }

    // If already checked, return cached result
    if (orderAvailability[orderId] !== undefined) {
      return orderAvailability[orderId];
    }

    setCheckingAvailability((prev) => ({ ...prev, [orderId]: true }));

    try {
      const items = order.items || [];
      if (items.length === 0) {
        setOrderAvailability((prev) => ({ ...prev, [orderId]: false }));
        setCheckingAvailability((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        return false;
      }

      // Check availability for each item
      const availabilityChecks = await Promise.all(
        items.map(async (item) => {
          try {
            const educationLevel =
              item.education_level ||
              order.education_level ||
              order.type ||
              "General";

            // Get available sizes for this item
            const response = await itemsAPI.getAvailableSizes(
              item.name,
              educationLevel
            );

            // Handle different response structures
            const responseData = response?.data?.data || response?.data || response;
            const sizesData = Array.isArray(responseData) 
              ? responseData 
              : (responseData?.data || []);

            if (sizesData && sizesData.length > 0) {
              const itemSize = item.size || "N/A";
              
              // Size alias mapping for flexible matching
              const normalizeSizeForMatching = (size) => {
                if (!size || size === "N/A") return "";
                const normalized = size.trim().toLowerCase();
                
                // Extract abbreviation from formats like "Small (S)" -> "s"
                const parenMatch = normalized.match(/\(([^)]+)\)/);
                if (parenMatch) {
                  return parenMatch[1].trim().toLowerCase();
                }
                
                return normalized;
              };

              const normalizedItemSize = normalizeSizeForMatching(itemSize);
              
              // Size aliases map (same as backend)
              const sizeAliases = {
                'xs': ['xsmall', 'extra small', 'xs', 'x-small'],
                's': ['small', 's'],
                'm': ['medium', 'm'],
                'l': ['large', 'l'],
                'xl': ['xlarge', 'extra large', 'xl', 'x-large'],
                'xxl': ['2xlarge', '2xl', 'xxl', 'double extra large', '2x-large'],
                '3xl': ['3xlarge', '3xl', 'triple extra large', '3x-large']
              };

              // Find matching size using alias matching
              const sizeData = sizesData.find((s) => {
                const dbSize = s.size || "N/A";
                const normalizedDbSize = normalizeSizeForMatching(dbSize);
                
                // Direct match
                if (normalizedItemSize === normalizedDbSize) {
                  return true;
                }
                
                // Check if both belong to the same alias group
                for (const [key, aliases] of Object.entries(sizeAliases)) {
                  const itemInGroup = aliases.includes(normalizedItemSize);
                  const dbInGroup = aliases.includes(normalizedDbSize);
                  if (itemInGroup && dbInGroup) {
                    return true;
                  }
                }
                
                return false;
              });

              // Item is available if size exists and has stock > 0
              if (sizeData && (sizeData.stock > 0 || sizeData.available > 0)) {
                return true;
              }

              // Also check if item has no size requirement (N/A)
              if (itemSize === "N/A" || itemSize === "") {
                // Check if any size has stock
                return sizesData.some((s) => (s.stock > 0 || s.available > 0));
              }

              return false;
            }

            return false;
          } catch (error) {
            console.error(
              `Error checking availability for ${item.name}:`,
              error
            );
            return false;
          }
        })
      );

      // All items must be available
      const allAvailable = availabilityChecks.every((available) => available);

      setOrderAvailability((prev) => ({ ...prev, [orderId]: allAvailable }));
      setCheckingAvailability((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });

      return allAvailable;
    } catch (error) {
      console.error("Error checking pre-order availability:", error);
      setOrderAvailability((prev) => ({ ...prev, [orderId]: false }));
      setCheckingAvailability((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - using functional updates for state

  // Check availability when pre-orders are displayed
  useEffect(() => {
    if (activeCategory === "preOrders" && paginatedOrders.length > 0) {
      // Use forEach but don't await - we're just triggering the checks
      paginatedOrders.forEach((order) => {
        if (order.order_type === "pre-order") {
          const orderId = order.id || order.order_number;
          // Only check if not already checking and not already checked
          if (!checkingAvailability[orderId] && orderAvailability[orderId] === undefined) {
            checkPreOrderAvailability(order).catch((error) => {
              console.error("Error in availability check:", error);
            });
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, paginatedOrders]);

  // Handle convert pre-order to regular order
  const handleConvertPreOrder = useCallback(async (order) => {
    // Must use UUID id, not order_number (which is a string like "ORD-...")
    const orderId = order.id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!orderId) {
      console.error("Order missing UUID id:", order);
      return;
    }
    
    if (!uuidRegex.test(orderId)) {
      console.error("Invalid UUID format:", { orderId, fullOrder: order });
      return;
    }
    
    if (convertingOrders[orderId]) {
      return; // Already converting
    }

    console.log(`🔄 Converting pre-order:`, { orderId, orderNumber: order.orderNumber || order.order_number, order });
    setConvertingOrders((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await orderAPI.convertPreOrderToRegular(orderId);

      if (response.data.success) {
        console.log(`✅ Order #${order.order_number || order.orderNumber} converted successfully`);
        
        // Refresh orders
        window.location.reload(); // Simple refresh - could be improved with context refetch

        // Optionally navigate to Orders tab
        // setActiveCategory("orders");
        // setViewMode("detail");
      } else {
        throw new Error(response.data.message || "Failed to convert pre-order");
      }
    } catch (error) {
      console.error("Error converting pre-order:", error);
      console.error("Error details:", {
        message: error.response?.data?.message || error.message,
        response: error.response?.data
      });
    } finally {
      setConvertingOrders((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  }, [convertingOrders]);

  // Cancel order (student self-cancel); inventory is restored on the backend
  const handleCancelOrder = useCallback(async (order) => {
    const orderId = order.id || order._original?.id;
    if (!orderId) return;
    if (cancellingOrders[orderId]) return;

    setCancellingOrders((prev) => ({ ...prev, [orderId]: true }));
    try {
      const response = await orderAPI.updateOrderStatus(orderId, "cancelled");
      if (response.data?.success) {
        await fetchOrders();
      } else {
        throw new Error(response.data?.message || "Failed to cancel order");
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      const message = err.response?.data?.message || err.message || "Failed to cancel order";
      alert(message);
    } finally {
      setCancellingOrders((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  }, [cancellingOrders, fetchOrders]);

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
        className="flex flex-col items-center gap-2 sm:gap-3 group relative"
      >
        <div 
          className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20 rounded-full flex items-center justify-center bg-white border-2 border-gray-300 ${config.hoverBorder} ${config.hoverBg} transition-all duration-300 group-hover:shadow-lg`}
        >
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#003363] transition-colors" />

          {count > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#F28C28] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-[10px] sm:text-xs font-bold">{count}</span>
            </div>
          )}
        </div>

        <span className="text-xs sm:text-sm font-semibold text-[#003363] transition-colors text-center">
          {label}
        </span>

        {/* Tooltip */}
        {showTooltip && (
          <div className={`hidden sm:block absolute top-full mt-4 left-1/2 -translate-x-1/2 w-56 sm:w-64 ${config.tooltipBg} text-[#003363] text-sm p-3 sm:p-4 rounded-lg shadow-lg z-50`}>
            {/* Arrow */}
            <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent ${config.tooltipArrow}`}></div>
            
            <p className="font-bold mb-2 text-xs sm:text-sm">{config.title}</p>
            <p className="text-[10px] sm:text-xs leading-relaxed">
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

  // Safety check: ensure we have valid orders data
  if (!safeOrders || !Array.isArray(safeOrders)) {
    return (
      <div className="text-center text-gray-500 py-16">
        <p className="text-lg font-semibold">No orders data available</p>
        <p className="text-sm mt-2">Please try refreshing the page</p>
      </div>
    );
  }

  // OVERVIEW VIEW - Category buttons + Suggested products (skip when history variant)
  if (viewMode === "overview" && !isHistoryView) {
    return (
      <div className="space-y-8 sm:space-y-10 md:space-y-12">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          <span className="text-[#003363]">My </span>
          <span className="text-[#F28C28]">Orders</span>
        </h2>

        {/* Category Buttons */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-12 lg:gap-16 py-4 sm:py-6 md:py-8">
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

        {/* Suggested For You Section - same disabled state as All Products */}
        {suggestedProductsWithLimit.length > 0 && (
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
              <h3 className="text-xl sm:text-2xl font-bold">
                <span className="text-gray-700">Suggested </span>
                <span className="text-[#F28C28]">For You</span>
              </h3>
              <button
                onClick={() => navigate("/all-products")}
                className="flex items-center gap-2 text-[#F28C28] hover:text-[#d97a1f] font-semibold transition-colors text-sm sm:text-base self-start sm:self-auto"
              >
                <span className="whitespace-nowrap">Explore More Products</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </button>
            </div>

            {/* Product Grid - use ProductCard so disabled state matches All Products */}
            {/* Mobile M (375px): 2 cols, Mobile L (425px): 2 cols, Tablet (768px): 3 cols, Laptop (1024px): 4 cols */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {suggestedProductsWithLimit.map((product, index) => (
                <ProductCard
                  key={product.id || index}
                  product={product}
                  blockedDueToVoid={blockedDueToVoid}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DETAIL VIEW - Order list (claimed orders when variant=history)
  return (
    <>
      <div className="space-y-6">
        {/* Header: Back button + Category tabs (hidden in history variant) */}
        {!isHistoryView && (
          <div className="flex items-start justify-between mb-6">
            <button
              onClick={handleBackToOverview}
              className="p-3 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <span className="text-2xl text-[#003363]">←</span>
            </button>
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
        )}

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

        {/* Orders List (or Order History card grid) */}
        {listForPagination.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-500">No orders found in this category</p>
          </div>
        ) : isHistoryView ? (
          /* Order History: card layout – image, title, View Details, Order Again only (no 1pc, FREE, Show QR) */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHistoryCards.map(({ order, item }, cardIndex) => {
                const itemName = item.name || order.item || "Item";
                const educationLevel = getEducationLevel(item, order);
                const imageUrl = item.image || order.image;
                const maxQuantityKey = resolveItemKeyForMaxQuantity(itemName);
                const maxForItem = maxQuantities[maxQuantityKey] ?? getDefaultMaxForItem(itemName);
                const alreadyOrderedForItem = alreadyOrdered[maxQuantityKey] ?? 0;
                const claimedForItem = claimedItems[maxQuantityKey] ?? 0;
                const isClaimed = claimedForItem > 0;
                const canOrderAgain = !isClaimed && Number(maxForItem) > 0 && alreadyOrderedForItem < Number(maxForItem);
                return (
                  <div
                    key={`${order.id || cardIndex}-${item.name || cardIndex}`}
                    className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden rounded-t-xl">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={itemName}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="p-4 min-w-0">
                      <h4 className="text-base font-bold text-[#003363] mb-1 line-clamp-2">
                        {itemName}
                      </h4>
                      <p className="text-sm text-[#F28C28] font-semibold mb-4">
                        ({educationLevel})
                      </p>
                      <div className="flex items-center gap-2 w-full min-w-0">
                        <button
                          type="button"
                          onClick={() => handleShowQR(order)}
                          className="flex-1 min-w-0 py-1.5 px-2 border-2 border-[#003363] text-[#003363] rounded-lg font-semibold text-xs text-center hover:bg-[#003363] hover:text-white transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => canOrderAgain && navigate("/all-products")}
                          disabled={!canOrderAgain}
                          title={canOrderAgain ? "Order this item again" : (isClaimed ? "This item has been claimed and cannot be ordered again" : "You have reached your max item per order")}
                          className={`flex-1 min-w-0 py-1.5 px-2 border-2 rounded-lg font-semibold text-xs text-center transition-colors ${
                            canOrderAgain
                              ? "border-[#F28C28] text-[#F28C28] hover:bg-[#F28C28] hover:text-white cursor-pointer"
                              : "border-gray-300 text-gray-400 cursor-not-allowed opacity-70"
                          }`}
                        >
                          Order Again
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {listForPagination.length > itemsPerPage && (
              <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
                <span className="text-sm text-gray-600 mr-4">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className={`px-6 py-2.5 rounded-lg font-semibold text-sm ${
                      currentPage >= totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-[#003363] text-white hover:bg-[#002347]"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Single Border Container */}
            <div className="bg-white rounded-lg border-2 border-gray-200 divide-y divide-gray-200">
              {paginatedOrders.map((order, orderIndex) => {
                // Safety check: ensure order exists and has required properties
                if (!order) return null;
                
                // Must use UUID id for database operations, fallback to order_number only for display/key
                const orderId = order.id || `order-${orderIndex}`;
                const orderKey = order.id || order.order_number || `order-${orderIndex}`;
                
                return (
                <div key={orderKey} className="p-6">
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
                                  loading="lazy"
                                  decoding="async"
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

                            {/* Price: same as MyCart – strikethrough product price above Free (logo patch etc. use display price when 0) */}
                            <div className="flex-shrink-0 text-right">
                              {(() => {
                                const itemName = item.name || order.item || "";
                                const displayUnitPrice = getDisplayPriceForFreeItem(itemName, item.price);
                                const qty = Number(item.quantity) || 1;
                                const itemTotal = displayUnitPrice * qty;
                                return (
                                  <div className="flex flex-col items-end text-xl font-bold text-[#003363]">
                                    {itemTotal > 0 && (
                                      <span className="line-through text-gray-500 font-semibold text-base">
                                        ₱{itemTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                    <span className={itemTotal > 0 ? "mt-0.5" : ""}>FREE</span>
                                  </div>
                                );
                              })()}
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
                        {/* Price: same as MyCart – strikethrough order total above Free (logo patch etc. use display price when 0) */}
                        <div className="flex-shrink-0 text-right">
                          {(() => {
                            const orderItemName = order.item || "";
                            const storedTotal = Number(order.total_amount) || 0;
                            const qty = Number(order.quantity) || 1;
                            const storedUnit = qty > 0 ? storedTotal / qty : 0;
                            const displayUnitPrice = getDisplayPriceForFreeItem(orderItemName, storedUnit);
                            const displayTotal = displayUnitPrice * qty;
                            return (
                              <div className="flex flex-col items-end text-xl font-bold text-[#003363]">
                                {displayTotal > 0 && (
                                  <span className="line-through text-gray-500 font-semibold text-base">
                                    ₱{displayTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className={displayTotal > 0 ? "mt-0.5" : ""}>FREE</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button - Order for pre-orders, Show QR for regular orders */}
                  <div className="flex justify-end">
                    {activeCategory === "preOrders" ? (
                      <button
                        onClick={() => handleConvertPreOrder(order)}
                        disabled={
                          !orderAvailability[orderId] ||
                          convertingOrders[orderId] ||
                          checkingAvailability[orderId]
                        }
                        className={`px-6 py-2 border-2 rounded-full font-semibold text-sm transition-colors ${
                          orderAvailability[orderId] &&
                          !convertingOrders[orderId] &&
                          !checkingAvailability[orderId]
                            ? "border-[#003363] text-[#003363] hover:bg-[#003363] hover:text-white"
                            : "border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                        }`}
                        title={
                          checkingAvailability[orderId]
                            ? "Checking availability..."
                            : orderAvailability[orderId]
                            ? "Click to convert pre-order to regular order"
                            : "Item not yet available"
                        }
                      >
                        {convertingOrders[orderId]
                          ? "Processing..."
                          : checkingAvailability[orderId]
                          ? "Checking..."
                          : orderAvailability[orderId]
                          ? "Order"
                          : "Not Available"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        {activeCategory === "orders" && (
                          <button
                            onClick={() => setOrderToCancel(order)}
                            disabled={cancellingOrders[order.id || order._original?.id]}
                            className="px-6 py-2 border-2 border-red-500 text-red-600 rounded-full font-semibold text-sm transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Cancel this order so you can place a new one"
                          >
                            {cancellingOrders[order.id || order._original?.id] ? "Cancelling…" : "Cancel"}
                          </button>
                        )}
                        <button
                          onClick={() => handleShowQR(order)}
                          className="px-6 py-2 border-2 border-[#003363] text-[#003363] rounded-full font-semibold text-sm transition-colors hover:bg-[#003363] hover:text-white"
                          title="Show QR code"
                        >
                          Show QR
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {listForPagination.length > itemsPerPage && (
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

      {/* QR Modal - portaled to body so overlay sits above header and blurs it */}
      {showQRModal &&
        createPortal(
          <QRCodeModal
            order={selectedOrder}
            profileData={user}
            onClose={() => {
              setShowQRModal(false);
              setSelectedOrder(null);
            }}
          />,
          document.body
        )}

      {/* Cancel order confirmation modal */}
      {orderToCancel &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
            aria-modal="true"
            role="dialog"
            aria-labelledby="cancel-order-title"
            onClick={() => setOrderToCancel(null)}
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h2 id="cancel-order-title" className="text-lg font-semibold text-gray-900 mb-2">
                Cancel order
              </h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this order? You can place a new order after cancelling.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOrderToCancel(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Keep order
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const order = orderToCancel;
                    setOrderToCancel(null);
                    await handleCancelOrder(order);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  Yes, cancel order
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default MyOrders;
