import React from "react";
import { Menu } from "lucide-react";

/**
 * ProfileCard Component
 * 
 * A reusable profile card component that displays student information
 * with toggle functionality and sticky positioning.
 * 
 * @param {Object} props
 * @param {Object} props.profileData - Student profile data
 * @param {boolean} props.profileLoading - Loading state
 * @param {Error} props.profileError - Error state
 * @param {boolean} props.isProfileVisible - Visibility state
 * @param {Function} props.toggleProfileVisibility - Toggle function
 */
const ProfileCard = ({
  profileData,
  profileLoading,
  profileError,
  isProfileVisible,
  toggleProfileVisibility,
}) => {
  return (
    <div className="lg:col-span-1">
      {/* Profile card container */}
      <div className="-mt-12 lg:-mt-16">
        {/* Hamburger Menu Icon - Positioned to the left with no gap */}
        <div className="absolute -left-1 top-12 z-40">
          <button
            onClick={toggleProfileVisibility}
            className="p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors shadow-md border-2 border-gray-200"
          >
            <Menu className="w-6 h-6 text-[#003363]" />
          </button>
        </div>

        <div className="relative w-full">
          {/* BSIS Ribbon - Only visible when profile is expanded */}
          {isProfileVisible && (
            <div className="absolute top-0 z-20">
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
          )}

          {/* Profile Card - Conditional styling based on visibility */}
          <div
            className={`relative transition-all duration-300 ${
              isProfileVisible
                ? "bg-white rounded-2xl border-2 border-gray-200 shadow-lg p-8 pt-12"
                : "bg-transparent p-0"
            }`}
          >
            {/* Profile Content */}
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
                {/* Profile Image - Always visible */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {profileData?.photoURL ? (
                      <img
                        src={profileData.photoURL}
                        alt={profileData.name}
                        className="w-40 h-40 rounded-full border-[6px] border-[#FF6B35] object-cover shadow-xl"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-full border-[6px] border-[#FF6B35] bg-[#003363] flex items-center justify-center shadow-xl">
                        <span className="text-5xl font-bold text-white">
                          {profileData?.name?.charAt(0).toUpperCase() || "S"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Details - Only visible when expanded */}
                {isProfileVisible && (
                  <>
                    {/* Profile Information - Enhanced Typography */}
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold mb-2">
                        <span className="text-[#003363]">
                          {profileData?.name?.split(" ")[0] || "John"}
                        </span>{" "}
                        <span className="text-[#C5A572]">
                          {profileData?.name?.split(" ").slice(1).join(" ") ||
                            "Doe"}
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
  );
};

export default ProfileCard;

