import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import { useOrder } from "../../context/OrderContext";
import { useAuth } from "../../context/AuthContext";
import { useActivity } from "../../context/ActivityContext";
import { itemsAPI, authAPI } from "../../services/api";
import { groupCartItemsByVariations } from "../../utils/groupCartItems";
import { generateOrderReceiptQRData } from "../../utils/qrCodeGenerator";
import { getDisplayPriceForFreeItem } from "../../utils/freeItemDisplayPrice";
import { resolveItemKeyForMaxQuantity, getDefaultMaxForItem, getDefaultMaxByKey } from "../../utils/maxQuantityKeys";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import toast from "react-hot-toast";

/**
 * CheckoutPage Component
 *
 * Simple checkout page matching the design mockup with:
 * - Back button
 * - "Checkout" title (Check in navy, out in orange)
 * - List of cart items with image, size, name, education level, and FREE badge
 * - Orange "Checkout" button at bottom
 * - Clean, minimal design
 *
 * Supports two modes:
 * 1. Direct checkout (Order Now) - shows only the selected item, doesn't add to cart
 * 2. Cart checkout - shows all items from cart
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items: cartItems, loading: cartLoading, clearCart } = useCart();
  const { checkoutItems, isDirectCheckout, orderIntent, clearCheckoutItems } =
    useCheckout();
  const { createOrder } = useOrder();
  const { user } = useAuth();
  const { trackCheckout } = useActivity();
  const [submitting, setSubmitting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [totalItemLimit, setMaxItemsPerOrder] = useState(null);
  const [limitsLoaded, setLimitsLoaded] = useState(false);
  const [blockedDueToVoid, setBlockedDueToVoid] = useState(false);
  const [maxQuantities, setMaxQuantities] = useState({});
  const [claimedItems, setClaimedItems] = useState({});
  const [alreadyOrdered, setAlreadyOrdered] = useState({});
  const [slotsUsedFromPlacedOrders, setSlotsUsedFromPlacedOrders] = useState(0);

  useEffect(() => {
    const fetchMaxQuantities = async () => {
      if (!user) return;
      try {
        const res = await authAPI.getMaxQuantities();
        setMaxItemsPerOrder(res.data?.totalItemLimit ?? null);
        setBlockedDueToVoid(res.data?.blockedDueToVoid === true);
        setMaxQuantities(res.data?.maxQuantities ?? {});
        setClaimedItems(res.data?.claimedItems ?? {});
        setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
        setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? 0);
      } catch (err) {
        setMaxItemsPerOrder(null);
        setBlockedDueToVoid(err?.response?.data?.blockedDueToVoid === true);
        setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
        setClaimedItems(err?.response?.data?.claimedItems ?? {});
        setAlreadyOrdered(err?.response?.data?.alreadyOrdered ?? {});
        setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? 0);
      } finally {
        setLimitsLoaded(true);
      }
    };
    fetchMaxQuantities();
  }, [user]);

  const limitNotSet =
    user &&
    limitsLoaded &&
    (totalItemLimit == null || totalItemLimit === undefined || Number(totalItemLimit) <= 0);

  // Determine which items to display: direct checkout items or cart items
  const items = isDirectCheckout ? checkoutItems : cartItems;
  const loading = isDirectCheckout ? false : cartLoading;

  // Group items by variations
  const groupedItems = useMemo(() => {
    return groupCartItemsByVariations(items);
  }, [items]);

  // Pre-validate items to disable checkout button if there are violations
  const checkoutValidation = useMemo(() => {
    if (!limitsLoaded || !user || items.length === 0) {
      return { isValid: true, violations: [] }; // Don't block if data isn't loaded yet
    }

    const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";
    const getEffectiveMaxForItem = (key) => {
      if (isOldStudent) {
        if (maxQuantities[key] !== undefined && maxQuantities[key] !== null) {
          return maxQuantities[key];
        }
        return getDefaultMaxByKey(key);
      }
      return maxQuantities[key] ?? getDefaultMaxByKey(key);
    };

    // Group items by resolved key and check limits
    const itemsByKey = {};
    for (const item of items) {
      const name = item.inventory?.name || item.name || "Unknown Item";
      const key = resolveItemKeyForMaxQuantity(name);
      if (!key) continue;
      if (!itemsByKey[key]) {
        itemsByKey[key] = { items: [], totalQty: 0, displayName: name };
      }
      itemsByKey[key].items.push(item);
      itemsByKey[key].totalQty += Number(item.quantity) || 0;
    }

    // Check each item type for violations
    const violations = [];
    for (const [key, data] of Object.entries(itemsByKey)) {
      const max = getEffectiveMaxForItem(key);
      const claimedCount = claimedItems[key] || 0;
      const alreadyOrderedCount = alreadyOrdered[key] || 0;
      const totalQty = data.totalQty;
      
      // Debug logging for logo patch to track validation
      if (key === "logo patch") {
        console.log(`[CheckoutPage Pre-Validation] Logo Patch:`, {
          key,
          max,
          claimedCount,
          alreadyOrderedCount,
          totalQty,
          maxQuantitiesKey: maxQuantities[key],
          claimedItemsKey: claimedItems[key],
          isOldStudent,
          limitsLoaded,
        });
      }
      
      // FORCE DISABLE: Check if claimed count has reached or exceeded max
      if (claimedCount >= max && max > 0) {
        console.log(`[CheckoutPage Pre-Validation] Blocked: ${data.displayName} - claimed (${claimedCount}) >= max (${max})`);
        violations.push({
          itemName: data.displayName,
          reason: `You have already claimed ${claimedCount} of this item (maximum: ${max}). You cannot order more.`,
        });
        continue;
      }

      // Check if (claimed + new order) would exceed max
      const totalWithClaimed = claimedCount + totalQty;
      if (totalWithClaimed > max && max > 0) {
        console.log(`[CheckoutPage Pre-Validation] Blocked: ${data.displayName} - claimed (${claimedCount}) + order (${totalQty}) = ${totalWithClaimed} > max (${max})`);
        violations.push({
          itemName: data.displayName,
          reason: `You have already claimed ${claimedCount} of this item. Adding ${totalQty} would exceed the maximum (${max}) per student.`,
        });
        continue;
      }

      // Check if (already ordered + new order) would exceed max
      const totalAfterOrder = alreadyOrderedCount + totalQty;
      if (totalAfterOrder > max && max > 0) {
        violations.push({
          itemName: data.displayName,
          reason: `You have already ordered ${alreadyOrderedCount} of this item. Adding ${totalQty} would exceed the maximum (${max}) per student.`,
        });
      }
    }
    
    // Check item type (slot) limit
    if (totalItemLimit != null && Number(totalItemLimit) > 0) {
      // Calculate unique item types (slots) in current checkout
      const checkoutSlotKeys = new Set();
      for (const item of items) {
        const name = item.inventory?.name || item.name || "";
        const key = resolveItemKeyForMaxQuantity(name);
        if (key) checkoutSlotKeys.add(key);
      }
      const checkoutSlotCount = checkoutSlotKeys.size;
      const slotsLeft = Math.max(0, Number(totalItemLimit) - slotsUsedFromPlacedOrders);
      
      // Debug logging for slot limit validation
      console.log(`[CheckoutPage Slot Limit Validation]`, {
        totalItemLimit,
        slotsUsedFromPlacedOrders,
        checkoutSlotCount,
        slotsLeft,
        checkoutSlotKeys: Array.from(checkoutSlotKeys),
      });
      
      // Check if student has already reached their limit
      if (slotsUsedFromPlacedOrders >= Number(totalItemLimit)) {
        console.log(`[CheckoutPage Slot Limit] ❌ Blocked: Student has reached limit (${slotsUsedFromPlacedOrders} >= ${totalItemLimit})`);
        violations.push({
          itemName: "Item Type Limit",
          reason: `You have already reached your item type limit. You have used ${slotsUsedFromPlacedOrders} item type${slotsUsedFromPlacedOrders !== 1 ? "s" : ""} in placed orders, which exceeds your maximum of ${totalItemLimit}. You cannot place any more orders until some of your existing orders are completed or cancelled.`,
        });
      } else if (checkoutSlotCount > slotsLeft) {
        // Check if this order would exceed the remaining limit
        console.log(`[CheckoutPage Slot Limit] ❌ Blocked: Order exceeds remaining slots (${checkoutSlotCount} > ${slotsLeft})`);
        violations.push({
          itemName: "Item Type Limit",
          reason: `Order exceeds your item type limit. You have ${slotsLeft} item type${slotsLeft !== 1 ? "s" : ""} left for this order (max ${totalItemLimit} total; ${slotsUsedFromPlacedOrders} already used in placed orders). This order has ${checkoutSlotCount} different item type${checkoutSlotCount !== 1 ? "s" : ""}. Only placed orders count toward the limit—cart does not.`,
        });
      } else {
        console.log(`[CheckoutPage Slot Limit] ✅ Allowed: ${checkoutSlotCount} slots in order, ${slotsLeft} slots left`);
      }
    }
    
    // Debug logging for validation result
    if (violations.length > 0) {
      console.log(`[CheckoutPage Pre-Validation] Found ${violations.length} violation(s):`, violations);
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }, [items, limitsLoaded, user, maxQuantities, claimedItems, alreadyOrdered, totalItemLimit, slotsUsedFromPlacedOrders]);

  // Toggle group expansion
  const toggleGroup = (groupKey) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Handle checkout submission
  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Check validation before proceeding
    if (!limitsLoaded) {
      toast.error("Please wait while we check your order limits...");
      return;
    }

    if (!checkoutValidation.isValid) {
      // Show all validation errors
      const errorMessages = checkoutValidation.violations.map(v => `${v.itemName}: ${v.reason}`).join("\n");
      toast.error(errorMessages, { duration: 6000 });
      console.error("[CheckoutPage] Validation failed:", checkoutValidation.violations);
      return;
    }

    if (!user) {
      toast.error("Please log in to place an order");
      navigate("/login");
      return;
    }

    if (limitNotSet) {
      toast.error(
        "Your order limit has not been set. Please ask your administrator to set your Total Item Limit in System Admin before you can place orders."
      );
      return;
    }

    if (blockedDueToVoid) {
      toast.error("You cannot place new orders because a previous order was not claimed in time and was voided. Contact your administrator if you need assistance.");
      return;
    }

    // Wait for limits to be loaded before validating
    if (!limitsLoaded) {
      toast.error("Please wait while we check your order limits...");
      return;
    }

    // Validate items against max quantities and claimed items before submitting
    const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";
    const getEffectiveMaxForItem = (key) => {
      // For old students with manual permissions, use the permission max if it exists
      // Otherwise, use default max (for items like logo patch that are always allowed)
      if (isOldStudent) {
        // If maxQuantities[key] is explicitly set (even if 0), use it
        // If it's undefined/null, check if it's a default-allowed item (logo patch, number patch)
        if (maxQuantities[key] !== undefined && maxQuantities[key] !== null) {
          return maxQuantities[key];
        }
        // For old students, items not in maxQuantities are not allowed (return 0)
        // Except for logo patch and number patch which have default max
        return getDefaultMaxByKey(key);
      }
      // For new students, use maxQuantities or default
      return maxQuantities[key] ?? getDefaultMaxByKey(key);
    };

    // Group items by resolved key and check limits
    const itemsByKey = {};
    for (const item of items) {
      const name = item.inventory?.name || item.name || "Unknown Item";
      const key = resolveItemKeyForMaxQuantity(name);
      if (!key) continue;
      if (!itemsByKey[key]) {
        itemsByKey[key] = { items: [], totalQty: 0, displayName: name };
      }
      itemsByKey[key].items.push(item);
      itemsByKey[key].totalQty += Number(item.quantity) || 0;
    }

    // Check each item type for violations
    const violations = [];
    for (const [key, data] of Object.entries(itemsByKey)) {
      const max = getEffectiveMaxForItem(key);
      const claimedCount = claimedItems[key] || 0;
      const alreadyOrderedCount = alreadyOrdered[key] || 0;
      const totalQty = data.totalQty;
      
      // Debug logging for logo patch to track validation
      if (key === "logo patch") {
        console.log(`[CheckoutPage Validation] Logo Patch:`, {
          key,
          max,
          claimedCount,
          alreadyOrderedCount,
          totalQty,
          maxQuantitiesKey: maxQuantities[key],
          claimedItemsKey: claimedItems[key],
          isOldStudent,
        });
      }
      
      // FORCE DISABLE: Check if claimed count has reached or exceeded max
      // This is a hard requirement - no exceptions
      if (claimedCount >= max && max > 0) {
        console.log(`[CheckoutPage Validation] Blocked: ${data.displayName} - claimed (${claimedCount}) >= max (${max})`);
        violations.push({
          itemName: data.displayName,
          reason: `You have already claimed ${claimedCount} of this item (maximum: ${max}). You cannot order more.`,
        });
        continue; // Skip other checks - item is completely blocked
      }

      // Check if (claimed + new order) would exceed max (for items with lifetime limits like logo patch)
      // This catches cases where claimed < max but adding the new order would exceed it
      const totalWithClaimed = claimedCount + totalQty;
      if (totalWithClaimed > max && max > 0) {
        console.log(`[CheckoutPage Validation] Blocked: ${data.displayName} - claimed (${claimedCount}) + order (${totalQty}) = ${totalWithClaimed} > max (${max})`);
        violations.push({
          itemName: data.displayName,
          reason: `You have already claimed ${claimedCount} of this item. Adding ${totalQty} would exceed the maximum (${max}) per student.`,
        });
        continue; // Skip other checks - item is completely blocked
      }

      // Check if (already ordered + new order) would exceed max
      const totalAfterOrder = alreadyOrderedCount + totalQty;
      if (totalAfterOrder > max && max > 0) {
        violations.push({
          itemName: data.displayName,
          reason: `You have already ordered ${alreadyOrderedCount} of this item. Adding ${totalQty} would exceed the maximum (${max}) per student.`,
        });
      }
    }

    if (violations.length > 0) {
      const errorMessage = violations.map(v => `${v.itemName}: ${v.reason}`).join(" ");
      toast.error(errorMessage);
      return;
    }

    try {
      setSubmitting(true);

      // Get student education level from first item (assuming all items are for the same level)
      // Backend returns education_level (snake_case), but also check camelCase for compatibility
      const educationLevel = items[0]?.inventory?.education_level || items[0]?.inventory?.educationLevel || "General";

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)
        .toUpperCase()}`;

      // Check if any item is out of stock OR if selected size is not available
      // We need to check size-specific availability for uniform items
      // Default to "regular" order type - only mark as pre-order if explicitly out of stock
      console.log(`[CheckoutPage] 🛒 Starting stock check for ${items.length} item(s) from ${isDirectCheckout ? 'direct checkout' : 'cart'}`);
      console.log(`[CheckoutPage] 📋 Cart items structure:`, items.map((item, idx) => ({
        index: idx,
        id: item.id,
        size: item.size,
        quantity: item.quantity,
        inventoryId: item.inventoryId,
        productName: item.inventory?.name,
        educationLevel: item.inventory?.educationLevel,
        itemType: item.inventory?.item_type || item.inventory?.itemType,
        inventoryStock: item.inventory?.stock,
        inventoryStatus: item.inventory?.status,
      })));
      
      const sizeAvailabilityChecks = await Promise.all(
        items.map(async (item, itemIndex) => {
          const selectedSize = item.size;
          const productName = item.inventory?.name;
          // Backend returns education_level (snake_case), but also check camelCase for compatibility
          const productEducationLevel = item.inventory?.education_level || item.inventory?.educationLevel;
          
          console.log(
            `[CheckoutPage] 📦 Item ${itemIndex + 1}/${items.length}: ${productName} | Size: "${selectedSize}" | Education: ${productEducationLevel}`
          );

          // Check if this is a uniform item that requires size selection
          // Backend returns item_type (snake_case), but also check camelCase for compatibility
          const itemType = item.inventory?.item_type || item.inventory?.itemType;
          const category = item.inventory?.category;
          const requiresSize =
            itemType === "Uniform" ||
            itemType === "PE Uniform" ||
            itemType?.toLowerCase().includes("uniform") ||
            category?.toLowerCase().includes("uniform");

          if (!requiresSize || selectedSize === "N/A") {
            // For non-uniform items, check overall stock
            // Only mark as out of stock if stock is explicitly 0 and status confirms it
            const stock = item.inventory?.stock ?? 0;
            const status = item.inventory?.status;
            const isOutOfStock =
              stock === 0 &&
              (status === "Out of Stock" ||
                status === "out_of_stock" ||
                status?.toLowerCase() === "out of stock");
            return isOutOfStock;
          }

          // For uniform items, check if the specific size is available
          // Validate that we have both product name and education level
          if (!productName) {
            console.error(
              `[CheckoutPage] ❌ Missing product name for item ${itemIndex + 1}`
            );
            return true; // Default to pre-order when data is incomplete
          }
          
          if (!productEducationLevel) {
            console.error(
              `[CheckoutPage] ❌ Missing education level for item ${itemIndex + 1} (${productName}). Cart item structure:`,
              item
            );
            // Try to get education level from the item's inventory data with different property names
            const fallbackEducationLevel = 
              item.inventory?.education_level || 
              item.inventory?.educationLevel ||
              item.education_level ||
              item.educationLevel ||
              "General";
            
            console.warn(
              `[CheckoutPage] ⚠️ Using fallback education level: "${fallbackEducationLevel}"`
            );
            
            // If we still don't have it, default to pre-order for safety
            if (fallbackEducationLevel === "General" && productName) {
              console.warn(
                `[CheckoutPage] ⚠️ Education level is "General" - this might cause incorrect stock checks. Item should have specific education level.`
              );
            }
          }
          
          try {
            const response = await itemsAPI.getAvailableSizes(
              productName,
              productEducationLevel || item.inventory?.education_level || item.inventory?.educationLevel || "General"
            );

            console.log(
              `[CheckoutPage] 🔍 Checking availability for: ${productName} | Size: "${selectedSize}" | Education: ${productEducationLevel}`
            );
            console.log(
              `[CheckoutPage] API response:`,
              {
                success: response.data?.success,
                dataLength: response.data?.data?.length,
                sizes: response.data?.data?.map((s) => ({
                  size: s.size,
                  stock: s.stock,
                  status: s.status,
                })),
              }
            );

            if (response.data.success && response.data.data) {
              // Improve size matching: case-insensitive, trim whitespace, remove parentheses
              const normalizeSizeForComparison = (sizeStr) => {
                if (!sizeStr) return "";
                return sizeStr
                  .trim()
                  .toLowerCase()
                  .replace(/\s*\([^)]*\)\s*/g, "") // Remove parentheses and content
                  .trim();
              };

              const normalizedSelectedSize = normalizeSizeForComparison(selectedSize);
              
              console.log(
                `[CheckoutPage] 🔎 Looking for size "${selectedSize}" (normalized: "${normalizedSelectedSize}")`
              );
              console.log(
                `[CheckoutPage] 📋 Available sizes from API (normalized):`,
                response.data.data.map((s) => ({
                  original: s.size,
                  normalized: normalizeSizeForComparison(s.size),
                  stock: s.stock,
                }))
              );

              const sizeData = response.data.data.find((s) => {
                const normalizedSize = normalizeSizeForComparison(s.size);
                // Exact match only - don't use includes() as it causes false matches
                // (e.g., "Small" would incorrectly match "XSmall")
                const matches = normalizedSize === normalizedSelectedSize;
                if (matches) {
                  console.log(
                    `[CheckoutPage] ✅ MATCH FOUND: "${s.size}" (normalized: "${normalizedSize}") matches "${selectedSize}" (normalized: "${normalizedSelectedSize}")`
                  );
                  console.log(
                    `[CheckoutPage] 📊 Stock details: stock=${s.stock}, status="${s.status}"`
                  );
                }
                return matches;
              });

              // Only mark as pre-order if size doesn't exist OR explicitly has stock = 0 or less
              // If size exists and stock > 0, it's available (return false = in stock)
              if (!sizeData) {
                console.log(
                  `[CheckoutPage] ❌ Size "${selectedSize}" NOT FOUND in API response for ${productName}`
                );
                console.log(
                  `[CheckoutPage] Available sizes from API:`,
                  response.data.data.map((s) => `${s.size} (stock: ${s.stock})`)
                );
                
                // IMPORTANT: If specific size is not found in API response, it means that size doesn't exist
                // or is not available. We should default to pre-order, NOT check total item stock
                // because total stock might include other sizes (e.g., Small has stock but Large doesn't)
                console.log(
                  `[CheckoutPage] 🚨 DECISION: Size "${selectedSize}" not found → PRE-ORDER (size-specific stock unavailable)`
                );
                return true; // Out of stock - size not found means it's not available
              }

              // Size was found - check its stock
              const isOutOfStock = sizeData.stock === 0 || sizeData.stock < 0;
              
              console.log(
                `[CheckoutPage] 📦 Size "${selectedSize}" FOUND with stock: ${sizeData.stock}, status: "${sizeData.status}"`
              );
              
              if (isOutOfStock) {
                console.log(
                  `[CheckoutPage] 🚨 DECISION: Size "${selectedSize}" for ${productName} has stock ${sizeData.stock} → PRE-ORDER`
                );
              } else {
                console.log(
                  `[CheckoutPage] ✅ DECISION: Size "${selectedSize}" for ${productName} has stock ${sizeData.stock} → REGULAR ORDER`
                );
              }
              
              return isOutOfStock;
            }

            // If API response structure is unexpected, we can't verify size-specific stock
            // Default to pre-order to be safe (can't verify = assume not available)
            console.warn(
              `[CheckoutPage] ⚠️ Unexpected API response structure for ${productName} (${selectedSize}) - cannot verify size-specific stock`
            );
            console.warn(
              `[CheckoutPage] ⚠️ Defaulting to pre-order for safety (cannot verify "${selectedSize}" availability)`
            );
            return true; // Default to pre-order when we can't verify
          } catch (error) {
            console.error(
              `[CheckoutPage] ❌ Failed to check size availability for ${productName} (${selectedSize}):`,
              error
            );
            
            // On API error, we can't verify size-specific stock
            // Default to pre-order to be safe (can't verify = assume not available)
            console.warn(
              `[CheckoutPage] ⚠️ API error - cannot verify "${selectedSize}" stock - defaulting to pre-order for safety`
            );
            return true; // Default to pre-order when we can't verify (safer than creating false regular orders)
          }
        })
      );

      // Split items into available and unavailable groups
      const availableItems = [];
      const unavailableItems = [];

      items.forEach((item, index) => {
        const isOutOfStock = sizeAvailabilityChecks[index];
        const selectedSize = item.size;
        const productName = item.inventory?.name;
        
        if (isOutOfStock) {
          unavailableItems.push(item); // Out of stock - pre-order
          console.log(
            `[CheckoutPage] 📦 Item "${productName}" size "${selectedSize}" → PRE-ORDER (out of stock)`
          );
        } else {
          availableItems.push(item); // In stock - regular order
          console.log(
            `[CheckoutPage] ✅ Item "${productName}" size "${selectedSize}" → REGULAR ORDER (in stock)`
          );
        }
      });

      // Log for debugging
      console.log(`[CheckoutPage] Item availability split:`, {
        totalItems: items.length,
        availableItems: availableItems.length,
        unavailableItems: unavailableItems.length,
        sizeAvailabilityChecks,
        availableItemsDetails: availableItems.map((i) => ({
          name: i.inventory?.name,
          size: i.size,
        })),
        unavailableItemsDetails: unavailableItems.map((i) => ({
          name: i.inventory?.name,
          size: i.size,
        })),
      });

      // Prepare orders to create
      const ordersToCreate = [];

      // Add regular order for available items
      if (availableItems.length > 0) {
        const regularOrderItems = availableItems.map((item) => {
          const invPrice = item.inventory?.price ?? item.price;
          const productPrice = Number(invPrice) || 0;
          return {
            name: item.inventory?.name || "Unknown Item",
            size: item.size || "N/A",
            quantity: item.quantity || 1,
            price: productPrice,
            item_type: item.inventory?.item_type || item.inventory?.itemType || "Uniform",
            education_level: item.inventory?.education_level || item.inventory?.educationLevel || "General",
            image: item.inventory?.image || null,
          };
        });

        const regularOrderNumber = `ORD-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)
          .toUpperCase()}`;

        const regularOrderData = {
          order_number: regularOrderNumber,
          student_id: user.uid,
          student_name: user.displayName || user.email,
          student_email: user.email,
          education_level: educationLevel,
          items: regularOrderItems,
          total_amount: 0,
          status: "pending",
          order_type: "regular",
          notes: `Order placed via ${isDirectCheckout ? "direct" : "cart"} checkout. ${availableItems.length} item(s) ordered.`,
        };

        // Generate QR code for regular order
        regularOrderData.qr_code_data = generateOrderReceiptQRData({
          orderNumber: regularOrderData.order_number,
          studentId: regularOrderData.student_id,
          studentName: regularOrderData.student_name,
          studentEmail: regularOrderData.student_email,
          items: regularOrderData.items,
          educationLevel: regularOrderData.education_level,
          totalAmount: regularOrderData.total_amount,
          orderDate: new Date().toISOString(),
          status: regularOrderData.status,
        });

        ordersToCreate.push({
          data: regularOrderData,
          type: "regular",
          items: availableItems,
          orderItems: regularOrderItems,
        });
      }

      // Add pre-order for unavailable items
      if (unavailableItems.length > 0) {
        const preOrderItems = unavailableItems.map((item) => {
          const invPrice = item.inventory?.price ?? item.price;
          const productPrice = Number(invPrice) || 0;
          return {
            name: item.inventory?.name || "Unknown Item",
            size: item.size || "N/A",
            quantity: item.quantity || 1,
            price: productPrice,
            item_type: item.inventory?.item_type || item.inventory?.itemType || "Uniform",
            education_level: item.inventory?.education_level || item.inventory?.educationLevel || "General",
            image: item.inventory?.image || null,
          };
        });

        // Generate unique order number for pre-order (add small delay to ensure uniqueness)
        const preOrderNumber = `ORD-${Date.now() + 1}-${Math.random()
          .toString(36)
          .substring(2, 9)
          .toUpperCase()}`;

        const preOrderData = {
          order_number: preOrderNumber,
          student_id: user.uid,
          student_name: user.displayName || user.email,
          student_email: user.email,
          education_level: educationLevel,
          items: preOrderItems,
          total_amount: 0,
          status: "pending",
          order_type: "pre-order",
          notes: `Pre-order placed via ${isDirectCheckout ? "direct" : "cart"} checkout. ${unavailableItems.length} item(s) ordered.`,
        };

        // Generate QR code for pre-order
        preOrderData.qr_code_data = generateOrderReceiptQRData({
          orderNumber: preOrderData.order_number,
          studentId: preOrderData.student_id,
          studentName: preOrderData.student_name,
          studentEmail: preOrderData.student_email,
          items: preOrderData.items,
          educationLevel: preOrderData.education_level,
          totalAmount: preOrderData.total_amount,
          orderDate: new Date().toISOString(),
          status: preOrderData.status,
        });

        ordersToCreate.push({
          data: preOrderData,
          type: "pre-order",
          items: unavailableItems,
          orderItems: preOrderItems,
        });
      }

      // Handle direct checkout with orderIntent override
      // If direct checkout and orderIntent is set, respect it for single-item orders
      if (isDirectCheckout && orderIntent && items.length === 1) {
        // For single-item direct checkout, use the button intent
        if (orderIntent === "preOrder") {
          // If user clicked "Pre-Order" button, mark as pre-order regardless of stock
          if (ordersToCreate.length > 0) {
            ordersToCreate[0].data.order_type = "pre-order";
            ordersToCreate[0].data.notes = `Pre-order placed via direct checkout. 1 item(s) ordered.`;
          }
        }
      }

      // Create orders sequentially with error handling
      const createdOrders = [];
      const failedOrders = [];

      for (const orderConfig of ordersToCreate) {
        try {
          console.log(
            `[CheckoutPage] Creating ${orderConfig.type} order with ${orderConfig.items.length} item(s)...`
          );
          const createdOrder = await createOrder(orderConfig.data);

          createdOrders.push({
            order: createdOrder,
            type: orderConfig.type,
            orderNumber: orderConfig.data.order_number,
          });

          // Track checkout activity for each order
          trackCheckout({
            orderId: createdOrder?.id,
            orderNumber: orderConfig.data.order_number,
            itemCount: orderConfig.items.length,
            items: orderConfig.orderItems,
          });

          console.log(
            `[CheckoutPage] ✅ ${orderConfig.type} order created successfully: ${orderConfig.data.order_number}`
          );
        } catch (error) {
          console.error(
            `[CheckoutPage] ❌ Failed to create ${orderConfig.type} order:`,
            error
          );
          failedOrders.push({
            type: orderConfig.type,
            orderNumber: orderConfig.data.order_number,
            error: error.response?.data?.message || error.message,
          });
        }
      }

      // Handle results
      if (createdOrders.length === 0) {
        // All orders failed
        throw new Error(
          failedOrders.length > 0
            ? `Failed to create orders: ${failedOrders.map((f) => f.error).join(", ")}`
            : "Failed to create orders. Please try again."
        );
      }

      // Clear cart/checkout items only after successful order creation
      // Only clear if at least one order was created successfully
      if (createdOrders.length > 0) {
        if (isDirectCheckout) {
          clearCheckoutItems();
        } else {
          // Clear cart without showing toast
          await clearCart({ suppressToast: true });
        }
        
        // Signal that limits (maxQuantities / alreadyOrdered) must be refetched so
        // Add to Cart / Order stay disabled for items already in My Orders
        window.dispatchEvent(new CustomEvent("order-created"));
        try {
          sessionStorage.setItem("limitsNeedRefresh", "1");
        } catch (_) {}
      }

      // Show appropriate success message
      if (createdOrders.length === 1) {
        toast.success("Order submitted successfully!");
      } else {
        toast.success(
          `${createdOrders.length} orders created successfully! ${
            failedOrders.length > 0
              ? `(${failedOrders.length} failed)`
              : ""
          }`
        );
      }

      // Show warning if some orders failed
      if (failedOrders.length > 0) {
        toast.error(
          `Some orders failed to create. Please check your orders page.`,
          { duration: 5000 }
        );
      }

      // Navigate to Order Success page; pass first order id for 10-second claim confirmation
      const firstOrder = createdOrders[0];
      navigate("/student/order-success", {
        state: firstOrder?.order?.id
          ? { orderId: firstOrder.order.id, orderNumber: firstOrder.orderNumber || firstOrder.order?.order_number }
          : undefined,
      });
    } catch (error) {
      console.error("Checkout error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error details:", error.response);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to submit order. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section – "Checkout" at bottom center (like All Products) */}
      <HeroSection heading="Checkout" align="bottom-center" />

      {/* Main Content – close to hero, slightly lower */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-20">
        {/* Main Card Container */}
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-gray-800 shadow-md overflow-hidden">
          {/* Header Section – back button + cart items */}
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Back button – circular, inside card */}
            <div className="mb-4 sm:mb-6 flex justify-start">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-[#003363] text-[#003363] shadow-md hover:bg-gray-50 hover:border-[#002347] hover:text-[#002347] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            {/* Cart Items List */}
            <div className="space-y-3 sm:space-y-4 mb-6">
              {groupedItems.map((group) => {
                const isExpanded = expandedGroups.has(group.groupKey);
                const hasMultipleVariations = group.variations.length > 1;

                return (
                  <div key={group.groupKey} className="space-y-2">
                    {/* Main Group Card */}
                    <div
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-colors ${
                        hasMultipleVariations && isExpanded
                          ? "bg-orange-50 border-2 border-[#F28C28]"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {/* Quantity Badge */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center border-2 border-[#003363] font-bold text-[#003363] text-xs sm:text-sm">
                          {group.totalQuantity}PC
                        </div>
                      </div>

                      {/* Product Image */}
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
                        <img
                          src={
                            group.image || "/images/products/placeholder.jpg"
                          }
                          alt={group.name || "Product"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src =
                              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-grow min-w-0">
                        <p className="text-xs text-gray-500 mb-1">
                          {hasMultipleVariations
                            ? `${group.variations.length} Size${
                                group.variations.length > 1 ? "s" : ""
                              }`
                            : `${group.variations[0]?.size || "N/A"} Size`}
                        </p>
                        <h3 className="font-bold text-[#003363] text-sm sm:text-base leading-tight break-words">
                          {group.name}
                        </h3>
                        <p className="text-xs text-[#F28C28] font-semibold mt-1">
                          ({group.educationLevel})
                        </p>
                        {hasMultipleVariations && (
                          <button
                            onClick={() => toggleGroup(group.groupKey)}
                            className="mt-2 text-xs text-[#F28C28] hover:text-[#d97a1f] font-medium"
                          >
                            {isExpanded
                              ? "Hide variations"
                              : `Show ${group.variations.length} size${
                                  group.variations.length > 1 ? "s" : ""
                                }`}
                          </button>
                        )}
                      </div>

                      {/* Price and FREE Badge */}
                      <div className="flex-shrink-0">
                        {(() => {
                          // Calculate total price for the group
                          const groupTotal = group.variations.reduce((sum, variation) => {
                            const itemPrice = variation.inventory?.price ?? variation.price ?? 0;
                            const displayPrice = getDisplayPriceForFreeItem(group.name, itemPrice);
                            return sum + (displayPrice * (variation.quantity || 1));
                          }, 0);
                          
                           return (
                             <div className="flex flex-col items-end">
                               {groupTotal > 0 && (
                                 <span className="line-through text-gray-500 font-semibold text-xs sm:text-sm mb-0.5 text-right block w-full">
                                   ₱{groupTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                 </span>
                               )}
                               <span className={`inline-block px-2.5 py-1 sm:px-4 sm:py-1.5 bg-[#F28C28] text-white font-bold text-base sm:text-lg md:text-xl rounded-full ${groupTotal > 0 ? "mt-0.5" : ""}`}>
                                 FREE
                               </span>
                             </div>
                           );
                        })()}
                      </div>
                    </div>

                    {/* Variations List (when expanded) */}
                    {isExpanded &&
                      hasMultipleVariations &&
                      group.variations.map((variation) => (
                        <div
                          key={variation.id}
                          className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 ml-12 sm:ml-16 bg-orange-50 border-2 border-[#F28C28] rounded-lg sm:rounded-xl"
                        >
                          {/* Quantity Badge */}
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center border-2 border-[#F28C28] font-bold text-[#F28C28] text-xs">
                              {variation.quantity}PC
                            </div>
                          </div>

                          {/* Variation Details */}
                          <div className="flex-grow min-w-0">
                            <p className="text-xs text-gray-600 mb-1">
                              {variation.size || "N/A"} Size
                            </p>
                            <h4 className="font-semibold text-[#003363] text-xs sm:text-sm break-words">
                              {group.name} {variation.size}
                            </h4>
                          </div>

                          {/* Price and FREE Badge */}
                          <div className="flex-shrink-0">
                            {(() => {
                              const itemPrice = variation.inventory?.price ?? variation.price ?? 0;
                              const displayPrice = getDisplayPriceForFreeItem(group.name, itemPrice);
                              const variationTotal = displayPrice * (variation.quantity || 1);
                              
                               return (
                                 <div className="flex flex-col items-end">
                                   {variationTotal > 0 && (
                                     <span className="line-through text-gray-500 font-semibold text-[10px] sm:text-xs mb-0.5 text-right block w-full">
                                       ₱{variationTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                                     </span>
                                   )}
                                   <span className={`inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-[#F28C28] text-white font-bold text-sm sm:text-base md:text-lg rounded-full ${variationTotal > 0 ? "mt-0.5" : ""}`}>
                                     FREE
                                   </span>
                                 </div>
                               );
                            })()}
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order limit not set: student cannot place order until admin sets Total Item Limit. */}
          {items.length > 0 && limitNotSet && (
            <div className="px-4 sm:px-6 lg:px-8 pb-2">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">
                  Your order limit has not been set. Please ask your administrator to set your Total Item Limit in System Admin before you can place orders.
                </p>
              </div>
            </div>
          )}
          {items.length > 0 && blockedDueToVoid && (
            <div className="px-4 sm:px-6 lg:px-8 pb-2">
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                <p className="font-medium">
                  You cannot place new orders because a previous order was not claimed in time and was voided. Contact your administrator if you need assistance.
                </p>
              </div>
            </div>
          )}
          {/* Checkout Button - Fixed at Bottom */}
          {items.length > 0 && (
            <div className="p-4 sm:p-6 lg:p-8 pt-0">
              <button
                onClick={handleCheckout}
                disabled={loading || submitting || limitNotSet || blockedDueToVoid || !checkoutValidation.isValid || !limitsLoaded}
                title={
                  limitNotSet 
                    ? "Your order limit has not been set. Please ask your administrator to set your Total Item Limit in System Admin before you can place orders." 
                    : blockedDueToVoid 
                    ? "You cannot place new orders because a previous order was not claimed in time and was voided."
                    : !limitsLoaded
                    ? "Please wait while we check your order limits..."
                    : !checkoutValidation.isValid
                    ? checkoutValidation.violations.map(v => `${v.itemName}: ${v.reason}`).join(" ")
                    : undefined
                }
                className="w-full py-3 sm:py-4 bg-[#F28C28] text-white font-bold text-base sm:text-lg rounded-full hover:bg-[#d97a1f] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Submitting Order..."
                  : loading
                  ? "Processing..."
                  : "Checkout"}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CheckoutPage;
