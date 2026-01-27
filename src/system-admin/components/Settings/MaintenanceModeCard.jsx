import React, { useState, useEffect } from "react";
import ToggleSwitch from "./ToggleSwitch";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock } from "lucide-react";
import { formatDateToDisplay, formatDateToAPI, formatTimeToDisplay, formatTimeToAPI, validateTimeRange } from "../../utils/dateTimeUtils";
import { toast } from "react-hot-toast";

/**
 * MaintenanceModeCard Component
 *
 * Displays and manages maintenance mode settings
 *
 * Props:
 * - settings: Object - Current maintenance mode settings
 * - onUpdate: Function - Callback when settings are updated
 * - loading: Boolean - Loading state
 * - error: String - Error message
 */
const MaintenanceModeCard = ({ settings, onUpdate, loading, error }) => {
  const [localSettings, setLocalSettings] = useState({
    is_enabled: false,
    display_message: "",
    scheduled_date: null,
    start_time: "",
    end_time: "",
    is_all_day: false,
  });

  const [datePickerDate, setDatePickerDate] = useState(null);
  const [validationError, setValidationError] = useState(null);

  // Initialize local settings when props change
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        is_enabled: settings.is_enabled || false,
        display_message: settings.display_message || "",
        scheduled_date: settings.scheduled_date || null,
        start_time: settings.start_time || "",
        end_time: settings.end_time || "",
        is_all_day: settings.is_all_day || false,
      });

      // Set date picker date
      if (settings.scheduled_date) {
        const date = new Date(settings.scheduled_date + "T00:00:00");
        setDatePickerDate(date);
      } else {
        setDatePickerDate(null);
      }
    }
  }, [settings]);

  /**
   * Handle toggle switch change
   */
  const handleToggleChange = (enabled) => {
    setLocalSettings((prev) => ({
      ...prev,
      is_enabled: enabled,
    }));
    setValidationError(null);
  };

  /**
   * Handle display message change
   */
  const handleMessageChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setLocalSettings((prev) => ({
        ...prev,
        display_message: value,
      }));
      setValidationError(null);
    } else {
      setValidationError("Display message must be 500 characters or less");
    }
  };

  /**
   * Handle date change
   */
  const handleDateChange = (date) => {
    setDatePickerDate(date);
    if (date) {
      const formattedDate = formatDateToAPI(
        `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`
      );
      setLocalSettings((prev) => ({
        ...prev,
        scheduled_date: formattedDate,
      }));
    } else {
      setLocalSettings((prev) => ({
        ...prev,
        scheduled_date: null,
      }));
    }
    setValidationError(null);
  };

  /**
   * Handle start time change (from HTML5 time input - returns HH:MM format)
   */
  const handleStartTimeChange = (e) => {
    const value = e.target.value; // Already in HH:MM format from time input
    
    setLocalSettings((prev) => {
      const newSettings = {
        ...prev,
        start_time: value || "",
      };

      // Validate time range
      if (newSettings.end_time && value) {
        if (!validateTimeRange(value, newSettings.end_time)) {
          setValidationError("End time must be after start time");
        } else {
          setValidationError(null);
        }
      }

      return newSettings;
    });
  };

  /**
   * Handle end time change (from HTML5 time input - returns HH:MM format)
   */
  const handleEndTimeChange = (e) => {
    const value = e.target.value; // Already in HH:MM format from time input
    
    setLocalSettings((prev) => {
      const newSettings = {
        ...prev,
        end_time: value || "",
      };

      // Validate time range
      if (newSettings.start_time && value) {
        if (!validateTimeRange(newSettings.start_time, value)) {
          setValidationError("End time must be after start time");
        } else {
          setValidationError(null);
        }
      }

      return newSettings;
    });
  };

  /**
   * Handle "All day" checkbox change
   */
  const handleAllDayChange = (e) => {
    const isAllDay = e.target.checked;
    setLocalSettings((prev) => ({
      ...prev,
      is_all_day: isAllDay,
      start_time: isAllDay ? null : prev.start_time,
      end_time: isAllDay ? null : prev.end_time,
    }));
    setValidationError(null);
  };

  /**
   * Handle save button click
   */
  const handleSave = async () => {
    // Validate required fields
    if (localSettings.is_enabled && !localSettings.display_message?.trim()) {
      setValidationError("Display message is required when maintenance mode is enabled");
      toast.error("Display message is required");
      return;
    }

    // Validate time range if not all day
    if (
      !localSettings.is_all_day &&
      localSettings.start_time &&
      localSettings.end_time
    ) {
      if (!validateTimeRange(localSettings.start_time, localSettings.end_time)) {
        setValidationError("End time must be after start time");
        toast.error("End time must be after start time");
        return;
      }
    }

    try {
      await onUpdate({
        is_enabled: localSettings.is_enabled,
        display_message: localSettings.display_message?.trim() || null,
        scheduled_date: localSettings.scheduled_date || null,
        start_time: localSettings.is_all_day ? null : (localSettings.start_time || null),
        end_time: localSettings.is_all_day ? null : (localSettings.end_time || null),
        is_all_day: localSettings.is_all_day,
      });
      setValidationError(null);
    } catch (err) {
      // Error already handled in parent component
    }
  };

  // Convert times for HTML5 time input (needs HH:MM format)
  const displayStartTime = localSettings.start_time || "";
  const displayEndTime = localSettings.end_time || "";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 w-full">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Maintenance Mode</h2>
        <ToggleSwitch
          checked={localSettings.is_enabled}
          onChange={handleToggleChange}
          disabled={loading}
        />
      </div>

      {/* Display Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Message
        </label>
        <textarea
          value={localSettings.display_message}
          onChange={handleMessageChange}
          placeholder="We are currently reconciling inventory. Portal will be back at 9:00pm"
          disabled={loading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0C2340] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <div className="mt-1 text-xs text-gray-500">
          {localSettings.display_message.length}/500 characters
        </div>
      </div>

      {/* Date/Time Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Date/Time
        </label>

        {/* Date Picker */}
        <div className="mb-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <DatePicker
              selected={datePickerDate}
              onChange={handleDateChange}
              dateFormat="dd.MM.yyyy"
              placeholderText="Select a day"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0C2340] disabled:bg-gray-100 disabled:cursor-not-allowed"
              calendarClassName="react-datepicker-custom"
            />
            {datePickerDate && (
              <div className="mt-1 text-sm text-gray-600">
                {formatDateToDisplay(localSettings.scheduled_date)}
              </div>
            )}
          </div>
        </div>

        {/* Time Pickers */}
        {!localSettings.is_all_day && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Start Time */}
            <div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  type="time"
                  value={displayStartTime}
                  onChange={handleStartTimeChange}
                  disabled={loading || localSettings.is_all_day}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0C2340] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Start With {localSettings.start_time ? formatTimeToDisplay(localSettings.start_time) : "00:00 AM"}
              </div>
            </div>

            {/* End Time */}
            <div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={20} />
                <input
                  type="time"
                  value={displayEndTime}
                  onChange={handleEndTimeChange}
                  disabled={loading || localSettings.is_all_day}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0C2340] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="mt-1 text-sm text-gray-500">
                End With {localSettings.end_time ? formatTimeToDisplay(localSettings.end_time) : "00:00 AM"}
              </div>
            </div>
          </div>
        )}

        {/* All Day Option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="all-day"
            checked={localSettings.is_all_day}
            onChange={handleAllDayChange}
            disabled={loading}
            className="w-4 h-4 text-[#0C2340] rounded focus:ring-[#0C2340]"
          />
          <label htmlFor="all-day" className="text-sm text-gray-700 cursor-pointer">
            All day
          </label>
        </div>
      </div>

      {/* Error Message */}
      {(error || validationError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error || validationError}</p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading || !!validationError}
          className="px-6 py-2 bg-[#0C2340] text-white rounded-md hover:bg-[#0a1d33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default MaintenanceModeCard;
