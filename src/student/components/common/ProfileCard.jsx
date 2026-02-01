import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { getCourseBannerStyle } from "../../utils/courseBanner";

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
  const navigate = useNavigate();
  const courseLevel = profileData?.courseYearLevel;
  const bannerStyle = getCourseBannerStyle(courseLevel);

  return (
    <div className="lg:col-span-1">
      {/* Profile card container - overlaps hero section slightly */}
      <div className="-mt-8 lg:-mt-10">
        {/* Hamburger Menu Icon – original position with margin-top for banner clearance */}
        <div className="absolute left-1 top-20 mt-4 z-40 lg:mt-6">
          <button
            onClick={toggleProfileVisibility}
            className="p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors shadow-md border-2 border-gray-200"
          >
            <Menu className="w-6 h-6 text-[#003363]" />
          </button>
        </div>

        <div className="relative w-full">
          {/* Course ribbon: BSIS=red, BAB=blue, BSA/BSAIS=yellow, BSSW=violet */}
          {isProfileVisible && bannerStyle.label && (
            <div className="absolute top-0 z-20">
              <div
                className={`${bannerStyle.bg} ${bannerStyle.text} px-3 py-8 shadow-lg flex flex-col items-center justify-start gap-1`}
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
                  width: "60px",
                }}
              >
                <img
                  src={bannerStyle.logo || "/assets/image/LV Logo.png"}
                  alt={bannerStyle.label}
                  className="w-10 h-10 object-contain shrink-0"
                />
                {bannerStyle.label === "Kindergarten" ? (
                  <p className="text-[10px] font-bold text-center leading-tight flex flex-col items-center gap-0">
                    <span>Kinder</span>
                    <span>garten</span>
                  </p>
                ) : bannerStyle.label === "Prekindergarten" ? (
                  <p className="text-[10px] font-bold text-center leading-tight flex flex-col items-center gap-0">
                    <span>Pre-</span>
                    <span>Kinder</span>
                  </p>
                ) : (
                  <p
                    className={`font-bold text-center leading-tight ${
                      bannerStyle.label === "Kinder" ? "text-[10px]" : "text-xs"
                    }`}
                  >
                    {bannerStyle.label}
                  </p>
                )}
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
              <div className="animate-pulse">
                {/* Profile Image skeleton */}
                <div className="flex justify-center mb-6">
                  <div className="w-40 h-40 rounded-full bg-gray-200 border-[6px] border-gray-300"></div>
                </div>
                {/* Profile Details skeleton */}
                {isProfileVisible && (
                  <>
                    <div className="text-center mb-8">
                      <div className="h-8 bg-gray-200 rounded mb-2 w-3/4 mx-auto"></div>
                      <div className="h-5 bg-gray-200 rounded mb-1 w-2/3 mx-auto"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/3 mx-auto"></div>
                    </div>
                    <div className="space-y-4 mb-8">
                      <div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                        <div className="h-5 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-lg"></div>
                  </>
                )}
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
                        <span className="text-[#E68B00]">
                          {profileData?.name?.split(" ").slice(1).join(" ") ||
                            "Doe"}
                        </span>
                      </h2>
                      <p className="text-gray-700 text-sm font-medium mb-1">
                        {profileData?.courseYearLevel ||
                          "BS in Information Systems, 4th year"}
                      </p>
                      <p className="text-[#E68B00] text-sm font-semibold">
                        {profileData?.role || "Student"}
                      </p>
                    </div>

                    {/* Student Details */}
                    <div className="space-y-4 mb-8">
                      <div>
                        <p className="text-sm font-bold text-[#E68B00] mb-1">
                          Student Number:
                        </p>
                        <p className="text-gray-800 font-medium">
                          {profileData?.studentNumber || "22-1234ABC"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#E68B00] mb-1">
                          Email Address:
                        </p>
                        <p className="text-gray-800 text-sm break-all">
                          {profileData?.email ||
                            "johndoe@student.laverdad.edu.ph"}
                        </p>
                      </div>
                    </div>

                    {/* View Profile Button */}
                    <button
                      type="button"
                      onClick={() => navigate("/student/settings")}
                      className="w-full bg-[#003363] text-white py-3 rounded-lg font-semibold hover:bg-[#002347] transition-colors shadow-md"
                    >
                    Profile Details
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

