import React, { useState, useMemo, useEffect } from "react";
import { Search, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import CategorySidebar from "../components/Products/CategorySidebar";
import ProductGrid from "../components/Products/ProductGrid";
import Pagination from "../components/common/Pagination";
import { useItems } from "../../property-custodian/hooks/items/useItems";
import { useSearchDebounce, useProductPagination } from "../hooks";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useSocket } from "../../context/SocketContext";
import { authAPI } from "../../services/api";
import { resolveItemKeyForMaxQuantity, getDefaultMaxForItem } from "../../utils/maxQuantityKeys";
import { categoryFromItemType } from "../constants/studentProducts";

/**
 * AllProducts Component
 *
 * Student-facing product catalog page that displays available uniforms and items.
 *
 * Features:
 * - Browse all available inventory items from real API
 * - Filter by category (sidebar)
 * - Search functionality
 * - Stock status indicators (Available, Low Stock, Out of Stock)
 * - Order items with quantity selection
 * - Generate QR code receipt after order submission
 * - NO pricing information displayed (uniforms are free for students)
 * - Read-only view of inventory
 */
const AllProducts = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop sidebar collapse to icons
  const [userEducationLevel, setUserEducationLevel] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [maxQuantities, setMaxQuantities] = useState({});
  const [alreadyOrdered, setAlreadyOrdered] = useState({});
  const [claimedItems, setClaimedItems] = useState({});
  const [totalItemLimit, setMaxItemsPerOrder] = useState(null);
  const [slotsUsedFromPlacedOrders, setSlotsUsedFromPlacedOrders] = useState(0);
  const [limitsLoaded, setLimitsLoaded] = useState(false);
  const [limitsRefreshTrigger, setLimitsRefreshTrigger] = useState(0);
  const [blockedDueToVoid, setBlockedDueToVoid] = useState(false);

  // Get user from auth context and cart for "already in cart" check
  const { user } = useAuth();
  const { items: cartItems } = useCart();
  const { on, off, isConnected } = useSocket();

  // Fetch user profile to get education level
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

  // Check if user is old student (used for permission-based ordering and refresh mechanism)
  const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";

  // Refetch limits when an order was just created (e.g. after checkout) or when tab regains focus.
  // When visible and logged in, always refetch so "already ordered" is up to date (e.g. checkout in another tab).
  // On pageshow persisted (bfcache): page restored via Back button; refetch so item stays disabled.
  // Also refresh periodically for old students to pick up admin permission changes
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
    
    // Periodic refresh to pick up admin permission changes (every 30 seconds when page is visible)
    let refreshInterval = null;
    if (user && isOldStudent) {
      refreshInterval = setInterval(() => {
        if (document.visibilityState === "visible") {
          setLimitsRefreshTrigger((t) => t + 1);
        }
      }, 30000); // Refresh every 30 seconds for old students to pick up admin changes
    }
    
    window.addEventListener("order-created", onOrderCreated);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("order-created", onOrderCreated);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [user, isOldStudent]);

  // On mount, if we came back after checkout (or landing as logged-in user), refetch limits so "already ordered" is up to date
  useEffect(() => {
    try {
      if (sessionStorage.getItem("limitsNeedRefresh")) setLimitsRefreshTrigger((t) => t + 1);
    } catch (_) {}
    if (user) setLimitsRefreshTrigger((t) => t + 1);
  }, [user]);

  // Fetch max-quantities and alreadyOrdered so we can disable add/order for items already at limit (e.g. jogging pants in orders)
  // Optimized: Fetch immediately without blocking UI, items are disabled until limits load
  useEffect(() => {
    const fetchMaxQuantities = async () => {
      if (!user) {
        setLimitsLoaded(false);
        return;
      }
      // Only set limitsLoaded to false on initial load (when user first appears)
      // On refresh triggers, keep the previous state to avoid flickering
      if (limitsRefreshTrigger === 0) {
        setLimitsLoaded(false);
      }
      try {
        const res = await authAPI.getMaxQuantities();
        // Update all state at once for better performance
        setMaxQuantities(res.data?.maxQuantities ?? {});
        setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
        setClaimedItems(res.data?.claimedItems ?? {});
        setMaxItemsPerOrder(res.data?.totalItemLimit ?? null);
        setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? Object.keys(res.data?.alreadyOrdered ?? {}).length);
        setBlockedDueToVoid(res.data?.blockedDueToVoid === true);
        try {
          sessionStorage.removeItem("limitsNeedRefresh");
        } catch (_) {}
        setLimitsLoaded(true);
      } catch (err) {
        if (err?.response?.status === 400) {
          // Update all state at once for better performance
          setAlreadyOrdered(err?.response?.data?.alreadyOrdered ?? {});
          setClaimedItems(err?.response?.data?.claimedItems ?? {});
          setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
          setMaxItemsPerOrder(err?.response?.data?.totalItemLimit ?? null);
          setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? Object.keys(err?.response?.data?.alreadyOrdered ?? {}).length);
          setBlockedDueToVoid(err?.response?.data?.blockedDueToVoid === true);
        } else if (err?.response?.status !== 403) {
          console.error("Error fetching max quantities:", err);
        }
        setLimitsLoaded(true);
      }
    };
    fetchMaxQuantities();
  }, [user, limitsRefreshTrigger]);

  // Listen for Socket.IO order:created events to refresh max-quantities in real-time
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const handleOrderCreated = (data) => {
      console.log("📡 [AllProducts] Received order:created event via Socket.IO, refreshing max-quantities:", data);
      // Trigger refresh of max-quantities to update alreadyOrdered counts
      setLimitsRefreshTrigger((t) => t + 1);
    };

    on("order:created", handleOrderCreated);

    // Cleanup on unmount
    return () => {
      off("order:created", handleOrderCreated);
    };
  }, [isConnected, on, off]);

  // Fetch items with skipInitialFetch so we don't show all products before profile loads.
  // Only fetch once we have profile (or know user is logged out), then use eligibility level.
  const { items, loading, error, fetchItems } = useItems({
    skipInitialFetch: true,
  });

  const eligibilityLevel =
    userEducationLevel === "Vocational" ? "College" : userEducationLevel;
  
  // Get student type for old students (they should see all items for their education level)
  const studentType = user?.studentType || user?.student_type || null;

  useEffect(() => {
    if (!fetchItems) return;
    if (user && profileLoading) return;
    if (eligibilityLevel) {
      fetchItems(eligibilityLevel, studentType);
    } else {
      fetchItems(null, studentType);
    }
  }, [user, profileLoading, eligibilityLevel, studentType, fetchItems]);

  // Debounce search
  const debouncedSearch = useSearchDebounce(searchQuery, 300);

  // Transform inventory items to match product format expected by components
  // Note: isOldStudent is already defined above for refresh mechanism
  // Group by (name, educationLevel) to remove duplicates caused by different sizes
  const transformedProducts = useMemo(() => {
    // Filter out "New Logo Patch" for old students - they should only see "Logo Patch"
    let itemsToProcess = items;
    if (isOldStudent) {
      itemsToProcess = items.filter((item) => {
        const itemName = (item.name || "").toLowerCase();
        // Exclude "new logo patch" items for old students
        return !itemName.includes("new logo patch");
      });
    }

    // Group items by name and education level
    const groupedItems = itemsToProcess.reduce((acc, item) => {
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
  }, [items, isOldStudent]);

  // Filter products by category and search
  // Note: Education level filtering is now handled by the backend via eligibility table
  // So we don't need to filter by education level here anymore
  const filteredProducts = useMemo(() => {
    let filtered = [...transformedProducts];

    // Education level filtering is now done by the backend based on eligibility table
    // Items returned from the API are already filtered to show only eligible items

    // Filter by category
    if (selectedCategory !== "all") {
      if (
        selectedCategory === "school_uniform" ||
        selectedCategory === "pe_uniform"
      ) {
        filtered = filtered.filter(
          (product) => product.category === selectedCategory
        );
      } else if (selectedCategory === "uniform") {
        filtered = filtered.filter(
          (product) =>
            product.category === "school_uniform" ||
            product.category === "pe_uniform"
        );
      } else if (selectedCategory === "other_items") {
        filtered = filtered.filter(
          (product) => product.category === "other_items"
        );
      }
    }

    // Filter by search query
    if (debouncedSearch && debouncedSearch.trim() !== "") {
      const query = debouncedSearch.toLowerCase().trim();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.educationLevel?.toLowerCase().includes(query)
      );
    }

    // Filter by user gender: only show Unisex or items for the user's gender
    if (user?.gender) {
      filtered = filtered.filter((p) => {
        const fg = (p.for_gender || p.forGender || "Unisex").toString().trim();
        return fg === "Unisex" || fg === user.gender;
      });
    }

    return filtered;
  }, [
    transformedProducts,
    selectedCategory,
    debouncedSearch,
    userEducationLevel,
    user?.gender,
  ]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = useProductPagination(filteredProducts, 8);

  // Cart slot count = distinct item types (system-admin "total item limit" is slot limit)
  const cartSlotKeys = useMemo(() => {
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

  // Enrich products with "already at order limit" and "slots full for new type"
  // Only placed orders count toward the limit—cart does not.
  // For old students: ALL items (including "All Education Levels") must be explicitly enabled by admin to be orderable.
  const productsWithLimit = useMemo(() => {
    // If limits are not loaded yet, treat all items as disabled to prevent misleading "blinking" effect
    // Items will only be enabled once we have confirmed their actual availability
    if (!limitsLoaded) {
      return paginatedItems.map((p) => ({
        ...p,
        _orderLimitReached: true, // Disable until limits are loaded
        _isClaimed: false,
        _slotsFullForNewType: false,
        _notAllowedForStudentType: false,
        _claimedCount: 0,
        _alreadyOrderedCount: 0,
        _totalUsed: 0,
        _maxAllowed: 0,
        _effectiveMax: 0,
      }));
    }

    let list = paginatedItems.map((p) => {
      const key = resolveItemKeyForMaxQuantity(p.name);
      const keyMissing = maxQuantities[key] === undefined || maxQuantities[key] === null;
      // For old students: Items must be explicitly enabled in permissions to be orderable
      // If item is not in maxQuantities (not enabled by admin), it should be disabled (max = 0)
      // This applies to ALL items, including "All Education Levels" items like logo patch
      // Only items explicitly enabled by system admin can be ordered
      let max;
      if (isOldStudent) {
        if (keyMissing) {
          // Old student, item not in maxQuantities (not enabled by admin) → disabled
          // This applies to ALL items, including "All Education Levels" items
          max = 0;
        } else {
          // Item is in maxQuantities (explicitly enabled by admin) → use that value
          max = maxQuantities[key];
        }
      } else {
        // New student: Use maxQuantities if available, otherwise default
        max = maxQuantities[key] ?? getDefaultMaxForItem(p.name);
      }
      
      // For old students: item is not allowed if not in maxQuantities (not enabled by admin)
      // This applies to ALL items, including "All Education Levels" items
      const notAllowedForStudentType = isOldStudent && keyMissing;
      const alreadyOrd = alreadyOrdered[key] ?? 0;
      // Get claimed count for this item
      let claimedForItem = claimedItems[key] ?? 0;
      // Check if this item has a manually granted permission (for old students)
      // If it does, allow ordering up to the new max even if previously claimed
      // The max from permissions is the NEW total allowed, so we calculate remaining
      const inCart = (cartItems || []).filter(
        (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
      ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      
      // FORCE DISABLE: Check if total (alreadyOrdered + claimedItems) has reached or exceeded the max limit
      // For items with max > 1 (like logo patch with max 3): Check alreadyOrdered + claimedItems >= max
      // For items with max = 1: Only check claimedItems (alreadyOrdered is already handled separately)
      // This ensures that when a student places an order with max quantity, the item is immediately disabled
      const maxForClaimedCheck = max; // Use the same max that was determined above
      const totalUsed = alreadyOrd + claimedForItem;
      // For items with max > 1, check total used (alreadyOrdered + claimedItems)
      // For items with max = 1, only check claimedItems (alreadyOrdered prevents duplicate orders separately)
      const isMaxReached = maxForClaimedCheck > 0 && (
        maxForClaimedCheck > 1 
          ? totalUsed >= maxForClaimedCheck  // For logo patch (max 3): check alreadyOrdered + claimedItems >= 3
          : claimedForItem >= maxForClaimedCheck  // For max = 1: only check claimedItems
      );
      
      // Calculate effective max: max allowed minus what's already ordered/claimed/in cart
      // For manually granted permissions (old students): The max from permissions is the NEW total allowed
      // For items with max > 1 (like logo patch), subtract both alreadyOrdered and claimedItems
      // For items with max = 1, subtract alreadyOrdered to prevent duplicate orders
      let effectiveMax;
      if (isMaxReached) {
        // If max is reached (alreadyOrdered + claimedItems >= max), completely block ordering
        effectiveMax = 0;
      } else if (isOldStudent && maxQuantities[key] != null) {
        // Old student with manually granted permission: max from permissions is the NEW total
        const newMaxFromPermissions = maxQuantities[key];
        const shouldAllowMultipleOrders = newMaxFromPermissions > 1;
        // For items with max > 1, subtract both alreadyOrdered and claimedItems
        // For items with max = 1, subtract alreadyOrdered to prevent duplicate orders
        const subtractAlreadyOrdered = !shouldAllowMultipleOrders;
        effectiveMax = Math.max(0, newMaxFromPermissions - inCart - (subtractAlreadyOrdered ? alreadyOrd : 0) - claimedForItem);
      } else {
        // Regular calculation: For items with max > 1, subtract both alreadyOrdered and claimedItems
        // For items with max = 1, subtract alreadyOrdered to prevent duplicate orders
        const shouldAllowMultipleOrders = max > 1;
        const subtractAlreadyOrdered = !shouldAllowMultipleOrders;
        effectiveMax = Math.max(0, max - inCart - (subtractAlreadyOrdered ? alreadyOrd : 0) - claimedForItem);
      }
      
      // Debug logging specifically for logo patch to track disable logic (after effectiveMax is calculated)
      if (key === "logo patch") {
        console.log(`[AllProducts Logo Patch] Disable Check:`, {
          itemName: p.name,
          key,
          isOldStudent,
          keyMissing,
          maxQuantitiesKey: maxQuantities[key],
          max, // The max being used (from permissions, default, or maxQuantities)
          maxForClaimedCheck,
          alreadyOrdered: alreadyOrd,
          claimedForItem,
          totalUsed,
          isMaxReached,
          _isMaxReached: isMaxReached,
          _orderLimitReached: effectiveMax < 1 || isMaxReached,
          effectiveMax,
        });
      }
      
      // Debug logging for manually granted permissions (old students) and logo patch
      if ((isOldStudent && key) || key === "logo patch" || key === "jogging pants") {
        console.log(`[AllProducts] Item: ${p.name}, Key: ${key}, Max: ${max}, AlreadyOrdered: ${alreadyOrd}, Claimed: ${claimedForItem}, TotalUsed: ${totalUsed}, isMaxReached: ${isMaxReached}`, {
          isOldStudent,
          keyMissing,
          maxQuantitiesKey: maxQuantities[key],
          max,
          alreadyOrdered: alreadyOrd,
          inCart,
          claimedForItem,
          totalUsed,
          effectiveMax,
          _isMaxReached: isMaxReached,
          _orderLimitReached: effectiveMax < 1 || isMaxReached,
          maxQuantitiesKeys: Object.keys(maxQuantities),
        });
      }
      const isNewItemType = key && !cartSlotKeys.has(key);
      const slotsFullForNewType =
        totalItemLimit != null &&
        Number(totalItemLimit) > 0 &&
        isNewItemType &&
        cartSlotCount >= slotsLeftForThisOrder;
      return {
        ...p,
        // FORCE DISABLE: If max is reached (alreadyOrdered + claimedItems >= max), item is ALWAYS disabled
        _orderLimitReached: effectiveMax < 1 || isMaxReached,
        _isClaimed: isMaxReached, // This forces ProductCard to disable the item
        _slotsFullForNewType: slotsFullForNewType,
        _notAllowedForStudentType: notAllowedForStudentType,
        _claimedCount: claimedForItem,
        _alreadyOrderedCount: alreadyOrd,
        _totalUsed: totalUsed,
        _maxAllowed: max,
        // Force effectiveMax to 0 when max is reached
        _effectiveMax: isMaxReached ? 0 : effectiveMax,
      };
    });
    // Old students still see all items at their education level; disallowed items are disabled (For New Students only overlay).
    return list;
  }, [paginatedItems, maxQuantities, alreadyOrdered, claimedItems, cartItems, cartSlotKeys, cartSlotCount, totalItemLimit, slotsLeftForThisOrder, isOldStudent, limitsLoaded]);

  const limitNotSet =
    user &&
    limitsLoaded &&
    (totalItemLimit == null || totalItemLimit === undefined || Number(totalItemLimit) <= 0);

  const slotLimitReached =
    user &&
    limitsLoaded &&
    totalItemLimit != null &&
    Number(totalItemLimit) > 0 &&
    slotsLeftForThisOrder <= 0;

  // Event handlers
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setIsSidebarOpen(false); // Close mobile sidebar after selection
  };

  // Skeleton loader component for product cards
  const ProductCardSkeleton = () => (
    <div className="relative rounded-2xl shadow-md overflow-hidden flex flex-col h-full bg-white animate-pulse">
      {/* Image skeleton */}
      <div className="relative aspect-square bg-gray-200"></div>
      {/* Content skeleton */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
        {/* Education level skeleton */}
        <div className="h-5 bg-gray-200 rounded mb-4 w-1/2"></div>
        {/* Spacer */}
        <div className="flex-grow"></div>
        {/* Status skeleton */}
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  );

  // Show full-page loading only for profile or initial products fetch, so the layout is the same for all users.
  // Do not block on limits: show the full All Products layout (sidebar, header, grid) and let limits load in the background;
  // cards will show disabled/overlays once limits are loaded (avoids stuck "Checking order limits..." and design difference per user).
  const isWaitingForProfile = user && profileLoading;
  const isWaitingForFilteredItems = user && userEducationLevel != null && loading;
  if (isWaitingForProfile || isWaitingForFilteredItems || (!user && loading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <HeroSection heading="Item Card" align="bottom-center" />
        
        {/* Main Content – white card close to hero/building */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-28">
          {/* Main Container - White card */}
          <div className="bg-white rounded-3xl shadow-gray-800 shadow-md mb-8 relative">
            {/* Header skeleton */}
            <div className="z-20 rounded-t-3xl px-6 md:px-8 lg:px-10 py-4 md:py-5 border-b border-gray-100 shadow-sm min-h-[139px] flex flex-col justify-center items-center">
              <div className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 md:gap-6">
                {/* Left: Hamburger + Title skeleton */}
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
                {/* Right: Search skeleton */}
                <div className="flex-1 max-w-md">
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Content Grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 md:px-8 lg:px-10 pb-6 md:pb-8 lg:pb-10">
              {/* Sidebar skeleton (Desktop) */}
              <div className="hidden lg:block lg:col-span-3">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Products Grid skeleton */}
              <div className="lg:col-span-9">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-gray-600 text-lg">Error loading products</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section – "Item Card" at middle bottom */}
      <HeroSection heading="Item Card" align="bottom-center" />

      {/* Main Content – white card close to hero/building */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-28">
        {/* Main Container - White card */}
        <div className="bg-white rounded-3xl shadow-gray-800 shadow-md mb-8 relative">
          {/* Header – compact, centered; ~139px height */}
          <div className="z-20 rounded-t-3xl px-6 md:px-8 lg:px-10 py-4 md:py-5 border-b border-gray-100 shadow-sm min-h-[139px] flex flex-col justify-center items-center">
            {/* Header Content – full width so layout is preserved */}
            <div className="w-full flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 md:gap-6">
              {/* Left: Hamburger + Title */}
              <div className="flex items-center gap-4">
                {/* Hamburger Button */}
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(!isSidebarOpen);
                    } else {
                      setIsSidebarCollapsed(!isSidebarCollapsed);
                    }
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
                  aria-label="Toggle sidebar"
                >
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>

                {/* Page Title */}
                <h1 className="text-3xl md:text-4xl font-bold">
                  <span className="text-[#003363]">All </span>
                  <span className="text-[#F28C28]">Products</span>
                </h1>
              </div>

              {/* Search Bar */}
              <div className="relative w-full lg:w-96">
                <input
                  type="text"
                  placeholder="Search for items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#003363] focus:border-transparent text-sm"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#003363] text-white p-2 rounded-full hover:bg-[#002347] transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>


            {!userEducationLevel && !profileLoading && (
              <div className="mt-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-yellow-800 font-semibold">
                    Complete your profile to see relevant products
                  </p>
                  <p className="text-xs text-yellow-700 mt-0.5">
                    Set your year level in Settings to filter products for your
                    education level.
                  </p>
                </div>
              </div>
            )}

            {limitNotSet && !blockedDueToVoid && (
              <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-semibold">
                    Your order limit has not been set. Contact your administrator to set Total Item Limit before ordering.
                  </p>
                </div>
              </div>
            )}

            {/* Voided unclaimed banner – kept in header */}
            {blockedDueToVoid && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <Info className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-red-800 font-semibold">
                    You cannot place another order because a previous order was voided for not being claimed in time. Please contact the finance department first.
                  </p>
                </div>
              </div>
            )}

            {/* Total item limit banner – in header to inform user */}
            {slotLimitReached && !blockedDueToVoid && (
              <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-semibold">
                    Total item limit reached. You have used all item slots for this order period. Remove existing orders to place new ones.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 md:px-8 lg:px-10 pb-6 md:pb-8 lg:pb-10">
            {/* Sidebar (Desktop) */}
            <div
              className={`hidden lg:block ${
                isSidebarCollapsed ? "lg:col-span-1" : "lg:col-span-3"
              }`}
            >
              <CategorySidebar
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                isCollapsed={isSidebarCollapsed}
              />
            </div>

            {/* Sidebar (Mobile) */}
            {isSidebarOpen && (
              <div className="lg:hidden col-span-1 mb-6">
                <CategorySidebar
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            )}

            {/* Product Grid */}
            <div
              className={`${
                isSidebarCollapsed ? "lg:col-span-11" : "lg:col-span-9"
              }`}
              style={{ transition: "all 0.3s ease-in-out" }}
            >
              <ProductGrid products={productsWithLimit} blockedDueToVoid={blockedDueToVoid} />

              {filteredProducts.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  onPrevious={prevPage}
                  onNext={nextPage}
                  canGoPrev={canGoPrev}
                  canGoNext={canGoNext}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
