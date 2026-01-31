import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { maintenanceAPI } from "../services/maintenance.service";

/**
 * Maintenance Context
 *
 * Provides maintenance mode status to the entire application
 * Checks maintenance status periodically and blocks student access when active
 */

const MaintenanceContext = createContext();

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error("useMaintenance must be used within MaintenanceProvider");
  }
  return context;
};

export const MaintenanceProvider = ({ children }) => {
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    isActive: false,
    message: null,
    loading: true,
  });

  /**
   * Check maintenance status from the API
   */
  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const response = await maintenanceAPI.checkMaintenanceStatus();
      
      if (response.data && response.data.success !== undefined) {
        const isActive = response.data.isActive === true;
        const message = response.data.message || null;
        
        setMaintenanceStatus({
          isActive,
          message,
          loading: false,
        });
      } else {
        setMaintenanceStatus({
          isActive: false,
          message: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Error checking maintenance status:", error);
      // On error, assume maintenance is not active to avoid blocking users
      setMaintenanceStatus({
        isActive: false,
        message: null,
        loading: false,
      });
    }
  }, []);

  // Check maintenance status on mount and periodically
  useEffect(() => {
    // Initial check immediately
    checkMaintenanceStatus();

    // Check every 10 seconds for more responsive updates
    const interval = setInterval(() => {
      checkMaintenanceStatus();
    }, 10000); // 10 seconds for faster updates

    return () => clearInterval(interval);
  }, [checkMaintenanceStatus]);

  const value = {
    isActive: maintenanceStatus.isActive,
    message: maintenanceStatus.message,
    loading: maintenanceStatus.loading,
    checkMaintenanceStatus,
  };

  return (
    <MaintenanceContext.Provider value={value}>
      {children}
    </MaintenanceContext.Provider>
  );
};
