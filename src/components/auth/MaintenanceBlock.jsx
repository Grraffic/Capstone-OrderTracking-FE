import React from "react";
import { useMaintenance } from "../../context/MaintenanceContext";
import { useAuth } from "../../context/AuthContext";
import MaintenanceOverlay from "../common/MaintenanceOverlay";

/**
 * MaintenanceBlock Component
 *
 * Blocks student access when maintenance mode is active
 * Shows maintenance overlay for students, allows admins to proceed
 */
const MaintenanceBlock = ({ children }) => {
  const { isActive, message, loading } = useMaintenance();
  const { userRole } = useAuth();

  // Show loading state while checking maintenance
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C2340] mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Block students if maintenance is active
  // Allow system admins and property custodians to access
  if (isActive && userRole === "student") {
    console.log("🚫 Maintenance mode is active, blocking student access", { isActive, userRole, message });
    return <MaintenanceOverlay message={message} />;
  }
  
  // Debug logging
  console.log("🔓 MaintenanceBlock status:", { isActive, userRole, message, loading });

  // For non-students or when maintenance is not active, render children normally
  return <>{children}</>;
};

export default MaintenanceBlock;
