import { useState, useEffect, useCallback, useMemo } from "react";
import { maintenanceAPI } from "../../services/maintenance.service";
import { toast } from "react-hot-toast";

/**
 * useMaintenance Hook
 *
 * Handles maintenance mode data fetching and management:
 * - Fetches current maintenance mode settings
 * - Updates maintenance mode settings
 * - Checks if maintenance is currently active
 * - Manages loading and error states
 *
 * Usage:
 * const { settings, loading, error, isActive, fetchSettings, updateSettings, toggleMaintenance } = useMaintenance();
 */
export const useMaintenance = () => {
  const [settings, setSettings] = useState({
    is_enabled: false,
    display_message: null,
    scheduled_date: null,
    start_time: null,
    end_time: null,
    is_all_day: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maintenanceStatus, setMaintenanceStatus] = useState({
    isActive: false,
    message: null,
  });

  /**
   * Fetch current maintenance mode settings
   */
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await maintenanceAPI.getMaintenanceMode();

      if (response.data && response.data.success) {
        setSettings(response.data.data || {
          is_enabled: false,
          display_message: null,
          scheduled_date: null,
          start_time: null,
          end_time: null,
          is_all_day: false,
        });
      }
    } catch (err) {
      console.error("Error fetching maintenance settings:", err);
      setError(err.message || "Failed to fetch maintenance settings");
      toast.error(err.message || "Failed to fetch maintenance settings");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update maintenance mode settings
   */
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setLoading(true);
      setError(null);

      const response = await maintenanceAPI.updateMaintenanceMode(newSettings);

      if (response.data && response.data.success) {
        setSettings(response.data.data);
        toast.success("Maintenance mode settings updated successfully");
        
        // Refresh maintenance status after update
        await checkMaintenanceStatus();
        
        return response.data.data;
      }
    } catch (err) {
      console.error("Error updating maintenance settings:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to update maintenance settings";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle maintenance mode on/off
   */
  const toggleMaintenance = useCallback(async (enabled) => {
    try {
      await updateSettings({
        ...settings,
        is_enabled: enabled,
      });
    } catch (err) {
      // Error already handled in updateSettings
      throw err;
    }
  }, [settings, updateSettings]);

  /**
   * Check if maintenance is currently active (public endpoint)
   */
  const checkMaintenanceStatus = useCallback(async () => {
    try {
      const response = await maintenanceAPI.checkMaintenanceStatus();

      if (response.data && response.data.success) {
        setMaintenanceStatus({
          isActive: response.data.isActive || false,
          message: response.data.message || null,
        });
      }
    } catch (err) {
      console.error("Error checking maintenance status:", err);
      // On error, assume maintenance is not active
      setMaintenanceStatus({
        isActive: false,
        message: null,
      });
    }
  }, []);

  /**
   * Computed: Whether maintenance is currently active
   * Based on current settings and schedule
   */
  const isActive = useMemo(() => {
    if (!settings.is_enabled) {
      return false;
    }

    // If no scheduled date, maintenance is active immediately when enabled
    if (!settings.scheduled_date) {
      return true;
    }

    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS

    // Check if current date matches scheduled date
    if (currentDate !== settings.scheduled_date) {
      return false;
    }

    // If all day, maintenance is active
    if (settings.is_all_day) {
      return true;
    }

    // Check if current time is within the scheduled time range
    if (settings.start_time && settings.end_time) {
      const [startHours, startMinutes] = settings.start_time.split(":").map(Number);
      const [endHours, endMinutes] = settings.end_time.split(":").map(Number);
      const [currentHours, currentMinutes] = currentTime.split(":").map(Number);

      const startTotal = startHours * 60 + startMinutes;
      const endTotal = endHours * 60 + endMinutes;
      const currentTotal = currentHours * 60 + currentMinutes;

      return currentTotal >= startTotal && currentTotal < endTotal;
    }

    return false;
  }, [settings]);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    isActive,
    maintenanceStatus,
    fetchSettings,
    updateSettings,
    toggleMaintenance,
    checkMaintenanceStatus,
  };
};
