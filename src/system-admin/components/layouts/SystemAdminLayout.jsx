import React from "react";
import Sidebar from "../common/Sidebar";
import SystemAdminHeader from "../common/SystemAdminHeader";
import { useSystemAdminSidebar } from "../../hooks/common/useSystemAdminSidebar";

/**
 * SystemAdminLayout Component
 *
 * A reusable layout wrapper for system admin pages that includes:
 * - Sidebar navigation
 * - System Admin header
 * - Main content area with proper spacing
 *
 * Props:
 * - children: React node - The page content to render
 * - noPadding: boolean (optional, default: false) - Whether to remove default padding
 */
const SystemAdminLayout = ({ children, noPadding = false }) => {
  const { sidebarOpen, toggleSidebar } = useSystemAdminSidebar();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={sidebarOpen} onNavigate={toggleSidebar} />

      {/* Fixed Header */}
      <SystemAdminHeader onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

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

export default SystemAdminLayout;


