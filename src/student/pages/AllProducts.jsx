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
import { authAPI } from "../../services/api";

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

  // Get user from auth context
  const { user } = useAuth();

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

  // Fetch items data using existing hook with user education level for eligibility filtering
  const { items, loading, error, fetchItems } = useItems();
  
  // Fetch items when user education level is available.
  // Treat "Vocational" as "College" for eligibility (ACT is part of College).
  const eligibilityLevel =
    userEducationLevel === "Vocational" ? "College" : userEducationLevel;

  useEffect(() => {
    if (eligibilityLevel && fetchItems) {
      fetchItems(eligibilityLevel);
    } else if (fetchItems) {
      fetchItems(); // Fetch all items if no education level
    }
  }, [eligibilityLevel, fetchItems]);

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

      return {
        id: baseItem.id,
        name: baseItem.name,
        type: baseItem.itemType?.toLowerCase() || "other",
        category:
          baseItem.category?.toLowerCase().replace(/\s+/g, "_") ||
          "other_items",
        status: status,
        image: baseItem.image || "/images/products/placeholder.jpg",
        price: 0, // FREE for students - price hidden
        description: baseItem.description || baseItem.descriptionText || "",
        educationLevel: baseItem.educationLevel,
        itemType: baseItem.itemType,
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

    return filtered;
  }, [
    transformedProducts,
    selectedCategory,
    debouncedSearch,
    userEducationLevel,
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

  // Event handlers
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setIsSidebarOpen(false); // Close mobile sidebar after selection
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-16">
        {/* Main Container - White card */}
        <div className="bg-white rounded-3xl shadow-gray-800 shadow-md mb-8">
          {/* Sticky Header (unchanged) */}
          <div className=" z-20 rounded-t-3xl px-6 md:px-8 lg:px-10 pt-6 md:pt-8 lg:pt-10 pb-6 border-b border-gray-100 shadow-sm">
            {/* Header Content */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
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

            {/* Education Level Alerts */}
            {userEducationLevel && (
              <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800 font-semibold">
                    Showing products for: {userEducationLevel}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Products are filtered based on your year level. General
                    items are always visible.
                  </p>
                </div>
              </div>
            )}

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
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Showing {paginatedItems.length} of {filteredProducts.length}{" "}
                  products
                  {debouncedSearch && ` for "${debouncedSearch}"`}
                </p>
                <p className="text-xs text-[#F28C28] font-semibold mt-1">
                  ✨ All items are FREE for students
                </p>
              </div>

              <ProductGrid products={paginatedItems} />

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
