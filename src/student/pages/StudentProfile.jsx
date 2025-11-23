import React from "react";
import { ShoppingCart, Package, CheckCircle, Bell, Menu } from "lucide-react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import Footer from "../../components/common/Footer";
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
  // State for hamburger menu toggle
  const [isProfileVisible, setIsProfileVisible] = React.useState(true);

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
    currentPage,
    totalPages,
    handleTabChange,
    handleFilterChange,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  } = useActivityFeed();

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
      title = "Claimed Order";
      details = description;
    } else {
      title = description;
    }

    // Function to highlight keywords in text
    const highlightText = (text) => {
      if (!text) return null;

      const parts = [];
      let remainingText = text;

      // Keywords to highlight with their colors
      const keywords = [
        { text: productName, color: "text-[#003363]", bold: true },
        { text: educationLevel, color: "text-[#C5A572]", bold: true },
        { text: "School Uniform", color: "text-[#003363]", bold: true },
        { text: "Higher Education", color: "text-[#FF6B35]", bold: true },
        { text: "College", color: "text-[#C5A572]", bold: true },
        { text: "Senior High School", color: "text-[#C5A572]", bold: true },
        {
          text: "Basic Education Uniform",
          color: "text-[#003363]",
          bold: true,
        },
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
        {type === "claimed" && (
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

      {/* Hero Section - Fixed background */}
      <HeroSection />

      {/* Profile Card - Overlapping Hero Section (Left Side) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-80 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side - Profile Card overlapping Hero Section */}
          <div className="lg:col-span-1">
            <div className="relative -mt-12 lg:-mt-16">
              <div className="relative w-full">
                {/* BSIS Ribbon - Aligned with top of border */}
                <div className="absolute -left-2 top-0 z-20">
                  <div
                    className="bg-[#8B0000] text-white px-3 py-8 shadow-lg"
                    style={{
                      clipPath:
                        "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
                      width: "60px",
                    }}
                  >
                    <p className="text-xs font-bold text-center leading-tight transform -rotate-0">
                      BSIS
                    </p>
                  </div>
                </div>

                {/* Profile Card with Border - Styled like AllProducts container */}
                <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 pt-12 relative">
                  {/* Hamburger Menu Icon */}
                  <div className="absolute top-4 left-4">
                    <button
                      onClick={toggleProfileVisibility}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Menu className="w-5 h-5 text-[#003363]" />
                    </button>
                  </div>

                  {/* Profile Content - Conditionally Rendered */}
                  {isProfileVisible && (
                    <>
                      {profileLoading ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003363]"></div>
                        </div>
                      ) : profileError ? (
                        <div className="text-center text-red-600 py-8">
                          <p>Failed to load profile</p>
                        </div>
                      ) : (
                        <>
                          {/* Profile Image - Larger with thick border */}
                          <div className="flex justify-center mb-6">
                            <div className="relative">
                              {profileData?.photoURL ? (
                                <img
                                  src={profileData.photoURL}
                                  alt={profileData.name}
                                  className="w-40 h-40 rounded-full border-[6px] border-[#C5A572] object-cover shadow-xl"
                                />
                              ) : (
                                <div className="w-40 h-40 rounded-full border-[6px] border-[#C5A572] bg-[#003363] flex items-center justify-center shadow-xl">
                                  <span className="text-5xl font-bold text-white">
                                    {profileData?.name
                                      ?.charAt(0)
                                      .toUpperCase() || "S"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Profile Information - Enhanced Typography */}
                          <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">
                              <span className="text-[#003363]">
                                {profileData?.name?.split(" ")[0] || "John"}
                              </span>{" "}
                              <span className="text-[#C5A572]">
                                {profileData?.name
                                  ?.split(" ")
                                  .slice(1)
                                  .join(" ") || "Doe"}
                              </span>
                            </h2>
                            <p className="text-gray-700 text-sm font-medium mb-1">
                              {profileData?.courseYearLevel ||
                                "BS in Information Systems, 4th year"}
                            </p>
                            <p className="text-[#C5A572] text-sm font-semibold">
                              {profileData?.role || "Student"}
                            </p>
                          </div>

                          {/* Student Details */}
                          <div className="space-y-4 mb-8">
                            <div>
                              <p className="text-sm font-bold text-[#C5A572] mb-1">
                                Student Number:
                              </p>
                              <p className="text-gray-800 font-medium">
                                {profileData?.studentNumber || "22-1234ABC"}
                              </p>
                            </div>

                            <div>
                              <p className="text-sm font-bold text-[#C5A572] mb-1">
                                Email Address:
                              </p>
                              <p className="text-gray-800 text-sm break-all">
                                {profileData?.email ||
                                  "johndoe@student.laverdad.edu.ph"}
                              </p>
                            </div>
                          </div>

                          {/* Edit Profile Button */}
                          <button className="w-full bg-[#003363] text-white py-3 rounded-lg font-semibold hover:bg-[#002347] transition-colors shadow-md">
                            Edit Profile
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Activity Feed (No Border) */}
          <div className="lg:col-span-3">
            {/* Activity Content Area - No border, no rounded corners, no background */}
            <div className="p-8">
              {/* Tabs Bar - Aligned with Activity Content */}
              <div className="mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {[
                      { key: "activities", label: "Activities", icon: Bell },
                      { key: "orders", label: "Orders", icon: ShoppingCart },
                      { key: "history", label: "History", icon: Package },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`relative flex items-center space-x-2 px-6 py-3 font-semibold text-sm transition-all rounded-lg overflow-hidden ${
                          activeTab === tab.key
                            ? "bg-[#003363] text-white"
                            : "bg-transparent text-gray-600 hover:text-[#003363] hover:bg-gray-100"
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {/* Orange underline for active tab - contained within button */}
                        {activeTab === tab.key && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF6B35]"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C5A572] focus:border-transparent cursor-pointer"
                    >
                      <option value="all">Show All</option>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Activity List */}
              <div className="space-y-6 min-h-[500px]">
                {activitiesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003363]"></div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center text-gray-500 py-16">
                    <p>No activities found</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-5 pb-6 border-b border-gray-100 last:border-b-0"
                    >
                      {/* Activity Icon - Larger */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shadow-sm">
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* Activity Details */}
                      {renderActivityContent(activity)}
                    </div>
                  ))
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
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default StudentProfile;
