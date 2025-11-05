import React, { useState } from "react";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import CategorySidebar from "../components/CategorySidebar";
import ProductGrid from "../components/ProductGrid";
import TopPicks from "../components/TopPicks";
import Pagination from "../components/Pagination";
import Footer from "../components/Footer";
import { useProducts } from "../hooks/useProducts";
import { useSearchDebounce } from "../hooks/useSearchDebounce";
import { useProductFilter } from "../hooks/useProductFilter";
import { useProductPagination } from "../hooks/useProductPagination";
import { TOP_PICKS } from "../constants/studentProducts";

const AllProducts = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Custom hooks
  const { products, loading, error } = useProducts();
  const debouncedSearch = useSearchDebounce(searchQuery, 300);
  const { filteredProducts, selectedCategory, setSelectedCategory } =
    useProductFilter(products, debouncedSearch);
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

  // Get top picks products
  const topPicksProducts = products.filter((product) =>
    TOP_PICKS.includes(product.id)
  );

  // Event handlers
  const handleOrderClick = (product) => {
    console.log("Order clicked for product:", product);
    alert(`Order Now: ${product.name}\n\nAll items are free for students!`);
    // TODO: Implement order functionality
  };

  const handlePreOrderClick = (product) => {
    console.log("Pre-order clicked for product:", product);
    alert(`Pre-Order: ${product.name}\n\nAll items are free for students!`);
    // TODO: Implement pre-order functionality
  };

  const handleTopPickClick = (product) => {
    console.log("Top pick clicked:", product);
    // Scroll to product or show details
    alert(`View Product: ${product.name}`);
    // TODO: Implement product detail view
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section - No padding, starts immediately below navbar */}
      <div className="pt-16">
        <HeroSection />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-8">
        {/* Main Container with rounded corners and shadow - overlaps hero */}
        <div className="bg-white rounded-3xl shadow-gray-800 shadow-md p-6 md:p-8 lg:p-10">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            {/* Left: Hamburger + Title */}
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle categories"
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

            {/* Right: Search Bar */}
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

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Category Sidebar - Desktop */}
            <div className="hidden lg:block lg:col-span-3">
              <CategorySidebar
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>

            {/* Category Sidebar - Mobile (Collapsible) */}
            {isSidebarOpen && (
              <div className="lg:hidden col-span-1 mb-6">
                <CategorySidebar
                  selectedCategory={selectedCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            )}

            {/* Product Grid */}
            <div className="lg:col-span-6">
              {/* Results Info */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Showing {paginatedItems.length} of {filteredProducts.length}{" "}
                  products
                  {debouncedSearch && ` for "${debouncedSearch}"`}
                </p>
              </div>

              {/* Product Grid */}
              <ProductGrid
                products={paginatedItems}
                onOrderClick={handleOrderClick}
                onPreOrderClick={handlePreOrderClick}
              />

              {/* Pagination */}
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

            {/* Top Picks Sidebar - Desktop */}
            <div className="hidden lg:block lg:col-span-3">
              <TopPicks
                products={topPicksProducts}
                onProductClick={handleTopPickClick}
              />
            </div>
          </div>

          {/* Top Picks - Mobile (Below Grid) */}
          <div className="lg:hidden mt-8">
            <TopPicks
              products={topPicksProducts}
              onProductClick={handleTopPickClick}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AllProducts;
