import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

/**
 * DateRangePicker Component
 * 
 * A date range picker with two sections:
 * - Left: Preset dropdown (Last 7 days, Last 30 days, etc.)
 * - Right: Calendar date range selector with formatted display
 */
const DateRangePicker = ({ startDate, endDate, onDateRangeChange, className = "" }) => {
  const [preset, setPreset] = useState("Last 7 days");
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const presetDropdownRef = useRef(null);
  const calendarRef = useRef(null);

  // Preset options
  const presetOptions = [
    "Last 7 days",
    "Last 30 days",
    "Last 90 days",
    "This month",
    "Last month",
    "This year",
    "Custom range",
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target)) {
        setShowPresetDropdown(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate date range based on preset
  const calculateDateRange = (presetValue) => {
    const today = new Date();
    let newStartDate, newEndDate;

    switch (presetValue) {
      case "Last 7 days":
        newStartDate = subDays(today, 6);
        newEndDate = today;
        break;
      case "Last 30 days":
        newStartDate = subDays(today, 29);
        newEndDate = today;
        break;
      case "Last 90 days":
        newStartDate = subDays(today, 89);
        newEndDate = today;
        break;
      case "This month":
        newStartDate = startOfMonth(today);
        newEndDate = today;
        break;
      case "Last month":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newStartDate = startOfMonth(lastMonth);
        newEndDate = endOfMonth(lastMonth);
        break;
      case "This year":
        newStartDate = startOfYear(today);
        newEndDate = today;
        break;
      case "Custom range":
        // Don't change dates, just allow calendar selection
        return;
      default:
        newStartDate = subDays(today, 6);
        newEndDate = today;
    }

    if (onDateRangeChange) {
      onDateRangeChange(newStartDate, newEndDate);
    }
  };

  // Handle preset selection
  const handlePresetChange = (presetValue) => {
    setPreset(presetValue);
    setShowPresetDropdown(false);
    
    if (presetValue !== "Custom range") {
      calculateDateRange(presetValue);
    } else {
      // Show calendar when custom range is selected
      setShowCalendar(true);
    }
  };

  // Handle calendar date changes
  const handleCalendarChange = (dates) => {
    const [start, end] = dates;
    if (start) {
      if (onDateRangeChange) {
        onDateRangeChange(start, end || null);
      }
      // If both dates are selected, close calendar and update preset
      if (start && end) {
        setShowCalendar(false);
        setPreset("Custom range");
      }
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!startDate || !endDate) {
      return "Select dates";
    }
    return `${format(startDate, "d MMM")} - ${format(endDate, "d MMM")}`;
  };

  return (
    <div className={`flex items-center border border-gray-300 rounded-lg bg-white ${className}`}>
      {/* Left Section - Preset Dropdown */}
      <div className="relative flex-1" ref={presetDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setShowPresetDropdown(!showPresetDropdown);
            setShowCalendar(false);
          }}
          className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-l-lg"
        >
          <span className="text-sm font-medium">{preset}</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {/* Preset Dropdown Menu */}
        {showPresetDropdown && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {presetOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handlePresetChange(option)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  preset === option ? "bg-orange-50 text-[#e68b00] font-medium" : "text-gray-700"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Vertical Separator */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Right Section - Calendar Date Range */}
      <div className="relative flex-1" ref={calendarRef}>
        <button
          type="button"
          onClick={() => {
            setShowCalendar(!showCalendar);
            setShowPresetDropdown(false);
          }}
          className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-r-lg"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{formatDateRange()}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {/* Calendar Dropdown */}
        {showCalendar && (
          <div className="absolute top-full right-0 mt-1 z-50">
            <DatePicker
              selected={startDate}
              onChange={handleCalendarChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              inline
              className="border border-gray-300 rounded-lg shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;

