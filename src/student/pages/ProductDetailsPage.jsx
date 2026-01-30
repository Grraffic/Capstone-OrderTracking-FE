import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, ShoppingCart, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "../components/common/Navbar";
import ProductImageViewer from "../components/Products/ProductDetails/ProductImageViewer";
import ProductInfo from "../components/Products/ProductDetails/ProductInfo";
import SizeSelector from "../components/Products/ProductDetails/SizeSelector";
import ProductCarousel from "../components/Products/ProductDetails/ProductCarousel";
import { useItems } from "../../property-custodian/hooks/items/useItems";
import { useCart } from "../../context/CartContext";
import { useCheckout } from "../../context/CheckoutContext";
import { useAuth } from "../../context/AuthContext";
import { itemsAPI, authAPI } from "../../services/api";
import { normalizeItemName, resolveItemKeyForMaxQuantity, getDefaultMaxForItem } from "../../utils/maxQuantityKeys";

/**
 * ProductDetailsPage Component
 *
 * Dedicated page for displaying detailed product information
 * Replaces the modal approach with a full-page view
 */
const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { items: allProducts, fetchItems } = useItems();
  const { addToCart, items: cartItems } = useCart();
  const { setDirectCheckoutItems } = useCheckout();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sizeConfirmed, setSizeConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableSizesData, setAvailableSizesData] = useState([]);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [userEducationLevel, setUserEducationLevel] = useState(null);
  const [maxQuantities, setMaxQuantities] = useState({});
  const [alreadyOrdered, setAlreadyOrdered] = useState({});
  const [totalItemLimit, setMaxItemsPerOrder] = useState(null);
  const [slotsUsedFromPlacedOrders, setSlotsUsedFromPlacedOrders] = useState(0);
  const [maxQuantitiesProfileIncomplete, setMaxQuantitiesProfileIncomplete] = useState(false);
  const [limitsLoaded, setLimitsLoaded] = useState(false);
  const [limitsRefreshTrigger, setLimitsRefreshTrigger] = useState(0);
  const [blockedDueToVoid, setBlockedDueToVoid] = useState(false);

  // Track previous product ID so we only reset size/quantity when navigating to a different product
  const prevProductIdRef = useRef(null);

  // Size mapping: Maps customer-facing sizes to database sizes
  const sizeMapping = {
    XS: "XSmall",
    S: "Small",
    M: "Medium",
    L: "Large",
    XL: "XLarge",
    XXL: "2XLarge",
    "3XL": "3XLarge",
  };

  // Reverse mapping: Database sizes to customer-facing sizes
  const reverseSizeMapping = Object.fromEntries(
    Object.entries(sizeMapping).map(([key, value]) => [value, key])
  );

  // Fetch user education level and max-quantities (for students)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const response = await authAPI.getProfile();
          const userData = response.data;
          setUserEducationLevel(userData.educationLevel || null);
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }
    };
    fetchUserProfile();
  }, [user]);

  // Fetch items filtered by eligibility (system-admin "checked" per education level)
  // so "Other Products" only shows items checked for this user's level in item_eligibility
  useEffect(() => {
    if (!fetchItems) return;
    const eligibilityLevel =
      userEducationLevel === "Vocational" ? "College" : userEducationLevel;
    if (eligibilityLevel) {
      fetchItems(eligibilityLevel);
    } else {
      fetchItems();
    }
  }, [userEducationLevel, fetchItems]);

  // Refetch limits when an order was just created (e.g. after checkout) or when tab regains focus.
  // When visible and logged in, always refetch so "already ordered" is up to date (e.g. checkout in another tab).
  // On pageshow persisted (bfcache): page was restored via Back button; refetch so item stays disabled.
  useEffect(() => {
    const onOrderCreated = () => setLimitsRefreshTrigger((t) => t + 1);
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      try {
        if (sessionStorage.getItem("limitsNeedRefresh")) setLimitsRefreshTrigger((t) => t + 1);
      } catch (_) {}
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

  // On mount / when user is set: refetch limits so "already ordered" disables Add/Order (e.g. after checkout)
  useEffect(() => {
    try {
      if (sessionStorage.getItem("limitsNeedRefresh")) setLimitsRefreshTrigger((t) => t + 1);
    } catch (_) {}
    // Refetch limits when we land on product details as a logged-in user,
    // so after checkout the same item stays disabled (like when it was in cart).
    if (user) setLimitsRefreshTrigger((t) => t + 1);
  }, [user]);

  // When we navigate to this product page (e.g. back from order-success), refetch limits so "already ordered" is up to date
  useEffect(() => {
    if (user && productId && /\/products\//.test(location.pathname)) {
      setLimitsRefreshTrigger((t) => t + 1);
    }
  }, [location.pathname, user, productId]);

  // Fetch max-quantities per item for students (used to cap quantity selector)
  // Disable Add to Cart / Order until we know alreadyOrdered, so we don't allow duplicates
  useEffect(() => {
    const fetchMaxQuantities = async () => {
      if (!user) {
        setMaxQuantitiesProfileIncomplete(false);
        setLimitsLoaded(true);
        return;
      }
      setLimitsLoaded(false);
      try {
        const res = await authAPI.getMaxQuantities();
        setMaxQuantities(res.data?.maxQuantities ?? {});
        setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
        setMaxItemsPerOrder(res.data?.totalItemLimit ?? null);
        setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? Object.keys(res.data?.alreadyOrdered ?? {}).length);
        setMaxQuantitiesProfileIncomplete(res.data?.profileIncomplete === true);
        setBlockedDueToVoid(res.data?.blockedDueToVoid === true);
        setLimitsLoaded(true);
        try {
          sessionStorage.removeItem("limitsNeedRefresh");
        } catch (_) {}
      } catch (err) {
        if (err?.response?.status === 400) {
          setMaxQuantitiesProfileIncomplete(true);
          setAlreadyOrdered(err?.response?.data?.alreadyOrdered ?? {});
          setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
          setMaxItemsPerOrder(err?.response?.data?.totalItemLimit ?? null);
          setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? Object.keys(err?.response?.data?.alreadyOrdered ?? {}).length);
          setBlockedDueToVoid(err?.response?.data?.blockedDueToVoid === true);
        } else if (err?.response?.status !== 403) {
          console.error("Error fetching max quantities:", err);
          setMaxQuantitiesProfileIncomplete(false);
          setAlreadyOrdered({});
          setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
          setMaxItemsPerOrder(err?.response?.data?.totalItemLimit ?? null);
          setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? Object.keys(err?.response?.data?.alreadyOrdered ?? {}).length);
        } else {
          setMaxQuantitiesProfileIncomplete(false);
          setAlreadyOrdered({});
          setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
          setMaxItemsPerOrder(err?.response?.data?.totalItemLimit ?? null);
          setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? 0);
        }
        setLimitsLoaded(true);
      }
    };
    fetchMaxQuantities();
  }, [user, limitsRefreshTrigger]);

  // Load product data
  useEffect(() => {
    if (allProducts && allProducts.length > 0 && productId) {
      console.log("Looking for product with ID:", productId);
      console.log("Available products:", allProducts.length);

      const foundProduct = allProducts.find((p) => p.id === productId);

      if (foundProduct) {
        // Check if product matches user's education level
        const productEducationLevel = foundProduct.educationLevel;
        
        // Allow access if:
        // 1. Product is "General" or has no education level
        // 2. Product is "All Education Levels" (e.g. Logo Patch, ID Lace) – available to everyone
        // 3. User has no education level set (show all)
        // 4. Product matches user's education level
        // 5. User has "Vocational" (ACT) and product is "College" – ACT is part of College
        const isAccessible =
          !productEducationLevel ||
          productEducationLevel === "General" ||
          productEducationLevel === "All Education Levels" ||
          !userEducationLevel ||
          productEducationLevel === userEducationLevel ||
          (userEducationLevel === "Vocational" && productEducationLevel === "College");

        if (!isAccessible) {
          console.log(
            "Product education level doesn't match user's level, redirecting"
          );
          toast.error(
            "This product is not available for your education level."
          );
          navigate("/all-products");
          return;
        }

        console.log("Product found:", foundProduct.name);
        // Only reset size/quantity and scroll to top when navigating to a different product (not when allProducts refetches)
        const productChanged = prevProductIdRef.current !== productId;
        prevProductIdRef.current = productId;

        if (productChanged) {
          window.scrollTo(0, 0);
        }

        // Ensure forGender is included in product data
        const productWithGender = {
          ...foundProduct,
          forGender: foundProduct.forGender || foundProduct.for_gender || "Unisex",
          for_gender: foundProduct.for_gender || foundProduct.forGender || "Unisex",
        };
        setProduct(productWithGender);
        if (productChanged) {
          setSelectedSize("");
          setQuantity(1);
          setSizeConfirmed(false);
        }
        // Refetch limits when viewing this product so "already ordered" is up to date (avoids enabling Add/Order when they have it in My Orders)
        setLimitsRefreshTrigger((t) => t + 1);
      } else {
        prevProductIdRef.current = null;
        console.log("Product not found, redirecting to all products");
        // Product not found, redirect to all products
        navigate("/all-products");
      }
    }
  }, [productId, allProducts, navigate, userEducationLevel]);

  // Stable keys so we only refetch sizes when product identity changes, not when product object reference changes
  const productIdForSizes = product?.id;
  const productNameForSizes = product?.name;
  const productEducationLevelForSizes = product?.educationLevel;

  // Fetch available sizes when product is loaded (depend on stable keys to avoid reload on allProducts refetch)
  useEffect(() => {
    const fetchAvailableSizes = async () => {
      if (!product || !productIdForSizes) return;

      // Check if product requires size selection
      const requiresSize =
        product.itemType === "Uniform" ||
        product.itemType === "PE Uniform" ||
        product.itemType?.toLowerCase().includes("uniform") ||
        product.category?.toLowerCase().includes("uniform") ||
        product.name?.toLowerCase().includes("jersey") ||
        product.name?.toLowerCase().includes("shirt") ||
        product.name?.toLowerCase().includes("polo") ||
        product.itemType?.toLowerCase().includes("jersey");

      if (!requiresSize) {
        setAvailableSizesData([]);
        return;
      }

      try {
        setLoadingSizes(true);
        const response = await itemsAPI.getAvailableSizes(
          product.name,
          product.educationLevel
        );

        if (response.data.success && response.data.data) {
          // Normalize and transform database sizes
          const transformedSizes = response.data.data.map((sizeData) => {
            const originalSize = sizeData.size;
            const lower = originalSize.toLowerCase().trim();

            let standardizedSize = originalSize;

            // PRIORITIZE XS / XSmall checks first to prevent them appearing as Small
            // Also check for XXLarge/3XLarge before Large

            if (
              lower.includes("xxl") ||
              lower.includes("2xl") ||
              (lower.includes("2") && lower.includes("large"))
            ) {
              standardizedSize = "XXL";
            } else if (
              lower.includes("3xl") ||
              (lower.includes("3") && lower.includes("large"))
            ) {
              standardizedSize = "3XL";
            } else if (
              lower.includes("xl") ||
              lower.includes("extra large") ||
              (lower.includes("extra") && lower.includes("large"))
            ) {
              standardizedSize = "XL";
            } else if (
              lower.includes("xs") ||
              lower.includes("xsmall") ||
              lower.includes("extra small") ||
              (lower.includes("extra") && lower.includes("small"))
            ) {
              standardizedSize = "XS";
            }
            // Now safe to check Small without catching XSmall, IF we explicitly exclude x/extra
            else if (
              lower === "s" ||
              lower === "small" ||
              (lower.includes("small") &&
                !lower.includes("x") &&
                !lower.includes("extra"))
            ) {
              standardizedSize = "S";
            } else if (lower === "m" || lower.includes("medium")) {
              standardizedSize = "M";
            } else if (
              lower === "l" ||
              lower === "large" ||
              (lower.includes("large") &&
                !lower.includes("x") &&
                !lower.includes("extra"))
            ) {
              standardizedSize = "L";
            }

            return {
              ...sizeData,
              dbSize: originalSize, // Keep original for DB operations
              size: standardizedSize, // Standardized for UI matching
            };
          });

          setAvailableSizesData(transformedSizes);
          console.log(
            "Available sizes fetched and transformed:",
            transformedSizes
          );
        }
      } catch (error) {
        console.error("Failed to fetch available sizes:", error);
        // Fallback to default sizes if API fails
        setAvailableSizesData([]);
      } finally {
        setLoadingSizes(false);
      }
    };

    fetchAvailableSizes();
  }, [productIdForSizes, productNameForSizes, productEducationLevelForSizes]);

  // Derive values and run clamp effect before any conditional return (Rules of Hooks)
  const requiresSizeSelection = product
    ? (product.itemType === "Uniform" ||
        product.itemType === "PE Uniform" ||
        product.itemType?.toLowerCase().includes("uniform") ||
        product.category?.toLowerCase().includes("uniform") ||
        product.name?.toLowerCase().includes("jersey") ||
        product.name?.toLowerCase().includes("shirt") ||
        product.name?.toLowerCase().includes("polo") ||
        product.itemType?.toLowerCase().includes("jersey"))
    : false;

  // Base sizes so students always see standard choices (some may be pre-order); append any extra sizes finance added (e.g. 3XL)
  const baseSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const apiSizes = (availableSizesData || []).map((s) => s.size);
  const extraSizes = apiSizes.filter((size) => !baseSizes.includes(size));
  const availableSizes =
    requiresSizeSelection ? [...baseSizes, ...extraSizes] : [];

  const selectedSizeData = availableSizesData.find(
    (s) => s.size === selectedSize
  );

  // Old students: only allowed items (new logo patch, number patch per level) have max > 0; others are disallowed.
  const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";

  // Resolve product name to the key used by GET /auth/max-quantities (e.g. "jogging pants" -> 1 for Kindergarten)
  const maxQuantityKey = product ? resolveItemKeyForMaxQuantity(product.name) : "";
  let resolvedMaxKey = maxQuantityKey;
  if (product && maxQuantities[maxQuantityKey] == null && Object.keys(maxQuantities).length > 0) {
    const norm = normalizeItemName(product.name);
    const matchingKeys = Object.keys(maxQuantities).filter((k) => norm.includes(k));
    resolvedMaxKey = matchingKeys.sort((a, b) => b.length - a.length)[0] ?? maxQuantityKey;
  }
  const keyNotInMaxQuantities = product && (maxQuantities[resolvedMaxKey] === undefined || maxQuantities[resolvedMaxKey] === null);
  const productEducationLevelRaw = (product?.educationLevel || product?.education_level || "").toString().trim().toLowerCase();
  const productIsForAllEducationLevels =
    productEducationLevelRaw === "all education levels" || productEducationLevelRaw === "general";
  const treatMainProductAllowedForOldStudent = productIsForAllEducationLevels;
  const maxForItem =
    product && maxQuantities[resolvedMaxKey] != null
      ? maxQuantities[resolvedMaxKey]
      : isOldStudent && keyNotInMaxQuantities && !treatMainProductAllowedForOldStudent
        ? 0
        : getDefaultMaxForItem(product?.name);
  const notAllowedForStudentType = isOldStudent && keyNotInMaxQuantities && !treatMainProductAllowedForOldStudent;
  const effectiveStock = product
    ? (requiresSizeSelection
        ? (selectedSizeData?.stock ?? product?.stock ?? 999)
        : (product?.stock ?? 999))
    : 999;
  const productResolvedKey = product ? resolveItemKeyForMaxQuantity(product.name) : "";
  const alreadyInCart = (cartItems || []).reduce(
    (sum, i) =>
      resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === productResolvedKey
        ? sum + (Number(i.quantity) || 0)
        : sum,
    0
  );
  // System-admin "total item limit" = distinct item types (slots). Each type counts as 1.
  const cartSlotKeys = useMemo(() => {
    const set = new Set();
    (cartItems || []).forEach((i) => {
      const k = resolveItemKeyForMaxQuantity(i.inventory?.name || i.name);
      if (k) set.add(k);
    });
    return set;
  }, [cartItems]);
  const cartSlotCount = cartSlotKeys.size;
  const isNewItemType = productResolvedKey && !cartSlotKeys.has(productResolvedKey);
  const slotsLeftForThisOrder =
    totalItemLimit != null && Number(totalItemLimit) > 0
      ? Math.max(0, Number(totalItemLimit) - (Number(slotsUsedFromPlacedOrders) || 0))
      : 0;
  const slotsFullForNewType =
    totalItemLimit != null &&
    Number(totalItemLimit) > 0 &&
    isNewItemType &&
    cartSlotCount >= slotsLeftForThisOrder;
  const limitNotSet =
    user &&
    limitsLoaded &&
    (totalItemLimit == null || totalItemLimit === undefined || Number(totalItemLimit) <= 0);
  // Use resolved key; if product name contains "jogging pants" also count alreadyOrdered["jogging pants"] to avoid duplication
  const baseAlready = product ? (Number(alreadyOrdered[productResolvedKey]) || 0) : 0;
  const joggingFallback =
    product && normalizeItemName(product.name || "").includes("jogging pants")
      ? (Number(alreadyOrdered["jogging pants"]) || 0)
      : 0;
  const alreadyOrderedForItem = Math.max(baseAlready, joggingFallback);
  const effectiveMax = product
    ? Math.min(
        Math.max(0, maxForItem - alreadyInCart - alreadyOrderedForItem),
        effectiveStock || 999
      )
    : getDefaultMaxForItem("");

  // Clamp quantity when effectiveMax decreases (e.g. after maxQuantities loads)
  useEffect(() => {
    if (product) {
      setQuantity((q) => Math.min(q, effectiveMax));
    }
  }, [product?.id, effectiveMax]);

  // Other products: eligibility-filtered; filter by gender; enrich with same disabled flags as All Products.
  // Must be above the early return so hooks run in the same order every render.
  const relatedProducts = useMemo(() => {
    const filtered = (allProducts || [])
      .filter((p) => p.id !== product?.id)
      .filter((p) => {
        if (!user?.gender) return true;
        const fg = (p.for_gender || p.forGender || "Unisex").toString().trim();
        return fg === "Unisex" || fg === user.gender;
      })
      .slice(0, 3);
    return filtered.map((p) => {
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
      const inCart = (cartItems || []).filter(
        (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
      ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      const effectiveMaxItem = Math.max(0, max - inCart - alreadyOrd);
      const isNewItemType = key && !cartSlotKeys.has(key);
      const slotsFullForNewTypeItem =
        totalItemLimit != null &&
        Number(totalItemLimit) > 0 &&
        isNewItemType &&
        cartSlotCount >= slotsLeftForThisOrder;
      const _orderLimitReached = effectiveMaxItem < 1;
      const _isDisabled = _orderLimitReached || blockedDueToVoid || slotsFullForNewTypeItem || notAllowedForStudentType;
      return {
        ...p,
        _orderLimitReached,
        _slotsFullForNewType: slotsFullForNewTypeItem,
        _notAllowedForStudentType: notAllowedForStudentType,
        _isDisabled,
      };
    });
  }, [
    allProducts,
    product?.id,
    user?.gender,
    maxQuantities,
    alreadyOrdered,
    cartItems,
    cartSlotKeys,
    cartSlotCount,
    totalItemLimit,
    slotsLeftForThisOrder,
    isOldStudent,
    blockedDueToVoid,
  ]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F28C28] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // These depend on product existing (used only after the return in JSX)
  const isSelectedSizeOutOfStock = selectedSizeData
    ? selectedSizeData.stock === 0
    : false;
  const isOutOfStock = requiresSizeSelection
    ? availableSizesData.length > 0 &&
      availableSizesData.every((s) => s.stock === 0)
    : product.stock === 0 ||
      product.status === "Out of Stock" ||
      product.status === "out_of_stock" ||
      product.status?.toLowerCase() === "out of stock";
  // Check if item is gender-specific and if user's gender matches
  const itemGender = product?.forGender || product?.for_gender || "Unisex";
  const isGenderSpecific = itemGender !== "Unisex";
  const userGender = user?.gender || null;
  const genderMismatch = isGenderSpecific && userGender && userGender !== itemGender;
  
  const isOrderDisabled =
    requiresSizeSelection && (!selectedSize || !sizeConfirmed) || genderMismatch;
  // Same disabled treatment as All Products card: grayscale image + gray text when item cannot be ordered
  const isDisabled =
    (!user || limitsLoaded) &&
    (effectiveMax < 1 ||
      blockedDueToVoid ||
      slotsFullForNewType ||
      limitNotSet ||
      notAllowedForStudentType ||
      genderMismatch);

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setSizeConfirmed(false);
  };

  const handleSizeConfirm = () => {
    setSizeConfirmed(true);
  };

  const handleQuantityChange = (newQuantity) => {
    const capped = Math.max(
      1,
      Math.min(newQuantity, effectiveMax, effectiveStock || 999)
    );
    setQuantity(capped);
  };

  const handleAddToCart = async () => {
    if (isOrderDisabled) return;
    const qtyToAdd = Math.min(quantity, Math.max(0, effectiveMax));
    if (qtyToAdd < 1) return;

    try {
      // Convert customer-facing size to database size
      // Use the actual DB size from the fetched data if available
      const dbSize =
        selectedSize && selectedSizeData
          ? selectedSizeData.dbSize
          : selectedSize
          ? sizeMapping[selectedSize] || selectedSize
          : "N/A";

      await addToCart({
        inventoryId: product.id,
        size: dbSize,
        quantity: qtyToAdd,
      });
      // Success toast is handled by CartContext
    } catch (error) {
      console.error("Failed to add to cart:", error);
      // Error toast is also handled by CartContext
    }
  };

  const handleOrderNow = async () => {
    if (isOrderDisabled) return;

    try {
      // Convert customer-facing size to database size
      // Use the actual DB size from the fetched data if available
      const dbSize =
        selectedSize && selectedSizeData
          ? selectedSizeData.dbSize
          : selectedSize
          ? sizeMapping[selectedSize] || selectedSize
          : "N/A";

      // Determine order intent based on button state
      // If button shows "Pre-Order", user clicked Pre-Order button
      // If button shows "Order Now", user clicked Order Now button
      let orderIntent = "orderNow"; // Default to Order Now

      if (requiresSizeSelection && selectedSize) {
        // For items with size selection, check if selected size is out of stock
        // If size data is missing (not found in DB) OR stock is <= 0, it is a pre-order
        if (!selectedSizeData || selectedSizeData.stock <= 0) {
          orderIntent = "preOrder";
        }
      } else if (isOutOfStock) {
        // For items without size selection, check overall stock
        orderIntent = "preOrder";
      }

      // Don't add to cart - go directly to checkout with this item only
      // Create a temporary checkout item (not added to cart)
      const checkoutItem = {
        inventory: product,
        size: dbSize,
        quantity: quantity,
        // Add temporary ID for display purposes
        id: `temp-${product.id}`,
      };

      // Set this as the direct checkout item with order intent
      setDirectCheckoutItems([checkoutItem], orderIntent);

      // Navigate to checkout page
      navigate("/student/checkout");
    } catch (error) {
      console.error("Failed to proceed to checkout:", error);
      toast.error("Failed to proceed to checkout");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && relatedProducts) {
      const foundProduct = relatedProducts.find((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (foundProduct) {
        navigate(`/products/${foundProduct.id}`);
        setSearchQuery("");
      }
    }
  };

  const handleProductSwitch = (newProduct) => {
    navigate(`/products/${newProduct.id}`);
  };

  const handleBackClick = () => {
    navigate("/all-products");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Background Hero Section */}
      <div className="pt-16">
        <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="/assets/image/LandingPage.png"
              alt="La Verdad Campus"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback gradient if image fails to load
                e.target.style.display = "none";
                e.target.parentElement.style.background =
                  "linear-gradient(135deg, #003363 0%, #0C2340 100%)";
              }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#003363]/40 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-8">
        {/* Product Detail Section with Gradient Border */}
        <div className="rounded-r-3xl shadow-2xl mb-8">
          <div className="bg-white rounded-r-3xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-0 h-auto md:h-[500px] lg:h-[700px]">
              {/* Left Column: Product Image; gray when disabled (same as ProductCard), gradient otherwise; no transition on bg to avoid blink */}
              <div
                className={`relative p-4 sm:p-6 md:p-8 h-[400px] sm:h-[450px] md:h-full flex items-center md:col-span-1 lg:col-span-2 overflow-hidden ${
                  isDisabled ? "bg-gray-100" : ""
                }`}
                style={
                  isDisabled
                    ? undefined
                    : {
                        background: `linear-gradient(
      to bottom,
      rgba(243, 243, 243, 1) 0%,
      rgba(249, 240, 227, 0.97) 11%,
      rgba(203, 123, 0, 0.7) 60%,
      rgba(1, 109, 211, 0.7) 100%
    )`,
                      }
                }
              >
                {/* Logo and Education Level Badge - Top Left Overlay (gray when disabled) */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 sm:gap-3">
                  <img
                    src="../../../assets/image/LV Logo.png"
                    alt="La Verdad Logo"
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg ${
                      isDisabled ? "opacity-70" : ""
                    }`}
                  />
                  <h2
                    className={`text-lg sm:text-xl font-bold ${
                      isDisabled ? "text-gray-500" : "text-[#003363]"
                    }`}
                  >
                    {product?.educationLevel?.toLowerCase().includes("college")
                      ? "Higher Education"
                      : "Basic Education"}
                  </h2>
                </div>

                {/* Background Education Level Text - At corners; hide when disabled (gray panel) */}
                {!isDisabled &&
                  product?.educationLevel &&
                  (() => {
                    const level = product.educationLevel.toLowerCase();
                    let textLines = [];
                    if (level.includes("senior") && level.includes("high")) {
                      textLines = ["Senior", "High School"];
                    } else if (level.includes("college")) {
                      // Display "Higher" and "Education" on two lines
                      textLines = ["Higher", "Education"];
                    } else if (level.includes("elementary")) {
                      // Always display "Elementary" and "School" on two lines
                      textLines = ["Elementary", "School"];
                    } else if (
                      level.includes("junior") &&
                      level.includes("high")
                    ) {
                      textLines = ["Junior", "High School"];
                    } else if (level.includes("kindergarten")) {
                      // Display "Kinder" and "garten" on two lines
                      textLines = ["Kinder", "garten"];
                    } else {
                      const words = product.educationLevel.split(" ");
                      if (words.length > 1) {
                        const mid = Math.ceil(words.length / 2);
                        textLines = [
                          words.slice(0, mid).join(" "),
                          words.slice(mid).join(" "),
                        ];
                      } else {
                        textLines = [product.educationLevel];
                      }
                    }

                    return textLines.length > 0 ? (
                      <>
                        {/* Left Corner - ELEMENTARY and SCHOOL stacked at bottom */}
                        <div className="absolute -left-2 sm:-left-4 md:-left-6 lg:-left-8 bottom-0 pointer-events-none z-0">
                          <div className="text-left">
                            {textLines.map((line, index) => (
                              <div
                                key={index}
                                className="text-8xl sm:text-9xl md:text-[10rem] lg:text-[11rem] xl:text-[12rem] 2xl:text-[14rem] font-bold text-blue-200/30 select-none uppercase"
                                style={{
                                  letterSpacing: "0.05em",
                                  lineHeight: "0.85",
                                  margin: 0,
                                  padding: 0,
                                  display: "block",
                                  marginTop: index > 0 ? "-0.1em" : "0",
                                }}
                              >
                                {line.toUpperCase()}
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : null;
                  })()}

                {/* Product Image Viewer */}
                <div className="w-full">
                  <ProductImageViewer
                    product={product}
                    selectedSize={selectedSize}
                    isDisabled={isDisabled}
                  />
                </div>
              </div>

              {/* Right Column: Product Information Card */}
              <div className="flex flex-col p-4 md:p-6 bg-white md:col-span-1 lg:col-span-3 h-auto md:h-full overflow-hidden">
                {/* Top Section - Content */}
                <div className="flex-1 space-y-3">
                  {/* Search Bar */}
                  <div className="flex justify-center sm:justify-end">
                    <form onSubmit={handleSearchSubmit} className="w-full sm:w-auto">
                      <div className="relative max-w-sm w-full sm:w-80">
                        <input
                          type="text"
                          placeholder="Search for items"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-12 pr-14 py-3 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-[#003363] focus:border-[#003363] text-sm transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <button
                          type="submit"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#003363] text-white p-2 rounded-full hover:bg-[#002347] transition-all shadow-md"
                        >
                          <ArrowLeft className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Product Info (includes Education Level Badge, Back Button, FREE Label, Title, Description) */}
                  <ProductInfo product={product} onClose={handleBackClick} isDisabled={isDisabled} />
                  
                  {/* Gender Mismatch Message */}
                  {genderMismatch && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                      <p className="font-medium">
                        This item is for {itemGender} only. Add to Cart and Order Now are disabled.
                      </p>
                    </div>
                  )}

                  {/* Size Selector - Fixed height to prevent layout shift */}
                  <div className="min-h-[150px] sm:min-h-[180px]">
                    {requiresSizeSelection && (
                      <SizeSelector
                        availableSizes={availableSizes}
                        availableSizesData={availableSizesData}
                        selectedSize={selectedSize}
                        onSizeSelect={handleSizeSelect}
                        sizeConfirmed={sizeConfirmed}
                        onSizeConfirm={handleSizeConfirm}
                        loadingSizes={loadingSizes}
                        disabled={effectiveMax < 1}
                        disabledReason={null}
                        isPreOrder={!(selectedSizeData && selectedSizeData.stock > 0)}
                      />
                    )}
                  </div>
                </div>

                {/* Bottom Section - Fixed at Bottom */}
                <div className="mt-auto pt-4 space-y-3 border-t border-gray-200">
                  {/* Already ordered — message removed per design
                  {effectiveMax < 1 && alreadyOrderedForItem > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                      <p className="font-medium">This item is already in your orders.</p>
                      <p className="mt-1 text-amber-700">Add to Cart and Order Now are disabled for this item, same as when it is in your cart. You have already ordered the maximum. You can only claim it when your order is ready.</p>
                      <p className="mt-1 text-amber-700">You can still order other allowed items where you have remaining quota (e.g. for Preschool: 1 Kinder Dress, 1 Kinder Necktie, 1 Jersey, 1 ID Lace each, if not yet used).</p>
                    </div>
                  )}
                  */}
                  {/* Max item types per order: system admin limit is distinct item types (slots). */}
                  {/* Blocked due to auto-void: student cannot place new orders after an unclaimed order was voided. */}
                  {blockedDueToVoid && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
                      <p className="font-medium">You cannot place new orders because a previous order was not claimed in time and was voided. Contact your administrator if you need assistance.</p>
                    </div>
                  )}
                  {/* Order limit not set: student cannot add to cart or place order until admin sets Total Item Limit. Hide when cause is voided (red banner shows instead). */}
                  {limitNotSet && !blockedDueToVoid && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                      <p className="font-medium">Your order limit has not been set. Ask your administrator to set Total Item Limit before you can add or place orders.</p>
                    </div>
                  )}
                  {/* Old students: this item is not in the allowed list (new logo patch, number patch per level only). */}
                  {notAllowedForStudentType && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                      <p className="font-medium">This item is only available for New Students.</p>
                      <p className="mt-1 text-amber-700">As an Old Student you can only order: New Logo Patch (max 3) and, for Elementary/Junior High/Senior High, Number Patch per grade (max 3).</p>
                    </div>
                  )}
                  {/* Quantity Selector */}
                  <div className="space-y-2 sm:space-y-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                      Quantity:
                    </h3>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="p-2 sm:p-3 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#F28C28] hover:bg-orange-50 transition-all"
                      >
                        <Minus className="w-4 h-4 text-gray-700" />
                      </button>

                      <span className="text-lg sm:text-xl font-bold text-[#003363] min-w-[3rem] text-center">
                        {quantity}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= effectiveMax}
                        className="p-2 sm:p-3 border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#F28C28] hover:bg-orange-50 transition-all"
                        title={`Max ${maxForItem} per student`}
                      >
                        <Plus className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                    {user && maxQuantitiesProfileIncomplete && (
                      <p className="text-xs text-amber-600">
                        Complete your profile (gender) to see order limits.
                      </p>
                    )}
                  </div>

                  {/* Action Buttons - Stack on Mobile */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={isOrderDisabled || effectiveMax < 1 || (user && !limitsLoaded) || slotsFullForNewType || limitNotSet || genderMismatch || notAllowedForStudentType || blockedDueToVoid}
                      className="w-full sm:w-auto px-5 py-2 bg-white border-2 border-[#003363] text-[#003363] font-semibold rounded-full hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </button>

                    <button
                      onClick={handleOrderNow}
                      disabled={isOrderDisabled || effectiveMax < 1 || (user && !limitsLoaded) || slotsFullForNewType || limitNotSet || genderMismatch || notAllowedForStudentType || blockedDueToVoid}
                      className="w-full sm:w-auto px-6 py-2 bg-[#F28C28] text-white font-semibold rounded-full hover:bg-[#d97a1f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-sm"
                    >
                      {requiresSizeSelection && selectedSize
                        ? selectedSizeData && selectedSizeData.stock > 0
                          ? "Order Now"
                          : "Pre-Order"
                        : isOutOfStock
                        ? "Pre-Order"
                        : "Order Now"}
                    </button>
                  </div>
                </div>

                {/* Size Selection Warning
                {requiresSizeSelection && (!selectedSize || !sizeConfirmed) && (
                  <p className="text-sm text-red-600 text-center font-medium">
                    {!selectedSize
                      ? "⚠️ Please select a size before ordering"
                      : "⚠️ Please confirm your size selection before ordering"}
                  </p>
                )} */}
              </div>
            </div>
          </div>
        </div>

        {/* Other Products Section - only products for the user's education level */}
        {userEducationLevel != null && relatedProducts.length > 0 && (
          <div className=" rounded-2xl shadow-lg p-6 md:p-8">
            <ProductCarousel
              products={relatedProducts}
              onProductClick={handleProductSwitch}
              currentProductId={product.id}
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductDetailsPage;
