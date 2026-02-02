import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns";
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
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
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

  // Calculate calendar position when it opens
  useEffect(() => {
    if (!showCalendar || !buttonRef.current) return;

    const calculatePosition = () => {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const calendarWidth = 280; // Width for 1 month
      const calendarHeight = 300;
      
      let left = buttonRect.left;
      let top = buttonRect.bottom + 4; // 4px gap (mt-1)
      
      // On mobile, center the calendar
      if (viewportWidth < 768) {
        left = Math.max(8, (viewportWidth - calendarWidth) / 2);
        // If calendar would go below viewport, position it above
        if (top + calendarHeight > viewportHeight) {
          top = buttonRect.top - calendarHeight - 4;
        }
      } else {
        // On desktop, align to right
        left = buttonRect.right - calendarWidth;
        // Ensure it doesn't go off the left edge
        if (left < 8) {
          left = 8;
        }
      }
      
      setCalendarPosition({ top, left });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, [showCalendar]);

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
      if (buttonRef.current && buttonRef.current.contains(event.target)) {
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
      case "Last month": {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newStartDate = startOfMonth(lastMonth);
        newEndDate = endOfMonth(lastMonth);
        break;
      }
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
    // react-datepicker with selectsRange returns an array [startDate, endDate]
    const [start, end] = Array.isArray(dates) ? dates : [dates, null];
    
    console.log("[DateRangePicker] Calendar change:", { start, end, dates, isArray: Array.isArray(dates) });
    
    if (start) {
      // Normalize dates using date components to avoid timezone issues
      const normalizedStart = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0, 0, 0, 0
      );
      
      let normalizedEnd;
      if (end) {
        normalizedEnd = new Date(
          end.getFullYear(),
          end.getMonth(),
          end.getDate(),
          23, 59, 59, 999
        );
      } else {
        // If only start date is selected, set end to same date for single-day selection
        normalizedEnd = new Date(
          normalizedStart.getFullYear(),
          normalizedStart.getMonth(),
          normalizedStart.getDate(),
          23, 59, 59, 999
        );
      }
      
      console.log("[DateRangePicker] Normalized dates:", { normalizedStart, normalizedEnd });
      
      if (onDateRangeChange) {
        onDateRangeChange(normalizedStart, normalizedEnd);
      }
      
      // Only close calendar if both start and end dates are selected (for range selection)
      // For single date selection, keep it open to allow selecting end date
      if (start && end && normalizedStart.getTime() !== normalizedEnd.getTime()) {
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
    <div ref={containerRef} className={`flex items-center border border-gray-300 rounded-lg bg-white overflow-visible max-w-[350px] sm:max-w-[400px] md:max-w-[450px] w-auto ${className}`}>
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
      <div className="relative flex-1 min-w-0 overflow-visible max-w-[300px] sm:max-w-[350px] md:max-w-[400px]">
        <button
          ref={buttonRef}
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
      </div>
      
      {/* Calendar Dropdown - Rendered via Portal to prevent overflow */}
      {showCalendar && createPortal(
        <div 
          ref={calendarRef}
          className="fixed z-[9999]"
          style={{ 
            top: `${calendarPosition.top}px`,
            left: `${calendarPosition.left}px`,
            width: '260px',
            maxWidth: 'calc(100vw - 1rem)'
          }}
        >
          <div className="shadow-lg p-2 bg-transparent">
            <DatePicker
              selected={startDate}
              onChange={handleCalendarChange}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              inline
              calendarStartDay={1}
              dateFormat="MMM d, yyyy"
              shouldCloseOnSelect={false}
              monthsShown={1}
              fixedHeight
              allowSameDay={true}
              isClearable={false}
              openToDate={startDate || new Date()}
              disabledKeyboardNavigation={false}
              onChangeRaw={(e) => {
                // Prevent default input handling that might interfere with date selection
                e.preventDefault();
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DateRangePicker;

