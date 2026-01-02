import React from "react";
import Sidebar from "../common/Sidebar";
import AdminHeader from "../common/AdminHeader";
import { useAdminSidebar } from "../../hooks";

/**
 * AdminLayout Component
 *
 * A reusable layout wrapper for admin pages that includes:
 * - Sidebar navigation
 * - Admin header
 * - Main content area with proper spacing
 *
 * Props:
 * - children: React node - The page content to render
 * - title: string (optional) - Page title to display
 * - showTitle: boolean (optional, default: true) - Whether to show the page title
 * - noPadding: boolean (optional, default: false) - Whether to remove default padding
 */
const AdminLayout = ({ children, noPadding = false }) => {
  const { sidebarOpen, toggleSidebar } = useAdminSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onNavigate={toggleSidebar} />

      {/* Fixed Header */}
      <AdminHeader onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Main Content Area - Scrollable */}
      <main
        className={`fixed top-16 bottom-0 right-0 bg-gray-50 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? "left-64" : "left-20"
        }`}
      >
        <div className={noPadding ? "" : "p-8"}>{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
