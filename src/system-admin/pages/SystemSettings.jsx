import React from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import MaintenanceModeCard from "../components/Settings/MaintenanceModeCard";
import { useMaintenance } from "../hooks/useMaintenance";
import { Settings } from "lucide-react";

/**
 * SystemSettings Page
 * 
 * System settings page for maintenance mode and other system configurations
 */
const SystemSettings = () => {
  const {
    settings,
    loading,
    error,
    isActive,
    updateSettings,
  } = useMaintenance();

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-full bg-[#0C2340] flex items-center justify-center">
            <Settings className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0C2340]">System Settings</h1>
            <p className="text-sm text-orange-500 font-medium">Maintenance and Controls</p>
          </div>
        </div>

        {/* Maintenance Mode Card - Left aligned with max width */}
        <div className="flex justify-start">
          <div className="w-full max-w-lg">
            <MaintenanceModeCard
              settings={settings}
              onUpdate={updateSettings}
              loading={loading}
              error={error}
            />
          </div>
        </div>

        {/* Maintenance Status Indicator */}
        {isActive && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-lg">
            <p className="text-sm text-yellow-800">
              <strong>Maintenance Mode is Active:</strong> {settings.display_message || "System is under maintenance"}
            </p>
          </div>
        )}
      </div>
    </SystemAdminLayout>
  );
};

export default SystemSettings;




