import React from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Package, CheckCircle, Bell, ChevronLeft } from "lucide-react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import ProfileCard from "../components/common/ProfileCard";
import MyOrders from "../components/Orders/MyOrders";
import { useStudentProfile, useActivityFeed } from "../hooks";

/**
 * StudentProfile Component - Redesigned to match target UI
 *
 * Features:
 * - Profile card with BSIS ribbon and larger profile picture
 * - Building background with "User Profile" overlay text
 * - Horizontal blue tab bar (Activities, Orders, History)
 * - Enhanced activity styling with highlighted keywords
 * - View Details button for claimed orders
 * - Styled pagination with Back/Next buttons
 */
const StudentProfile = () => {
  const navigate = useNavigate();

  // State for hamburger menu toggle
  const [isProfileVisible, setIsProfileVisible] = React.useState(true);

  // Refs and state for dynamic underline widths
  const tabRefs = React.useRef({});
  const [underlineWidths, setUnderlineWidths] = React.useState({});
  const [hoveredTab, setHoveredTab] = React.useState(null);

  // Fetch profile data
  const {
    profileData,
    loading: profileLoading,
    error: profileError,
  } = useStudentProfile();

  // Fetch activity feed data
  const {
    activities,
    loading: activitiesLoading,
    activeTab,
    filter,
    handleTabChange,
    handleFilterChange,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = useActivityFeed();

  // Update underline widths when tabs change
  React.useEffect(() => {
    const tabs = ['activities', 'orders', 'history'];
    const newWidths = {};
    tabs.forEach((tab) => {
      if (tabRefs.current[tab]) {
        newWidths[tab] = tabRefs.current[tab].offsetWidth;
      }
    });
    setUnderlineWidths(newWidths);
  }, [activeTab]);

  // Toggle profile visibility
  const toggleProfileVisibility = () => {
    setIsProfileVisible(!isProfileVisible);
  };

  // Helper function to get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case "cart_add":
        return <ShoppingCart className="w-6 h-6 text-[#003363]" />;
      case "checkout":
        return <Package className="w-6 h-6 text-[#003363]" />;
      case "claimed":
        return <CheckCircle className="w-6 h-6 text-[#22c55e]" />;
      case "order_released":
        return <CheckCircle className="w-6 h-6 text-[#22c55e]" />;
      default:
        return <ShoppingCart className="w-6 h-6 text-[#003363]" />;
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  };

  // Enhanced helper function to render activity title and description with highlights
  const renderActivityContent = (activity) => {
    const { type, description, productName, educationLevel, orderId } =
      activity;
    
    // Debug logging for order_released activities
    if (type === "order_released" || type === "claimed") {
      console.log(`🎨 StudentProfile: Rendering ${type} activity:`, {
        type,
        orderId: activity.orderId,
        orderNumber: activity.orderNumber,
        itemCount: activity.itemCount,
        hasDescription: !!description,
        descriptionLength: description?.length || 0
      });
    }

    // Parse the description to create title and detail parts
    let title = "";
    let details = "";

    if (type === "checkout") {
      title = "You Checked-out a product";
      details = description;
    } else if (type === "cart_add") {
      title = "Product added to cart";
      details = description;
    } else if (type === "claimed") {
      title = "Order Claimed Successfully";
      details = description;
    } else if (type === "order_released") {
      title = "Order Claimed Successfully";
      // Format the description to be more user-friendly with robust fallback handling
      if (description && description.trim()) {
        details = description;
      } else {
        // Build description from available data
        const orderNum = activity.orderNumber || orderId || null;
        const itemCount = activity.itemCount || (Array.isArray(activity.items) ? activity.items.length : 0) || 1;
        const itemText = itemCount === 1 ? "item" : "items";
        
        if (orderNum) {
          details = `Your order #${orderNum} with ${itemCount} ${itemText} has been successfully claimed.`;
        } else {
          details = `Your order with ${itemCount} ${itemText} has been successfully claimed.`;
        }
      }
    } else {
      title = description;
    }

    // Function to highlight keywords in text
    const highlightText = (text) => {
      if (!text) return null;

      const parts = [];

      // Keywords to highlight with their colors
      const keywords = [
        { text: productName, color: "text-[#003363]", bold: true },
        { text: educationLevel, color: "text-[#C5A572]", bold: true },
        { text: "School Uniform", color: "text-[#003363]", bold: true },
        { text: "Higher Education", color: "text-[#FF6B35]", bold: true },
        { text: "College", color: "text-[#C5A572]", bold: true },
        { text: "Senior High School", color: "text-[#C5A572]", bold: true },
        { text: "Junior High School", color: "text-[#C5A572]", bold: true },
        {
          text: "Basic Education Uniform",
          color: "text-[#003363]",
          bold: true,
        },
        // Highlight order numbers (format: #ORD-...)
        ...(activity.orderNumber ? [{ 
          text: `#${activity.orderNumber}`, 
          color: "text-[#F28C28]", 
          bold: true 
        }] : []),
        // Highlight "successfully claimed" text
        { text: "successfully claimed", color: "text-[#22c55e]", bold: true },
        { text: "has been released", color: "text-[#22c55e]", bold: true },
      ];

      // Build highlighted text
      let lastIndex = 0;
      keywords.forEach((keyword) => {
        if (keyword.text && text.includes(keyword.text)) {
          const index = text.indexOf(keyword.text, lastIndex);
          if (index >= lastIndex) {
            // Add text before keyword
            if (index > lastIndex) {
              parts.push(
                <span key={`text-${lastIndex}`}>
                  {text.substring(lastIndex, index)}
                </span>
              );
            }
            // Add highlighted keyword
            parts.push(
              <span
                key={`keyword-${index}`}
                className={`${keyword.color} ${
                  keyword.bold ? "font-bold" : ""
                }`}
              >
                {keyword.text}
              </span>
            );
            lastIndex = index + keyword.text.length;
          }
        }
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(
          <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
        );
      }

      return parts.length > 0 ? parts : text;
    };

    return (
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-[#003363] mb-1">{title}</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {highlightText(details)}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {getRelativeTime(activity.timestamp)}
        </p>
        {(type === "claimed" || type === "order_released") && (
          <button className="mt-3 px-4 py-1.5 border-2 border-[#003363] text-[#003363] rounded-full text-sm font-medium hover:bg-[#003363] hover:text-white transition-colors">
            View Details
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section – "User Profile" at bottom-right */}
      <HeroSection heading="User Profile" align="bottom-right" />

      {/* Profile Card – left; Activity – right (side-by-side from tablet 768px) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Left Side - Profile Card */}
          <ProfileCard
            profileData={profileData}
            profileLoading={profileLoading}
            profileError={profileError}
            isProfileVisible={isProfileVisible}
            toggleProfileVisibility={toggleProfileVisibility}
          />

          {/* Right Side - Activity Feed */}
          <div className="md:col-span-3 min-w-0">
            {/* Single Background Container for Tabs + Activities */}
            <div className="bg-gray-50 rounded-xl px-3 sm:px-4 md:px-6 lg:px-8 min-h-[400px] sm:min-h-[450px] md:min-h-[500px]">
              {/* Tabs Bar - Back button left, Activities/Orders/History centered, filter right */}
              <div className="pb-4 mb-4 border-b border-gray-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-nowrap sm:gap-2 md:gap-5 lg:gap-6">
                  {/* Back button - left side */}
                  <button
                    type="button"
                    onClick={() => navigate("/all-products")}
                    aria-label="Browse all products"
                    className="flex-shrink-0 flex items-center justify-center gap-2 rounded-full border-2 border-[#003363] text-[#003363] hover:bg-[#003363] hover:text-white px-3 py-1.5 sm:px-1.5 sm:py-1.5 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm font-medium sm:hidden">Browse all products</span>
                  </button>

                  {/* Tabs: [Activities] [Orders] [History] - centered */}
                  <div className="flex items-stretch gap-0 min-w-0 overflow-x-auto overflow-y-hidden sm:overflow-visible flex-1 justify-center">
                    {[
                      { key: "activities", label: "Activities", icon: Bell },
                      { key: "orders", label: "Orders", icon: ShoppingCart },
                      { key: "history", label: "History", icon: Package },
                    ].map((tab) => {
                      const isActive = activeTab === tab.key;
                      const isHovered = hoveredTab === tab.key;
                      const showUnderline = isActive || isHovered;

                      return (
                        <button
                          key={tab.key}
                          onClick={() => handleTabChange(tab.key)}
                          onMouseEnter={() => setHoveredTab(tab.key)}
                          onMouseLeave={() => setHoveredTab(null)}
                          className={`relative flex flex-col items-center justify-center px-3 sm:px-4 md:px-5 lg:px-8 py-3 sm:py-4 md:py-4 lg:py-5 font-semibold text-xs sm:text-sm transition-all whitespace-nowrap rounded-t-lg flex-shrink-0 ${
                            isActive
                              ? "bg-[#003363] text-white"
                              : "bg-transparent text-gray-600 hover:bg-[#0C2340] hover:text-white"
                          }`}
                        >
                          <div
                            ref={(el) => (tabRefs.current[tab.key] = el)}
                            className="flex items-center space-x-1.5 sm:space-x-2"
                            style={{ pointerEvents: "none" }}
                          >
                            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="inline-block">{tab.label}</span>
                          </div>
                          {showUnderline && (
                            <span
                              className="block mt-1 sm:mt-1.5 h-0.5 sm:h-1 bg-[#E68B00] rounded-full transition-all"
                              style={{ width: underlineWidths[tab.key] || 0 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Filter - right side, compact */}
                  <div className="flex-shrink-0 flex justify-end min-w-0 order-last sm:order-none">
                    {(activeTab === "activities" || activeTab === "orders" || activeTab === "history") && (
                      <div className="relative z-10 w-full sm:w-auto sm:min-w-0 md:w-[5rem] md:min-w-0">
                        <select
                          value={filter}
                          onChange={(e) => handleFilterChange(e.target.value)}
                          className="w-full sm:w-auto min-w-0 px-2 sm:px-2 md:px-2 py-2 bg-white border-2 border-gray-200 rounded-lg text-xs sm:text-xs md:text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C5A572] focus:border-transparent cursor-pointer"
                          aria-label="Sort activities"
                        >
                          <option value="all">Show All</option>
                          <option value="newest">Newest</option>
                          <option value="oldest">Oldest</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity List */}
              {activeTab === "activities" && (
                <>
                  <div className="space-y-4">
                    {activitiesLoading ? (
                      // Skeleton loader for activities
                      <>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 sm:gap-5 pb-4 border-b border-gray-200 last:border-b-0 animate-pulse"
                          >
                            {/* Icon skeleton */}
                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full"></div>
                            {/* Content skeleton */}
                            <div className="flex-1 min-w-0">
                              <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
                              <div className="h-4 bg-gray-200 rounded mb-1 w-full"></div>
                              <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                              <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : activities.length === 0 ? (
                      <div className="text-center text-gray-500 py-16">
                        <p>No activities found</p>
                      </div>
                    ) : (
                      (() => {
                        // Debug logging for activities display
                        const orderReleasedActivities = activities.filter(a => a.type === 'order_released' || a.type === 'claimed');
                        if (orderReleasedActivities.length > 0) {
                          console.log(`🎨 StudentProfile: Rendering ${activities.length} activities, including ${orderReleasedActivities.length} claimed/released orders`);
                          orderReleasedActivities.forEach(a => {
                            console.log(`🎨 StudentProfile: Order activity:`, {
                              type: a.type,
                              orderNumber: a.orderNumber,
                              orderId: a.orderId,
                              hasDescription: !!a.description
                            });
                          });
                        }
                        return activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 sm:gap-5 pb-4 border-b border-gray-200 last:border-b-0"
                        >
                          {/* Activity Icon - Larger */}
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                            {getActivityIcon(activity.type)}
                          </div>

                          {/* Activity Details */}
                          {renderActivityContent(activity)}
                        </div>
                      ));
                      })()
                    )}
                  </div>

                  {/* Pagination Controls - Back/Next Buttons Only, Right Aligned */}
                  {!activitiesLoading && activities.length > 0 && (
                    <div className="flex items-center justify-end mt-8 pt-6 border-t border-gray-200">
                      <div className="flex space-x-3">
                        <button
                          onClick={prevPage}
                          disabled={!canGoPrev}
                          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            canGoPrev
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Back
                        </button>

                        <button
                          onClick={nextPage}
                          disabled={!canGoNext}
                          className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                            canGoNext
                              ? "bg-[#003363] text-white hover:bg-[#002347] shadow-md"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* My Orders View */}
              {activeTab === "orders" && (
                <div className="py-2 sm:py-3 md:py-4 lg:py-6">
                  <MyOrders sortOrder={filter} />
                </div>
              )}

              {/* History View - Claimed orders (Order History) */}
              {activeTab === "history" && (
                <div className="py-2 sm:py-3 md:py-4 lg:py-6">
                  <MyOrders sortOrder={filter} variant="history" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentProfile;
