import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  Home,
  Users,
  GraduationCap,
  FileCheck,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserCog,
  Archive,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

/**
 * System Admin Sidebar Component
 *
 * Collapsible sidebar with navigation items for System Admin
 * Props:
 *   - isOpen: boolean - whether sidebar is expanded or collapsed
 *   - onNavigate: function - callback function (optional, for future use)
 */
const Sidebar = ({ isOpen = true, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Auto-close sidebar on mobile/tablet when route changes
  useEffect(() => {
    const MOBILE_BREAKPOINT = 1024; // px (matches Tailwind's lg breakpoint)
    
    // Close sidebar on mobile/tablet when navigating to a new route
    if (window.innerWidth < MOBILE_BREAKPOINT && isOpen && onNavigate) {
      onNavigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Close sidebar whenever the route changes on mobile/tablet

  // User Management dropdown sub-items (order: List of Employees, List of Students, Archive Users)
  const userManagementPaths = ["/system-admin/users", "/system-admin/students", "/system-admin/archive-users"];
  const isUserManagementActive = userManagementPaths.some((path) =>
    location.pathname === path || location.pathname.startsWith(path + "/")
  );
  const [userDropdownOpen, setUserDropdownOpen] = useState(isUserManagementActive);
  const [collapsedFlyoutOpen, setCollapsedFlyoutOpen] = useState(false);
  const collapsedFlyoutRef = useRef(null);

  // Keep dropdown open when on a user management sub-route
  useEffect(() => {
    if (isUserManagementActive) {
      setUserDropdownOpen(true);
    }
  }, [isUserManagementActive]);

  // Close collapsed flyout when clicking outside or when sidebar opens
  useEffect(() => {
    if (isOpen) setCollapsedFlyoutOpen(false);
  }, [isOpen]);
  useEffect(() => {
    if (!collapsedFlyoutOpen) return;
    const handleClickOutside = (e) => {
      if (
        collapsedFlyoutRef.current &&
        !collapsedFlyoutRef.current.contains(e.target)
      ) {
        setCollapsedFlyoutOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsedFlyoutOpen]);

  const userManagementSubItems = [
    { to: "/system-admin/users", label: "List of Employees", icon: UserCog },
    { to: "/system-admin/students", label: "List of Students", icon: GraduationCap },
    { to: "/system-admin/archive-users", label: "Archive Users", icon: Archive },
  ];

  const navItems = [
    { to: "/system-admin", label: "Home", icon: Home },
    { to: "/system-admin/eligibility", label: "Eligibility Management", icon: FileCheck },
    { to: "/system-admin/settings", label: "System Settings", icon: Settings },
  ];

  // Handle logout (called after confirmation)
  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const navItem = (to, label, Icon, isExact = false) => (
    <div
      onClick={(e) => {
        // Prevent any click on nav items from opening the sidebar
        // Sidebar should only be controlled by the menu button in header
        e.stopPropagation();
      }}
    >
      <NavLink
        to={to}
        end={isExact}
        onClick={(e) => {
          // Prevent navigation items from opening the sidebar
          // Only the menu button in header should toggle sidebar
          e.stopPropagation();
          // Ensure sidebar stays in its current state (closed if closed, open if open)
          // Do not change sidebar state on navigation
        }}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 text-sm font-medium transition-none ${
            isActive
              ? isOpen
                ? "bg-[#0C2340] text-white py-4 pl-8 pr-3 -ml-4 mr-8 rounded-r-full"
                : "bg-[#0C2340] text-white py-4 px-4 rounded-lg justify-center"
              : isOpen
              ? "text-[#0C2340] hover:bg-[#f3f6fb] px-4 py-3 rounded-lg"
              : "text-[#0C2340] hover:bg-[#f3f6fb] px-4 py-3 rounded-lg justify-center"
          }`
        }
        title={!isOpen ? label : ""}
      >
        <Icon size={20} className="flex-shrink-0" />
        {isOpen && <span>{label}</span>}

        {/* Tooltip for collapsed state */}
        {!isOpen && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-[#0C2340] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            {label}
          </div>
        )}
      </NavLink>
    </div>
  );

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 transform transition-all">
            <p className="text-gray-600 text-center mb-8">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => {
            // Close sidebar when clicking backdrop on mobile
            if (window.innerWidth < 1024 && onNavigate) {
              onNavigate();
            }
          }}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 bottom-0 bg-white border-r border-gray-100 p-4 flex flex-col transition-all duration-300 z-30 shadow-lg ${
          isOpen ? "w-64" : "w-20"
        }`}
        style={{
          // Ensure sidebar is always visible and can be interacted with
          pointerEvents: 'auto',
        }}
      >
      {/* Logo Section */}
      <div
        className={`h-16 flex items-center mb-8 px-3 transition-all duration-300 ${
          isOpen ? "" : "justify-center"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src="/assets/image/LV Logo.png"
            alt="La Verdad Logo"
            className="w-12 h-12 rounded-lg flex-shrink-0 object-cover"
          />
          {isOpen && (
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-[#003363]">
                La Verdad
              </h2>
              <p className="text-lg text-gray-500">OrderHub</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {/* Home */}
        <div>{navItem("/system-admin", "Home", Home, true)}</div>

        {/* User Management with dropdown */}
        <div
          ref={collapsedFlyoutRef}
          onClick={(e) => e.stopPropagation()}
          className={`relative ${userDropdownOpen && isOpen ? "rounded-r-full -ml-4 mr-2 py-1 pr-3 pl-4" : ""} ${!isOpen ? "flex justify-center" : ""}`}
        >
          <button
            type="button"
            onClick={() => {
              if (isOpen) {
                setUserDropdownOpen(true);
                navigate("/system-admin/users");
              } else {
                navigate("/system-admin/users");
                setCollapsedFlyoutOpen((prev) => !prev);
              }
            }}
            className={`group relative flex w-full items-center gap-3 text-sm font-medium min-h-[44px] ${
              !isOpen ? "justify-center min-w-[44px] rounded-lg" : ""
            } ${
              (isUserManagementActive || userDropdownOpen || (collapsedFlyoutOpen && !isOpen))
                ? isOpen
                  ? "bg-[#0C2340] text-white py-4 pl-8 pr-3 -ml-4 mr-2 rounded-r-full"
                  : "bg-[#0C2340] text-white py-4 px-4 rounded-lg justify-center"
                : isOpen
                ? "text-[#0C2340] hover:bg-[#f3f6fb] px-4 py-3 rounded-lg"
                : "text-[#0C2340] hover:bg-[#f3f6fb] px-4 py-3 rounded-lg justify-center"
            }`}
            title={!isOpen ? "User Management" : ""}
            aria-expanded={isOpen ? userDropdownOpen : collapsedFlyoutOpen}
            aria-haspopup="true"
          >
            <Users size={20} className="flex-shrink-0" />
            {isOpen && (
              <>
                <span className="flex-1 text-left whitespace-nowrap">User Management</span>
                {userDropdownOpen ? (
                  <ChevronDown size={18} className="flex-shrink-0" />
                ) : (
                  <ChevronRight size={18} className="flex-shrink-0" />
                )}
              </>
            )}
            {!isOpen && !collapsedFlyoutOpen && (
              <div className="absolute left-full ml-2 px-3 py-2 bg-[#0C2340] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                User Management
              </div>
            )}
          </button>
          {/* Collapsed sidebar flyout with sub-links */}
          {!isOpen && collapsedFlyoutOpen && (
            <div className="absolute left-full top-0 ml-2 py-1.5 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {userManagementSubItems.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  onClick={() => setCollapsedFlyoutOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#0C2340] hover:bg-[#f3f6fb] ${
                      isActive ? "bg-[#0C2340] text-white hover:bg-[#0C2340]" : ""
                    }`
                  }
                  title={sub.label}
                >
                  <sub.icon size={18} className="flex-shrink-0" />
                  <span>{sub.label}</span>
                </NavLink>
              ))}
            </div>
          )}
          {isOpen && userDropdownOpen && (
            <div className="mt-1 ml-4 pl-4 border-l-2 border-[#003363]/30 space-y-0.5 py-2">
              {userManagementSubItems.map((sub) => (
                  <div key={sub.to} onClick={(e) => e.stopPropagation()}>
                    <NavLink
                      to={sub.to}
                      onClick={(e) => e.stopPropagation()}
                      className={({ isActive }) =>
                        `group/sub flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-[#0C2340] text-white"
                            : "text-[#0C2340] hover:bg-[#003363]/10"
                        }`
                      }
                      title={sub.label}
                    >
                      <sub.icon size={18} className="flex-shrink-0" />
                      <span>{sub.label}</span>
                    </NavLink>
                  </div>
              ))}
            </div>
          )}
        </div>

        {navItems.slice(1).map((item) => (
          <div key={item.to}>
            {navItem(item.to, item.label, item.icon, item.to === "/system-admin")}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div
        className={`px-3 pt-6 border-t border-gray-200 ${
          !isOpen ? "flex justify-center" : ""
        }`}
      >
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200 ${
            !isOpen ? "justify-center" : "w-full"
          }`}
          title={!isOpen ? "Logout" : ""}
          aria-label="Logout"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {isOpen && <span>Logout</span>}

          {/* Tooltip for collapsed state */}
          {!isOpen && (
            <div className="absolute left-full ml-2 px-3 py-2 bg-[#0C2340] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;




