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
  const [showCalendar, setShowCalendar] = useState(false);
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

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
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
  const handlePresetChange = (event) => {
    const presetValue = event.target.value;
    setPreset(presetValue);
    
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
    <div className={`flex items-center border border-gray-300 rounded-lg bg-white whitespace-nowrap ${className}`}>
      {/* Left Section - Preset Dropdown */}
      <select
        value={preset}
        onChange={handlePresetChange}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-0 rounded-l-lg focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1rem',
        }}
      >
        {presetOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Vertical Separator */}
      <div className="w-px h-8 bg-gray-300" />

      {/* Right Section - Calendar Date Range */}
      <div className="relative flex-shrink-0" ref={calendarRef}>
        <button
          type="button"
          onClick={() => {
            setShowCalendar(!showCalendar);
          }}
          className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-r-lg"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">{formatDateRange()}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 ml-2 flex-shrink-0" />
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

