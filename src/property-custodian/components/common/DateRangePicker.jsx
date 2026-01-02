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
  const containerRef = useRef(null);
  const selectRef = useRef(null);

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
    if (!showCalendar) return;

    const handleClickOutside = (event) => {
      // Don't close if clicking on the select dropdown or its options
      if (selectRef.current && selectRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking inside the calendar dropdown
      if (calendarRef.current && calendarRef.current.contains(event.target)) {
        return;
      }
      
      // Don't close if clicking the button (let it toggle)
      const button = containerRef.current?.querySelector('button[type="button"]');
      if (button && button.contains(event.target)) {
        return;
      }
      
      // Close calendar if clicking outside
      setShowCalendar(false);
    };

    // Use a small delay to avoid immediate closure when opening from preset
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

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
      setShowCalendar(false);
    } else {
      // Show calendar when custom range is selected with a small delay
      setTimeout(() => {
        setShowCalendar(true);
      }, 50);
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
    <div ref={containerRef} className={`flex items-center border border-gray-300 rounded-lg bg-white overflow-visible max-w-full ${className}`}>
      {/* Left Section - Preset Dropdown */}
      <select
        ref={selectRef}
        value={preset}
        onChange={handlePresetChange}
        className="px-2 sm:px-2.5 md:px-3 lg:px-4 py-2 text-xs sm:text-xs md:text-sm font-medium text-gray-700 bg-white border-0 rounded-l-lg focus:outline-none focus:ring-0 cursor-pointer appearance-none pr-5 sm:pr-6 md:pr-7 lg:pr-8 flex-shrink-0 min-w-0 max-w-[140px] sm:max-w-[160px] md:max-w-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '0.875rem',
        }}
      >
        {presetOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {/* Vertical Separator */}
      <div className="w-px h-7 sm:h-8 bg-gray-300 flex-shrink-0" />

      {/* Right Section - Calendar Date Range */}
      <div className="relative flex-1 min-w-0 overflow-visible">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowCalendar(!showCalendar);
          }}
          className="flex items-center justify-between px-2 sm:px-2.5 md:px-3 lg:px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors rounded-r-lg w-full min-w-0 overflow-hidden"
        >
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0 flex-1 overflow-hidden">
            <Calendar className="w-3.5 h-3.5 sm:w-3.5 md:w-4 sm:h-3.5 md:h-4 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-xs md:text-sm font-medium truncate min-w-0">{formatDateRange()}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 sm:w-3.5 md:w-4 sm:h-3.5 md:h-4 text-gray-500 ml-1 sm:ml-1.5 md:ml-2 flex-shrink-0" />
        </button>

        {/* Calendar Dropdown */}
        {showCalendar && (
          <div className="absolute top-full left-0 sm:left-0 md:left-auto md:right-0 mt-1 z-[9999]" ref={calendarRef}>
            <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-2">
              <DatePicker
                selected={startDate}
                onChange={handleCalendarChange}
                startDate={startDate}
                endDate={endDate}
                selectsRange
                inline
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangePicker;

