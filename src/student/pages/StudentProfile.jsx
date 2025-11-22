import React from "react";
import {
  ShoppingCart,
  Package,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import HeroSection from "../components/common/HeroSection";
import Footer from "../../components/common/Footer";
import { useStudentProfile, useActivityFeed } from "../hooks";

/**
 * StudentProfile Component
 *
 * Modern and professional student profile page with:
 * - Left side: Profile card with student information
 * - Right side: Activity feed with tabs, filters, and pagination
 * - Fully responsive design (mobile, tablet, desktop)
 *
 * All business logic is extracted to custom hooks.
 */
const StudentProfile = () => {
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

  // Helper function to get activity icon
  const getActivityIcon = (type) => {
    switch (type) {
      case "cart_add":
        return <ShoppingCart className="w-5 h-5 text-[#003363]" />;
      case "checkout":
        return <Package className="w-5 h-5 text-[#003363]" />;
      case "claimed":
        return <CheckCircle className="w-5 h-5 text-[#22c55e]" />;
      default:
        return <ShoppingCart className="w-5 h-5 text-[#003363]" />;
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

  // Helper function to highlight keywords in activity description
  const highlightDescription = (description, productName, educationLevel) => {
    if (!productName) return description;

    const parts = description.split(productName);
    return (
      <>
        {parts[0]}
        <span className="font-semibold text-[#003363]">{productName}</span>
        {parts[1] && educationLevel && (
          <>
            {parts[1].split(educationLevel)[0]}
            <span className="font-semibold text-[#C5A572]">
              {educationLevel}
            </span>
            {parts[1].split(educationLevel)[1]}
          </>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section - Fixed background */}
      <HeroSection />

      {/* Main Content - Scrollable content that overlaps hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 relative z-10 pb-8">
        {/* Main Container - Solid white background */}
        <div className="bg-white rounded-3xl shadow-gray-800 shadow-md p-6 md:p-8 lg:p-10">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="text-[#003363]">User </span>
              <span className="text-[#C5A572]">Profile</span>
            </h1>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6">
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
                    {/* Profile Image */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        {profileData?.photoURL ? (
                          <img
                            src={profileData.photoURL}
                            alt={profileData.name}
                            className="w-32 h-32 rounded-full border-4 border-[#C5A572] object-cover"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full border-4 border-[#C5A572] bg-[#003363] flex items-center justify-center">
                            <span className="text-4xl font-bold text-white">
                              {profileData?.name?.charAt(0).toUpperCase() ||
                                "S"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-[#003363] mb-1">
                        {profileData?.name || "Student"}
                      </h2>
                      <p className="text-gray-600 text-sm mb-2">
                        {profileData?.courseYearLevel ||
                          "Course & Year Level not set"}
                      </p>
                      {profileData?.educationLevel && (
                        <p className="text-xs text-[#C5A572] font-semibold">
                          {profileData.educationLevel}
                        </p>
                      )}
                    </div>

                    {/* Student Details */}
                    <div className="space-y-4 border-t border-gray-200 pt-4">
                      <div>
                        <p className="text-sm font-semibold text-[#C5A572] mb-1">
                          Student Number:
                        </p>
                        <p className="text-gray-800">
                          {profileData?.studentNumber || "Not set"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#C5A572] mb-1">
                          Email Address:
                        </p>
                        <p className="text-gray-800 text-sm break-all">
                          {profileData?.email || "N/A"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Activity Feed Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md p-6">
                {/* Navigation Tabs */}
                <div className="flex items-center justify-between mb-6 border-b border-gray-200">
                  <div className="flex space-x-8">
                    {["activities", "orders", "history"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`pb-3 px-2 font-semibold text-sm transition-colors relative ${
                          activeTab === tab
                            ? "text-[#003363]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#003363]"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={filter}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003363] focus:border-transparent"
                    >
                      <option value="all">Show All</option>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </select>
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-4 min-h-[400px]">
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
                        className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {/* Activity Icon */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>

                        {/* Activity Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">
                            {highlightDescription(
                              activity.description,
                              activity.productName,
                              activity.educationLevel
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination Controls */}
                {!activitiesLoading && activities.length > 0 && (
                  <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={prevPage}
                        disabled={!canGoPrev}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          canGoPrev
                            ? "bg-[#003363] text-white hover:bg-[#002347]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextPage}
                        disabled={!canGoNext}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          canGoNext
                            ? "bg-[#003363] text-white hover:bg-[#002347]"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudentProfile;
