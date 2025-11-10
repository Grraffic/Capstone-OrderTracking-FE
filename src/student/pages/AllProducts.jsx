import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import CategorySidebar from "../components/Products/CategorySidebar";
import ProductGrid from "../components/Products/ProductGrid";
import Pagination from "../components/common/Pagination";
import Footer from "../../components/common/Footer";
import OrderReceiptQRCode from "../components/Orders/OrderReceiptQRCode";
import { ProductDetailsModal } from "../components/Products/ProductDetails";
import { useInventory } from "../../admin/hooks/inventory/useInventory";
import {
  useSearchDebounce,
  useProductPagination,
  useOrderSubmission,
  useProductDetails,
} from "../hooks";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderSize, setOrderSize] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch inventory data using existing hook
  const { items, loading, error } = useInventory();

  // Order submission hook
  const {
    loading: orderLoading,
    error: orderError,
    submittedOrder,
    submitOrder,
    resetOrder,
  } = useOrderSubmission();

  // Debounce search
  const debouncedSearch = useSearchDebounce(searchQuery, 300);

  // Product details modal hook
  const productDetailsModal = useProductDetails(items);

  // Transform inventory items to match product format expected by components
  const transformedProducts = useMemo(() => {
    return items.map((item) => {
      // Map inventory status to product status
      let status = "in_stock";
      const stock = item.stock || 0;

      if (stock === 0) {
        status = "out_of_stock";
      } else if (stock < 20) {
        status = "limited_stock";
      }

      return {
        id: item.id,
        name: item.name,
        type: item.itemType?.toLowerCase() || "other",
        category:
          item.category?.toLowerCase().replace(/\s+/g, "_") || "other_items",
        status: status,
        image: item.image || "/images/products/placeholder.jpg",
        price: 0, // FREE for students - price hidden
        description: item.description || item.descriptionText || "",
        educationLevel: item.educationLevel,
        itemType: item.itemType,
        stock: item.stock,
        sizes: item.sizes,
        // Keep original item data for order submission
        _originalItem: item,
      };
    });
  }, [items]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    let filtered = [...transformedProducts];

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
  }, [transformedProducts, selectedCategory, debouncedSearch]);

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

  const handleOrderClick = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setOrderSize("");
    setOrderModalOpen(true);
  };

  const handlePreOrderClick = (product) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setOrderSize("");
    setOrderModalOpen(true);
  };

  // Product details modal handlers
  const handleProductClick = (product) => {
    productDetailsModal.openModal(product);
  };

  const handleAddToCart = ({ product, size, quantity }) => {
    // TODO: Implement cart functionality
    console.log("Add to cart:", { product: product.name, size, quantity });
    // For now, just show a notification
    alert(
      `Added ${quantity}x ${product.name} (Size: ${size || "N/A"}) to cart!`
    );
  };

  const handleOrderNowFromModal = ({ product, size, quantity }) => {
    // Close product details modal
    productDetailsModal.closeModal();

    // Open order modal with selected product and size
    setSelectedProduct(product);
    setOrderQuantity(quantity);
    setOrderSize(size);
    setOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setOrderModalOpen(false);
    setSelectedProduct(null);
    setOrderQuantity(1);
    setOrderSize("");
  };

  const handleSubmitOrder = async () => {
    if (!selectedProduct) return;

    try {
      const orderData = {
        studentName: "Student Name", // TODO: Get from auth context
        studentEmail: "student@laverdad.edu.ph", // TODO: Get from auth context
        educationLevel: selectedProduct.educationLevel || "Not Specified",
        items: [
          {
            id: selectedProduct.id,
            name: selectedProduct.name,
            quantity: orderQuantity,
            size: orderSize || "N/A",
            price: 0, // FREE for students
          },
        ],
        totalAmount: 0, // FREE for students
      };

      console.log("Submitting order:", orderData);

      // Wait for order submission to complete and get the submitted order
      const result = await submitOrder(orderData);

      console.log("Order submitted successfully:", result);

      // Only show receipt if order was successfully submitted
      if (result) {
        setOrderModalOpen(false);
        setShowReceipt(true);
        console.log("Receipt display triggered");
      }
    } catch (err) {
      console.error("Failed to submit order:", err);
      alert(`Failed to submit order: ${err.message}`);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    resetOrder();
  };

  // Show receipt modal after successful order
  if (showReceipt) {
    // Show loading state while waiting for submittedOrder
    if (!submittedOrder) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2340] mx-auto mb-4"></div>
            <p className="text-gray-600">Generating your receipt...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <HeroSection />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-8">
          <div className="bg-white rounded-3xl shadow-md p-8">
            <OrderReceiptQRCode orderData={submittedOrder} />
            <div className="mt-6 text-center">
              <button
                onClick={handleCloseReceipt}
                className="px-6 py-3 bg-[#0C2340] text-white rounded-lg hover:bg-[#1e3a8a] transition-colors font-medium"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

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
            <div className="lg:col-span-9">
              {/* Results Info */}
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

              {/* Product Grid */}
              <ProductGrid
                products={paginatedItems}
                onOrderClick={handleOrderClick}
                onPreOrderClick={handlePreOrderClick}
                onProductClick={handleProductClick}
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
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {orderModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#003363] to-[#0C2340] p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Order Item
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Fill in the details below
                  </p>
                </div>
                <button
                  onClick={handleCloseOrderModal}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Product Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedProduct.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedProduct.description}
                </p>
                <p className="text-sm text-[#F28C28] font-bold mt-2">
                  FREE for Students ✨
                </p>
              </div>

              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={orderQuantity}
                  onChange={(e) =>
                    setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003363]"
                />
              </div>

              {/* Size (if applicable) */}
              {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                    value={orderSize}
                    onChange={(e) => setOrderSize(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003363]"
                  >
                    <option value="">Select Size</option>
                    {selectedProduct.sizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Error Message */}
              {orderError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{orderError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCloseOrderModal}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={orderLoading}
                  className="flex-1 px-4 py-3 bg-[#F28C28] text-white rounded-lg hover:bg-[#d97a1f] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orderLoading ? "Submitting..." : "Submit Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={productDetailsModal.isOpen}
        onClose={productDetailsModal.closeModal}
        product={productDetailsModal.selectedProduct}
        availableSizes={productDetailsModal.availableSizes}
        selectedSize={productDetailsModal.selectedSize}
        onSizeSelect={productDetailsModal.handleSizeSelect}
        sizeConfirmed={productDetailsModal.sizeConfirmed}
        quantity={productDetailsModal.quantity}
        onQuantityChange={productDetailsModal.handleQuantityChange}
        relatedProducts={productDetailsModal.relatedProducts}
        onProductSwitch={productDetailsModal.switchProduct}
        onAddToCart={handleAddToCart}
        onOrderNow={handleOrderNowFromModal}
        requiresSizeSelection={productDetailsModal.requiresSizeSelection}
      />
    </div>
  );
};

export default AllProducts;
