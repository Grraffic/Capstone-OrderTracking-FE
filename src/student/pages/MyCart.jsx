import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { resolveItemKeyForMaxQuantity, DEFAULT_MAX_WHEN_UNKNOWN } from "../../utils/maxQuantityKeys";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import toast from "react-hot-toast";

/**
 * MyCart Component
 *
 * Student cart page displaying selected items with the following features:
 * - View all cart items with product details
 * - Edit mode to select and remove multiple items
 * - Update quantities with +/- controls
 * - Responsive design (mobile, tablet, desktop)
 * - No pricing displayed (uniforms are free for students)
 * - Order submission from cart
 */
const MyCart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, loading, updateCartItem, removeFromCart } = useCart();
  const { useCartCheckout: switchToCartCheckout } = useCheckout();
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [maxQuantities, setMaxQuantities] = useState({});
  const [alreadyOrdered, setAlreadyOrdered] = useState({});
  const [maxItemsPerOrder, setMaxItemsPerOrder] = useState(null);
  const [slotsUsedFromPlacedOrders, setSlotsUsedFromPlacedOrders] = useState(0);
  const [limitsRefreshTrigger, setLimitsRefreshTrigger] = useState(0);
  const [blockedDueToVoid, setBlockedDueToVoid] = useState(false);

  // Refetch limits when an order was just created (e.g. after checkout) or when tab regains focus.
  // When visible and logged in, always refetch so "already ordered" is up to date (e.g. checkout in another tab).
  // On pageshow persisted (bfcache): page restored via Back button; refetch so item stays disabled.
  useEffect(() => {
    const onOrderCreated = () => setLimitsRefreshTrigger((t) => t + 1);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      try {
        if (sessionStorage.getItem("limitsNeedRefresh")) setLimitsRefreshTrigger((t) => t + 1);
      } catch {
        /* ignore when sessionStorage unavailable */
      }
      if (user) setLimitsRefreshTrigger((t) => t + 1);
    };
    const onPageShow = (e) => {
      if (e.persisted && user) setLimitsRefreshTrigger((t) => t + 1);
    };
    window.addEventListener("order-created", onOrderCreated);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("order-created", onOrderCreated);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [user]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("limitsNeedRefresh")) setLimitsRefreshTrigger((t) => t + 1);
    } catch {
      /* ignore when sessionStorage unavailable */
    }
  }, []);

  useEffect(() => {
    const fetchMaxQuantities = async () => {
      if (!user) return;
      try {
        const res = await authAPI.getMaxQuantities();
        setMaxQuantities(res.data?.maxQuantities ?? {});
        setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
        setMaxItemsPerOrder(res.data?.maxItemsPerOrder ?? null);
        setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? Object.keys(res.data?.alreadyOrdered ?? {}).length);
        setBlockedDueToVoid(res.data?.blockedDueToVoid === true);
        try {
          sessionStorage.removeItem("limitsNeedRefresh");
        } catch {
          /* ignore when sessionStorage unavailable */
        }
      } catch (err) {
        if (err?.response?.status !== 400 && err?.response?.status !== 403) {
          console.error("Error fetching max quantities:", err);
        }
        setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
        setAlreadyOrdered(err?.response?.data?.alreadyOrdered ?? {});
        setMaxItemsPerOrder(err?.response?.data?.maxItemsPerOrder ?? null);
        setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? Object.keys(err?.response?.data?.alreadyOrdered ?? {}).length);
        setBlockedDueToVoid(err?.response?.data?.blockedDueToVoid === true);
      }
    };
    fetchMaxQuantities();
  }, [user, limitsRefreshTrigger]);

  // Max items per order is reduced only when the student places an order (placed orders only; cart does not count).
  const slotsLeftForThisOrder = useMemo(() => {
    if (maxItemsPerOrder == null || Number(maxItemsPerOrder) <= 0) return 0;
    const used = Number(slotsUsedFromPlacedOrders) || 0;
    return Math.max(0, Number(maxItemsPerOrder) - used);
  }, [maxItemsPerOrder, slotsUsedFromPlacedOrders]);

  const cartSlotCount = useMemo(() => {
    const set = new Set();
    (items || []).forEach((i) => {
      const k = resolveItemKeyForMaxQuantity(i.inventory?.name || i.name || "");
      if (k) set.add(k);
    });
    return set.size;
  }, [items]);
  const isOverSlotLimit =
    maxItemsPerOrder != null && Number(maxItemsPerOrder) > 0 && cartSlotCount > slotsLeftForThisOrder;

  const limitNotSet =
    user &&
    (maxItemsPerOrder == null || maxItemsPerOrder === undefined || Number(maxItemsPerOrder) <= 0);

  // Old students: only allowed items have max > 0; others are disallowed (max 0).
  const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";
  const getEffectiveMaxForItem = (key) =>
    isOldStudent && (maxQuantities[key] === undefined || maxQuantities[key] === null)
      ? 0
      : (maxQuantities[key] ?? DEFAULT_MAX_WHEN_UNKNOWN);

  // Handle back navigation
  const handleBack = () => {
    navigate("/all-products");
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (editMode) {
      setSelectedItems([]); // Clear selections when exiting edit mode
    }
  };

  // Handle checkbox selection
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle select all (select all individual cart items, not groups)
  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  // Handle quantity update (cap by max per student for this item, including already placed orders)
  const handleQuantityChange = async (itemId, currentQuantity, change, itemName) => {
    let newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;

    const key = itemName != null ? resolveItemKeyForMaxQuantity(itemName) : "";
    const maxForItem = key ? getEffectiveMaxForItem(key) : DEFAULT_MAX_WHEN_UNKNOWN;
    const totalForItem = (items || [])
      .filter((i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key)
      .reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const alreadyOrderedForItem = (alreadyOrdered[key] || 0);
    const roomForThisLine = maxForItem - (totalForItem - currentQuantity) - alreadyOrderedForItem;
    newQuantity = Math.min(newQuantity, Math.max(1, roomForThisLine), maxForItem - alreadyOrderedForItem);

    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    }
  };

  // Handle remove selected items
  const handleRemoveSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to remove");
      return;
    }

    try {
      // Remove all selected items
      await Promise.all(selectedItems.map((itemId) => removeFromCart(itemId)));
      setSelectedItems([]);
      setEditMode(false);
      toast.success(`${selectedItems.length} item(s) removed from cart`);
    } catch (error) {
      console.error("Failed to remove items:", error);
      toast.error("Failed to remove items");
    }
  };

  // Detect if any item type has (cart total + already ordered) over the per-student max
  const { hasOverLimitItems, overLimitSummary } = useMemo(() => {
    const byKey = {};
    for (const item of items || []) {
      const name = item.inventory?.name || item.name || "Unknown Item";
      const key = resolveItemKeyForMaxQuantity(name);
      if (!byKey[key]) byKey[key] = { total: 0, max: getEffectiveMaxForItem(key), alreadyOrdered: alreadyOrdered[key] || 0, displayName: name };
      byKey[key].total += Number(item.quantity) || 0;
    }
    const summary = Object.entries(byKey)
      .filter(([, v]) => (v.total + (v.alreadyOrdered || 0)) > v.max)
      .map(([key, v]) => ({ key, ...v }));
    return { hasOverLimitItems: summary.length > 0, overLimitSummary: summary };
  }, [items, maxQuantities, alreadyOrdered, isOldStudent]);

  // Handle order now (blocked when limit not set, blockedDueToVoid, hasOverLimitItems, or over slot limit)
  const handleOrderNow = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (blockedDueToVoid) {
      toast.error("You cannot place new orders because a previous order was not claimed in time and was voided. Contact your administrator if you need assistance.");
      return;
    }
    if (limitNotSet) {
      toast.error(
        "Your order limit has not been set. Please ask your administrator to set your Max Items Per Order in System Admin before you can place orders."
      );
      return;
    }
    if (hasOverLimitItems) {
      toast.error("Remove the extra items over the maximum allowed to place your order.");
      return;
    }
    if (isOverSlotLimit) {
      toast.error(
        `You have ${slotsLeftForThisOrder} item type${slotsLeftForThisOrder !== 1 ? "s" : ""} left for this order (max ${maxItemsPerOrder} total; ${slotsUsedFromPlacedOrders} already in placed orders). Your cart has ${cartSlotCount}. Remove some item types to proceed.`
      );
      return;
    }

    // Set to cart checkout mode (all items from cart)
    switchToCartCheckout();

    // Navigate to checkout page
    navigate("/student/checkout");
  };

  // Empty cart state
  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <HeroSection heading="Item Cart" align="bottom-center" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-16">
          <div className="w-full">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12 text-center mb-8">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-6">
                Start adding items to your cart to see them here
              </p>
              <button
                onClick={() => navigate("/all-products")}
                className="px-6 py-3 bg-[#e68b00] text-white rounded-lg hover:bg-[#d17d00] transition-colors font-medium"
              >
                Browse Products
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection heading="Item Cart" align="bottom-center" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-16">
        <div className="w-full">
          {/* Cart Container – narrower width; -mt-16 keeps "Item Cart" text visible above */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between gap-6">
                {/* Left: Circular Back + My Cart */}
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={handleBack}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors shrink-0"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                    <span className="text-[#0C2340]">My </span>
                    <span className="text-[#E68B00]">Cart</span>
                  </h1>
                </div>

                {/* Right: Edit Cart on top, then cart icon + X Items below — left-aligned so both line up under Edit Cart */}
                <div className="flex flex-col items-start gap-1.5">
                  <button
                    onClick={handleEditToggle}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#0C2340] hover:bg-[#0a1d33] rounded-lg transition-colors"
                  >
                    {editMode ? "Done" : "Edit Cart"}
                  </button>
                  <div className="flex flex-col items-start gap-0.5 text-[#E68B00]">
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {items.length} {items.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>
                    {maxItemsPerOrder != null && Number(maxItemsPerOrder) > 0 && (
                      <span className="text-xs text-gray-600">
                        {cartSlotCount} of {slotsLeftForThisOrder} item type{(cartSlotCount !== 1 || slotsLeftForThisOrder !== 1) ? "s" : ""} left for this order
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Mode Actions */}
              {editMode && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-[#0C2340] hover:underline font-medium"
                  >
                    {selectedItems.length === items.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={handleRemoveSelected}
                      className="flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove ({selectedItems.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Product List - Desktop Table (flat, one row per item) */}
            <div className="hidden md:block max-h-[32rem] overflow-y-auto overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    {editMode && <th className="w-12 px-6 py-4"></th>}
                    <th className="px-6 py-4 text-left text-sm font-semibold text-[#0C2340]">
                      Product
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#0C2340]">
                      Size
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-[#0C2340]">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-[#0C2340]">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const name = item.inventory?.name || item.name || "Unknown Item";
                    const key = resolveItemKeyForMaxQuantity(name);
                    const educationLevel = item.inventory?.education_level || item.inventory?.educationLevel || item.inventory?.item_type || item.inventory?.itemType || "";
                    const image = item.inventory?.image || item.image || null;
                    const maxForItem = getEffectiveMaxForItem(key);
                    const qty = item.quantity || 1;
                    const totalForItem = (items || []).filter(
                      (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
                    ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                    const alreadyOrderedForItem = alreadyOrdered[key] || 0;
                    const isOverLimit = (totalForItem + alreadyOrderedForItem) > maxForItem;
                    return (
                      <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isOverLimit ? "bg-amber-50/50" : ""}`}>
                        {editMode && (
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="w-5 h-5 text-[#e68b00] border-gray-300 rounded focus:ring-[#e68b00]"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <img
                              src={image || "/assets/image/card1.png"}
                              alt={name}
                              className="w-16 h-16 object-cover rounded-lg"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.target.src = "/assets/image/card1.png";
                              }}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-[#0C2340]">{name}</p>
                              {educationLevel && (
                                <p className="text-sm text-[#e68b00]">({educationLevel})</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-700">
                          {item.size || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {editMode ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleQuantityChange(item.id, qty, -1, name)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                  disabled={qty <= 1}
                                >
                                  <Minus className="w-4 h-4 text-gray-700" />
                                </button>
                                <span className="w-8 text-center font-medium text-sm text-gray-700">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.id, qty, 1, name)}
                                  className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={(totalForItem + alreadyOrderedForItem) >= maxForItem}
                                >
                                  <Plus className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>
                              <span className={`text-xs ${isOverLimit ? "text-amber-600 font-medium" : "text-gray-500"}`}>
                                {isOverLimit ? `Over limit (max ${maxForItem})` : `Max ${maxForItem} per student`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-700 font-medium">{qty}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-700 font-medium">Free</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product List - Mobile Cards (flat, one card per item) */}
            <div className="md:hidden max-h-[32rem] overflow-y-auto divide-y divide-gray-200">
              {items.map((item) => {
                const name = item.inventory?.name || item.name || "Unknown Item";
                const key = resolveItemKeyForMaxQuantity(name);
                const educationLevel = item.inventory?.education_level || item.inventory?.educationLevel || item.inventory?.item_type || item.inventory?.itemType || "";
                const image = item.inventory?.image || item.image || null;
                const maxForItem = getEffectiveMaxForItem(key);
                const qty = item.quantity || 1;
                const totalForItem = (items || []).filter(
                  (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
                ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                const alreadyOrderedForItem = alreadyOrdered[key] || 0;
                const isOverLimit = (totalForItem + alreadyOrderedForItem) > maxForItem;
                return (
                  <div key={item.id} className={`p-4 ${isOverLimit ? "bg-amber-50/50" : ""}`}>
                    <div className="flex items-start space-x-4">
                      {editMode && (
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="mt-1 w-5 h-5 text-[#e68b00] border-gray-300 rounded focus:ring-[#e68b00]"
                        />
                      )}
                      <img
                        src={image || "/assets/image/card1.png"}
                        alt={name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.src = "/assets/image/card1.png";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#0C2340] mb-1">{name}</h3>
                        {educationLevel && (
                          <p className="text-sm text-[#e68b00] mb-2">({educationLevel})</p>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 font-medium">
                            Size: {item.size || "N/A"}
                          </span>
                          <span className="text-gray-700 font-medium">Free</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Qty:</span> {qty}
                        </div>
                        {editMode && (
                          <div className="flex flex-col gap-0.5 mt-2">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleQuantityChange(item.id, qty, -1, name)}
                                className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={qty <= 1}
                              >
                                <Minus className="w-3 h-3 text-gray-700" />
                              </button>
                              <span className="w-6 text-center font-medium text-sm">
                                {qty}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, qty, 1, name)}
                                className="w-7 h-7 flex items-center justify-center bg-white hover:bg-gray-100 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={(totalForItem + alreadyOrderedForItem) >= maxForItem}
                              >
                                <Plus className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>
                            <span className={`text-xs ${isOverLimit ? "text-amber-600 font-medium" : "text-gray-500"}`}>
                              {isOverLimit ? `Over limit (max ${maxForItem})` : `Max ${maxForItem} per student`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Over-limit warning and Order Now */}
            {hasOverLimitItems && (
              <div className="bg-amber-50 border-t border-amber-200 px-6 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-800">You have more than the maximum allowed for some items.</p>
                  <p className="text-sm text-amber-700 mt-1">
                    If your orders or cart are already at the max for an item, you cannot add more or place another order for that item. Remove the extras to place your order. For example: {overLimitSummary[0]?.displayName} — max {overLimitSummary[0]?.max} per student{overLimitSummary[0]?.alreadyOrdered ? `, you have ${overLimitSummary[0]?.total} in cart (${overLimitSummary[0]?.alreadyOrdered} already ordered)` : `, you have ${overLimitSummary[0]?.total}`}.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    The only items you can still order are those where you have remaining quota (e.g. for Preschool: 1 Kinder Dress, 1 Kinder Necktie, 1 Jersey, 1 ID Lace each, if not yet used).
                  </p>
                </div>
              </div>
            )}
            {isOverSlotLimit && (
              <div className="bg-amber-50 border-t border-amber-200 px-6 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-800">Item type limit for this order reached.</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You have {slotsLeftForThisOrder} item type{slotsLeftForThisOrder !== 1 ? "s" : ""} left for this order (max {maxItemsPerOrder} total; {slotsUsedFromPlacedOrders} already used in placed orders). Your cart has {cartSlotCount}. Only placed orders count toward the limit—cart does not. Remove some item types to place your order. After you place, you must wait the lockout period before placing another.
                  </p>
                </div>
              </div>
            )}
            {limitNotSet && (
              <div className="bg-amber-50 border-t border-amber-200 px-6 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-800">
                    Your order limit has not been set. Please ask your administrator to set your Max Items Per Order in System Admin before you can place orders.
                  </p>
                </div>
              </div>
            )}
            {blockedDueToVoid && (
              <div className="bg-red-50 border-t border-red-200 px-6 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-red-800">
                    You cannot place new orders because a previous order was not claimed in time and was voided. Contact your administrator if you need assistance.
                  </p>
                </div>
              </div>
            )}
            <div className="bg-white border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={handleOrderNow}
                disabled={items.length === 0 || loading || hasOverLimitItems || isOverSlotLimit || limitNotSet || blockedDueToVoid}
                title={limitNotSet ? "Your order limit has not been set. Please ask your administrator to set your Max Items Per Order in System Admin before you can place orders." : undefined}
                className="px-8 py-3 bg-[#e68b00] text-white font-semibold rounded-lg hover:bg-[#d17d00] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Order Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCart;
