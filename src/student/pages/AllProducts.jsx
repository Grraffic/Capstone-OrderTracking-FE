import React, { useState, useMemo, useEffect } from "react";
import { Search, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import CategorySidebar from "../components/Products/CategorySidebar";
import ProductGrid from "../components/Products/ProductGrid";
import Pagination from "../components/common/Pagination";
import Footer from "../../components/common/Footer";
import { useItems } from "../../property-custodian/hooks/items/useItems";
import { useSearchDebounce, useProductPagination } from "../hooks";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { authAPI } from "../../services/api";
import { resolveItemKeyForMaxQuantity, DEFAULT_MAX_WHEN_UNKNOWN } from "../../utils/maxQuantityKeys";
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
  const [maxItemsPerOrder, setMaxItemsPerOrder] = useState(null);
  const [slotsUsedFromPlacedOrders, setSlotsUsedFromPlacedOrders] = useState(0);
  const [limitsLoaded, setLimitsLoaded] = useState(false);
  const [limitsRefreshTrigger, setLimitsRefreshTrigger] = useState(0);

  // Get user from auth context and cart for "already in cart" check
  const { user } = useAuth();
  const { items: cartItems } = useCart();

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

  // Refetch limits when an order was just created (e.g. after checkout) or when tab regains focus.
  // When visible and logged in, always refetch so "already ordered" is up to date (e.g. checkout in another tab).
  // On pageshow persisted (bfcache): page restored via Back button; refetch so item stays disabled.
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

  // On mount, if we came back after checkout (or landing as logged-in user), refetch limits so "already ordered" is up to date
  useEffect(() => {
    try {
      if (sessionStorage.getItem("limitsNeedRefresh")) setLimitsRefreshTrigger((t) => t + 1);
    } catch (_) {}
    if (user) setLimitsRefreshTrigger((t) => t + 1);
  }, [user]);

  // Fetch max-quantities and alreadyOrdered so we can disable add/order for items already at limit (e.g. jogging pants in orders)
  useEffect(() => {
    const fetchMaxQuantities = async () => {
      if (!user) {
        setLimitsLoaded(false);
        return;
      }
      setLimitsLoaded(false);
      try {
        const res = await authAPI.getMaxQuantities();
        setMaxQuantities(res.data?.maxQuantities ?? {});
        setAlreadyOrdered(res.data?.alreadyOrdered ?? {});
        setMaxItemsPerOrder(res.data?.maxItemsPerOrder ?? null);
        setSlotsUsedFromPlacedOrders(res.data?.slotsUsedFromPlacedOrders ?? Object.keys(res.data?.alreadyOrdered ?? {}).length);
        try {
          sessionStorage.removeItem("limitsNeedRefresh");
        } catch (_) {}
        setLimitsLoaded(true);
      } catch (err) {
        if (err?.response?.status === 400) {
          setAlreadyOrdered(err?.response?.data?.alreadyOrdered ?? {});
          setMaxQuantities(err?.response?.data?.maxQuantities ?? {});
          setMaxItemsPerOrder(err?.response?.data?.maxItemsPerOrder ?? null);
          setSlotsUsedFromPlacedOrders(err?.response?.data?.slotsUsedFromPlacedOrders ?? Object.keys(err?.response?.data?.alreadyOrdered ?? {}).length);
        } else if (err?.response?.status !== 403) {
          console.error("Error fetching max quantities:", err);
        }
        setLimitsLoaded(true);
      }
    };
    fetchMaxQuantities();
  }, [user, limitsRefreshTrigger]);

  // Fetch items with skipInitialFetch so we don't show all products before profile loads.
  // Only fetch once we have profile (or know user is logged out), then use eligibility level.
  const { items, loading, error, fetchItems } = useItems({
    skipInitialFetch: true,
  });

  const eligibilityLevel =
    userEducationLevel === "Vocational" ? "College" : userEducationLevel;

  useEffect(() => {
    if (!fetchItems) return;
    if (user && profileLoading) return;
    if (eligibilityLevel) {
      fetchItems(eligibilityLevel);
    } else {
      fetchItems();
    }
  }, [user, profileLoading, eligibilityLevel, fetchItems]);

  // Debounce search
  const debouncedSearch = useSearchDebounce(searchQuery, 300);

  // Transform inventory items to match product format expected by components
  // Group by (name, educationLevel) to remove duplicates caused by different sizes
  const transformedProducts = useMemo(() => {
    // Group items by name and education level
    const groupedItems = items.reduce((acc, item) => {
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
  }, [items]);

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

  // Cart slot count = distinct item types (system-admin "max items per order" is slot limit)
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
    maxItemsPerOrder != null && Number(maxItemsPerOrder) > 0
      ? Math.max(0, Number(maxItemsPerOrder) - (Number(slotsUsedFromPlacedOrders) || 0))
      : 0;

  // Old students: only allowed items (new logo patch, number patch per level) have max > 0; others are disallowed.
  const isOldStudent = (user?.studentType || user?.student_type || "").toLowerCase() === "old";

  // Enrich products with "already at order limit" and "slots full for new type"
  // Only placed orders count toward the limit—cart does not.
  const productsWithLimit = useMemo(() => {
    let list = paginatedItems.map((p) => {
      const key = resolveItemKeyForMaxQuantity(p.name);
      const max =
        isOldStudent && (maxQuantities[key] === undefined || maxQuantities[key] === null)
          ? 0
          : (maxQuantities[key] ?? DEFAULT_MAX_WHEN_UNKNOWN);
      const notAllowedForStudentType = isOldStudent && (maxQuantities[key] === undefined || maxQuantities[key] === null);
      const alreadyOrd = alreadyOrdered[key] ?? 0;
      const inCart = (cartItems || []).filter(
        (i) => resolveItemKeyForMaxQuantity(i.inventory?.name || i.name) === key
      ).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
      const effectiveMax = Math.max(0, max - inCart - alreadyOrd);
      const isNewItemType = key && !cartSlotKeys.has(key);
      const slotsFullForNewType =
        maxItemsPerOrder != null &&
        Number(maxItemsPerOrder) > 0 &&
        isNewItemType &&
        cartSlotCount >= slotsLeftForThisOrder;
      return {
        ...p,
        _orderLimitReached: effectiveMax < 1,
        _slotsFullForNewType: slotsFullForNewType,
        _notAllowedForStudentType: notAllowedForStudentType,
      };
    });
    // Old students still see all items at their education level; disallowed items are disabled (For New Students only overlay).
    return list;
  }, [paginatedItems, maxQuantities, alreadyOrdered, cartItems, cartSlotKeys, cartSlotCount, maxItemsPerOrder, slotsLeftForThisOrder, isOldStudent]);

  const limitNotSet =
    user &&
    limitsLoaded &&
    (maxItemsPerOrder == null || maxItemsPerOrder === undefined || Number(maxItemsPerOrder) <= 0);

  // Event handlers
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setIsSidebarOpen(false); // Close mobile sidebar after selection
  };

  // Don't show products until we've fetched with the user's education level (avoids flash of all products on reload)
  // When logged in, also wait for order limits so we don't show "can add" before we know alreadyOrdered
  const isWaitingForProfile = user && profileLoading;
  const isWaitingForFilteredItems = user && userEducationLevel != null && loading;
  const isWaitingForLimits = user && !limitsLoaded;
  if (isWaitingForProfile || isWaitingForFilteredItems || isWaitingForLimits || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">
              {isWaitingForProfile ? "Loading your profile..." : isWaitingForLimits ? "Checking order limits..." : "Loading products..."}
            </p>
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
    <div className="min-h-screen">
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

            {limitNotSet && (
              <div className="mt-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-semibold">
                    Your order limit has not been set. Contact your administrator to set Max Items Per Order before ordering.
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
              <ProductGrid products={productsWithLimit} />

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
