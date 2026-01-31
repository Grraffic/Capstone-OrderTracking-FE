import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { splitDisplayName } from "../../../utils/displayName";

/**
 * SystemAdminHeader Component
 *
 * Displays the top header of the system admin dashboard with:
 * - Menu toggle button for sidebar
 * - "System Admin" title
 * - User profile section (responsive)
 *
 * Props:
 * - onMenuToggle: Function to toggle sidebar
 * - sidebarOpen: Boolean indicating if sidebar is open
 */

const SystemAdminHeader = ({ onMenuToggle, sidebarOpen = true }) => {
  const { user } = useAuth();
  const [imageLoadError, setImageLoadError] = useState(false);

  const rawName = user?.displayName || user?.name || "";
  const displayName = rawName ? splitDisplayName(rawName).displayName : "System Admin";
  const userEmail = user?.email || "";
  const userAvatar = user?.photoURL || null;
  const avatarInitial = (rawName ? splitDisplayName(rawName).displayName : "S").charAt(0).toUpperCase() || "S";

  // Reset image load error when user photo URL changes
  useEffect(() => {
    setImageLoadError(false);
  }, [user?.photoURL]);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between z-40 transition-all duration-300 ${
        sidebarOpen ? "left-64" : "left-20"
      }`}
    >
      {/* Left side - Menu toggle and department name */}
      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} className="text-[#0C2340]" />
        </button>

        <h2 className="text-base sm:text-lg font-semibold text-[#0C2340] truncate max-w-[120px] sm:max-w-none">
          System Admin
        </h2>
      </div>

      {/* Right side - User profile */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* User profile section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hide name/email on small screens */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-[#0C2340]">
              {displayName}
            </span>
            {userEmail && (
              <span className="text-xs text-gray-500">{userEmail}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {userAvatar && !imageLoadError ? (
              <img
                src={userAvatar}
                alt={displayName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#e68b00]"
                onError={() => setImageLoadError(true)}
              />
            ) : (
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#003363] flex items-center justify-center border-2 border-[#e68b00] text-white text-sm font-semibold shrink-0"
                aria-label={displayName}
              >
                {avatarInitial}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SystemAdminHeader;




