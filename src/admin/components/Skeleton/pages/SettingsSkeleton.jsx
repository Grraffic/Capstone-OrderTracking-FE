import React from "react";
import SkeletonImage from "../base/SkeletonImage";
import SkeletonText from "../base/SkeletonText";

/**
 * SettingsSkeleton Component
 *
 * Loading skeleton for the Settings page.
 * Matches the layout with:
 * - Page title
 * - Profile image upload section
 * - Form fields
 * - Action buttons
 */
const SettingsSkeleton = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Page Title */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="h-8 sm:h-10 w-32 sm:w-40 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Settings Content Card */}
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
        {/* Profile Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="h-5 sm:h-6 w-36 sm:w-48 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6" />

          {/* Profile Image */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <SkeletonImage
              width="w-24 sm:w-32"
              height=""
              variant="circle"
              className="flex-shrink-0"
            />
            <div className="flex-1 w-full sm:w-auto">
              <SkeletonText lines={2} width="3/4" gap="gap-2 sm:gap-3" />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="h-5 sm:h-6 w-40 sm:w-56 bg-gray-200 rounded animate-pulse mb-4 sm:mb-6" />

          {/* Form Fields */}
          <div className="space-y-4 sm:space-y-6">
            {/* Name Field */}
            <div>
              <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 sm:h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Email Field */}
            <div>
              <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 sm:h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Role Field (if applicable) */}
            <div>
              <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 sm:h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="h-10 w-full sm:w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-full sm:w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;
