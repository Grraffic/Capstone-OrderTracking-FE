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
    <div className="p-8">
      {/* Page Title */}
      <div className="mb-8">
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Settings Content Card */}
      <div className="max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        {/* Profile Section */}
        <div className="mb-8">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />

          {/* Profile Image */}
          <div className="flex items-center gap-6 mb-6">
            <SkeletonImage
              width="w-32"
              height="h-32"
              variant="circle"
              className="flex-shrink-0"
            />
            <div className="flex-1">
              <SkeletonText lines={2} width="3/4" gap="gap-3" />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-8">
          <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-6" />

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Email Field */}
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>

            {/* Role Field (if applicable) */}
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SettingsSkeleton;
