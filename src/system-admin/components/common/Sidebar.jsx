import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  Home,
  Users,
  GraduationCap,
  FileCheck,
  Settings,
  LogOut,
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

  // Auto-close sidebar on mobile/tablet when route changes
  useEffect(() => {
    const MOBILE_BREAKPOINT = 1024; // px (matches Tailwind's lg breakpoint)
    
    // Close sidebar on mobile/tablet when navigating to a new route
    if (window.innerWidth < MOBILE_BREAKPOINT && isOpen && onNavigate) {
      onNavigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Close sidebar whenever the route changes on mobile/tablet

  const navItems = [
    { to: "/system-admin", label: "Home", icon: Home },
    { to: "/system-admin/users", label: "User Management", icon: Users },
    { to: "/system-admin/students", label: "List of student", icon: GraduationCap },
    { to: "/system-admin/eligibility", label: "Eligibility Management", icon: FileCheck },
    { to: "/system-admin/settings", label: "System Settings", icon: Settings },
  ];

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still navigate to login even if logout fails
      navigate("/login");
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
        {navItems.map((item) => (
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
          onClick={handleLogout}
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




