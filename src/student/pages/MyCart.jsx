import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { resolveItemKeyForMaxQuantity, getDefaultMaxForItem, getDefaultMaxByKey } from "../../utils/maxQuantityKeys";
import { getDisplayPriceForFreeItem } from "../../utils/freeItemDisplayPrice";
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
  const [claimedItems, setClaimedItems] = useState({});
  const [totalItemLimit, setMaxItemsPerOrder] = useState(null);
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
        setClaimedItems(res.data?.claimedItems ?? {});
        setMaxItemsPerOrder(res.data?.totalItemLimit ?? null);
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
        setClaimedItems(err?.response?.data?.claimedItems ?? {});
        setMaxItemsPerOrder(err?.response?.data?.totalItemLimit ?? null);
        setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? Object.keys(err?.response?.data?.alreadyOrdered ?? {}).length);
        setBlockedDueToVoid(err?.response?.data?.blockedDueToVoid === true);
      }
    };
    fetchMaxQuantities();
  }, [user, limitsRefreshTrigger]);

  // Total item limit is reduced only when the student places an order (placed orders only; cart does not count).
  const slotsLeftForThisOrder = useMemo(() => {
    if (totalItemLimit == null || Number(totalItemLimit) <= 0) return 0;
    const used = Number(slotsUsedFromPlacedOrders) || 0;
    return Math.max(0, Number(totalItemLimit) - used);
  }, [totalItemLimit, slotsUsedFromPlacedOrders]);

  const cartSlotCount = useMemo(() => {
    const set = new Set();
    (items || []).forEach((i) => {
      const k = resolveItemKeyForMaxQuantity(i.inventory?.name || i.name || "");
      if (k) set.add(k);
    });
    return set.size;
  }, [items]);
  const isOverSlotLimit =
    totalItemLimit != null && Number(totalItemLimit) > 0 && cartSlotCount > slotsLeftForThisOrder;

  const limitNotSet =
    user &&
    (totalItemLimit == null || totalItemLimit === undefined || Number(totalItemLimit) <= 0);

  // Old students: only allowed items have max > 0; others are disallowed (max 0).
  const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";
  const getEffectiveMaxForItem = (key) =>
    isOldStudent && (maxQuantities[key] === undefined || maxQuantities[key] === null)
      ? 0
      : (maxQuantities[key] ?? getDefaultMaxByKey(key));

  // Handle back navigation
  const handleBack = () => {
    navigate("/all-products");
  };

  // Toggle edit mode
  const handleEditToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Edit Cart button clicked, current editMode:", editMode);
    setEditMode((prev) => {
      const newMode = !prev;
      console.log("Setting editMode to:", newMode);
      if (prev) {
        // Exiting edit mode - clear selections
        setSelectedItems([]);
      }
      return newMode;
    });
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
    if (newQuantity < 1) {
      // If trying to go below 1, remove the item instead
      try {
        await removeFromCart(itemId);
      } catch (error) {
        console.error("Failed to remove item:", error);
      }
      return;
    }

    const key = itemName != null ? resolveItemKeyForMaxQuantity(itemName) : "";
    const maxForItem = key ? getEffectiveMaxForItem(key) : getDefaultMaxForItem(itemName ?? "");
    const totalForItem = (items || [])
      .filter((i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key)
      .reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const alreadyOrderedForItem = (alreadyOrdered[key] || 0);
    const claimedForItem = (claimedItems[key] || 0);
    
    // Calculate effective max: For items with max > 1, only subtract claimed items
    // For items with max = 1, subtract both claimed and already ordered to prevent duplicates
    const shouldAllowMultipleOrders = maxForItem > 1;
    const subtractAlreadyOrdered = !shouldAllowMultipleOrders;
    const effectiveMax = Math.max(0, maxForItem - (subtractAlreadyOrdered ? alreadyOrderedForItem : 0) - claimedForItem);
    
    // Calculate room available for this line item
    const roomForThisLine = effectiveMax - (totalForItem - currentQuantity);
    newQuantity = Math.min(newQuantity, Math.max(1, roomForThisLine), effectiveMax);

    // If new quantity would be 0 or less, remove the item instead
    if (newQuantity < 1) {
      try {
        await removeFromCart(itemId);
        toast.info("Item removed - maximum quantity reached");
      } catch (error) {
        console.error("Failed to remove item:", error);
      }
      return;
    }

    try {
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error("Failed to update quantity");
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
      // Get claimed count for this item
      let claimedForItem = claimedItems[key] || 0;
      const max = getEffectiveMaxForItem(key);
      if (!byKey[key]) byKey[key] = { total: 0, max: max, alreadyOrdered: alreadyOrdered[key] || 0, claimed: claimedForItem, displayName: name };
      byKey[key].total += Number(item.quantity) || 0;
    }
    const summary = Object.entries(byKey)
      .filter(([, v]) => {
        // Block if claimed count has reached max
        const isClaimedMaxReached = v.max > 0 && v.claimed >= v.max;
        // For items with max > 1, only check cart + claimed (don't include already ordered)
        // For items with max = 1, check cart + claimed + already ordered
        const shouldAllowMultipleOrders = v.max > 1;
        const subtractAlreadyOrdered = !shouldAllowMultipleOrders;
        const totalUsed = v.claimed + (subtractAlreadyOrdered ? v.alreadyOrdered : 0) + v.total;
        const exceedsMax = totalUsed > v.max;
        return isClaimedMaxReached || exceedsMax;
      })
      .map(([key, v]) => ({ key, ...v }));
    
    // Debug logging for logo patch items
    const logoPatchSummary = summary.find(s => s.key === "logo patch");
    if (logoPatchSummary) {
      console.log(`[MyCart] Logo patch over limit detected:`, {
        key: logoPatchSummary.key,
        total: logoPatchSummary.total,
        max: logoPatchSummary.max,
        alreadyOrdered: logoPatchSummary.alreadyOrdered,
        claimed: logoPatchSummary.claimed,
        claimedItemsLogoPatch: claimedItems["logo patch"],
        isClaimedMaxReached: logoPatchSummary.max > 0 && logoPatchSummary.claimed >= logoPatchSummary.max
      });
    }
    
    return { hasOverLimitItems: summary.length > 0, overLimitSummary: summary };
  }, [items, maxQuantities, alreadyOrdered, claimedItems, isOldStudent]);

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
        "Your order limit has not been set. Please ask your administrator to set your Total Item Limit in System Admin before you can place orders."
      );
      return;
    }
    if (hasOverLimitItems) {
      // Check if any items are blocked due to claimed max reached
      const claimedMaxItems = overLimitSummary.filter((v) => v.max > 0 && v.claimed >= v.max);
      console.log(`[MyCart] hasOverLimitItems: true`, {
        overLimitSummary,
        claimedMaxItems,
        totalItems: items.length
      });
      if (claimedMaxItems.length > 0) {
        const itemNames = claimedMaxItems.map((v) => v.displayName).join(", ");
        toast.error(`You have already claimed the maximum allowed quantity for: ${itemNames}. Remove these items from your cart.`);
      } else {
        toast.error("Remove the extra items over the maximum allowed to place your order.");
      }
      return;
    }
    if (isOverSlotLimit) {
      toast.error(
        `You have ${slotsLeftForThisOrder} item type${slotsLeftForThisOrder !== 1 ? "s" : ""} left for this order (max ${totalItemLimit} total; ${slotsUsedFromPlacedOrders} already in placed orders). Your cart has ${cartSlotCount}. Remove some item types to proceed.`
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

                {/* Right: Edit Cart button + cart icon + X Items (slightly inset from right) */}
                <div className="flex flex-col items-end gap-1.5 mr-4">
                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0C2340] hover:bg-[#0a1d33] rounded-lg transition-colors cursor-pointer"
                  >
                    {editMode ? "Done" : "Edit Cart"}
                  </button>
                  <div className="flex flex-col items-end gap-0.5 text-[#E68B00]">
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">
                        {items.length} {items.length === 1 ? "Item" : "Items"}
                      </span>
                    </div>
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
                    const price = item.inventory?.price ?? item.price ?? 0;
                    const maxForItem = getEffectiveMaxForItem(key);
                    const qty = item.quantity || 1;
                    const totalForItem = (items || []).filter(
                      (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
                    ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                    const alreadyOrderedForItem = alreadyOrdered[key] || 0;
                    // Get claimed count for this item
                    let claimedForItem = claimedItems[key] || 0;
                    const isClaimed = claimedForItem > 0;
                    // For items with max > 1, only count claimed items toward the limit
                    // For items with max = 1, count both claimed and already ordered to prevent duplicates
                    const shouldAllowMultipleOrders = maxForItem > 1;
                    const subtractAlreadyOrdered = !shouldAllowMultipleOrders;
                    // Calculate total used: For max > 1, only claimed + cart; for max = 1, include already ordered
                    const totalUsed = claimedForItem + (subtractAlreadyOrdered ? alreadyOrderedForItem : 0) + totalForItem;
                    // Check if adding 1 more would exceed the limit
                    // Only disable if we would exceed the max (not if we're exactly at max)
                    // Note: totalUsed already includes current cart quantity, so we check if totalUsed + 1 > maxForItem
                    const wouldExceedLimit = maxForItem > 0 && (totalUsed + 1) > maxForItem;
                    // Also disable if claimed items alone have reached the max (can't add any more)
                    const isClaimedMaxReached = maxForItem > 0 && claimedForItem >= maxForItem;
                    const isOverLimit = isClaimedMaxReached || totalUsed > maxForItem;
                    
                    // Additional check: If maxForItem seems wrong (e.g., 1 for logo patch when it should be 3),
                    // log a warning but still use the value from API (system admin may have set it intentionally)
                    if (key === "logo patch" && maxForItem === 1 && claimedForItem === 0 && alreadyOrderedForItem === 0) {
                      console.warn(`[MyCart] Logo patch maxForItem is 1, but default should be 3. Check system admin settings. maxQuantities["logo patch"]:`, maxQuantities[key]);
                    }
                    
                    // Debug logging for logo patch
                    if (key === "logo patch" && editMode) {
                      console.log(`[MyCart Logo Patch Debug]`, {
                        key,
                        maxQuantitiesKey: maxQuantities[key],
                        maxForItem,
                        getDefaultMaxByKey: getDefaultMaxByKey(key),
                        isOldStudent,
                        qty,
                        totalForItem,
                        alreadyOrderedForItem,
                        claimedForItem,
                        totalUsed,
                        wouldExceedLimit,
                        isClaimedMaxReached,
                        isOverLimit,
                        buttonDisabled: isClaimedMaxReached || wouldExceedLimit || maxForItem <= 0,
                        maxQuantitiesObject: maxQuantities
                      });
                    }
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
                                  disabled={isClaimedMaxReached || wouldExceedLimit || maxForItem <= 0}
                                >
                                  <Plus className="w-4 h-4 text-gray-700" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-700 font-medium">{qty}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(() => {
                            const displayUnitPrice = getDisplayPriceForFreeItem(name, price);
                            const lineTotal = displayUnitPrice * (Number(qty) || 1);
                            return (
                              <div className="flex flex-col items-end">
                                {lineTotal > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    ₱{lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className="text-gray-700 font-medium">Free</span>
                              </div>
                            );
                          })()}
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
                const price = item.inventory?.price ?? item.price ?? 0;
                const maxForItem = getEffectiveMaxForItem(key);
                const qty = item.quantity || 1;
                const totalForItem = (items || []).filter(
                  (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
                ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
                const alreadyOrderedForItem = alreadyOrdered[key] || 0;
                const claimedForItem = claimedItems[key] || 0;
                const isClaimed = claimedForItem > 0;
                // For items with max > 1, only count claimed items toward the limit
                // For items with max = 1, count both claimed and already ordered to prevent duplicates
                const shouldAllowMultipleOrders = maxForItem > 1;
                const subtractAlreadyOrdered = !shouldAllowMultipleOrders;
                // Calculate total used: For max > 1, only claimed + cart; for max = 1, include already ordered
                const totalUsed = claimedForItem + (subtractAlreadyOrdered ? alreadyOrderedForItem : 0) + totalForItem;
                // Check if adding 1 more would exceed the limit
                // Only disable if we would exceed the max (not if we're exactly at max, since we might want to add more)
                const wouldExceedLimit = maxForItem > 0 && (totalUsed + 1) > maxForItem;
                // Also disable if claimed items alone have reached the max (can't add any more)
                const isClaimedMaxReached = maxForItem > 0 && claimedForItem >= maxForItem;
                const isOverLimit = isClaimedMaxReached || totalUsed > maxForItem;
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
                          {(() => {
                            const displayUnitPrice = getDisplayPriceForFreeItem(name, price);
                            const lineTotal = displayUnitPrice * (Number(qty) || 1);
                            return (
                              <div className="flex flex-col items-end">
                                {lineTotal > 0 && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ₱{lineTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className="text-gray-700 font-medium">Free</span>
                              </div>
                            );
                          })()}
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
                                disabled={isClaimedMaxReached || wouldExceedLimit || maxForItem <= 0}
                              >
                                <Plus className="w-3 h-3 text-gray-700" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {isOverSlotLimit && (
              <div className="bg-amber-50 border-t border-amber-200 px-6 py-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium text-amber-800">Item type limit for this order reached.</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You have {slotsLeftForThisOrder} item type{slotsLeftForThisOrder !== 1 ? "s" : ""} left for this order (max {totalItemLimit} total; {slotsUsedFromPlacedOrders} already used in placed orders). Your cart has {cartSlotCount}. Only placed orders count toward the limit—cart does not. Remove some item types to place your order. After you place, you must wait the lockout period before placing another.
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
                title={limitNotSet ? "Your order limit has not been set. Please ask your administrator to set your Total Item Limit in System Admin before you can place orders." : undefined}
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
