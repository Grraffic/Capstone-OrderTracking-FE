import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { subDays } from "date-fns";

const CUSTOM_DATE_DEBOUNCE_MS = 400;

/**
 * ItemsFilterDropdown Component
 *
 * Filter dropdown panel (opens below the Filters button). Arrangement:
 * 1. Filter by Date Range (Last 7 days, Last 30 days)
 * 2. Custom Date Range (Start Date, End Date)
 * 3. Filter by Item Status (Archived only)
 *
 * Nothing selected by default; user chooses. Clicking the selected option again deselects it (blue disappears).
 * Filters apply immediately so the list updates as you pick (items appear automatically). Custom date range
 * is debounced so the list does not refetch on every keystroke. Full-page reload is avoided via isInitialLoading.
 */
const ItemsFilterDropdown = ({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
  buttonRef = null,
}) => {
  const [itemStatus, setItemStatus] = useState(
    initialFilters.itemStatus ?? null
  );
  const [datePreset, setDatePreset] = useState(
    initialFilters.datePreset ?? null
  );
  const [startDate, setStartDate] = useState(
    initialFilters.startDate ?? subDays(new Date(), 6)
  );
  const [endDate, setEndDate] = useState(
    initialFilters.endDate ?? new Date()
  );
  const customDateTimeoutRef = useRef(null);

  // No longer need position calculation since we're centering the dropdown

  useEffect(() => {
    if (!isOpen) return;
    setItemStatus(initialFilters.itemStatus ?? null);
    setDatePreset(initialFilters.datePreset ?? null);
    setStartDate(
      initialFilters.startDate
        ? new Date(initialFilters.startDate)
        : subDays(new Date(), 6)
    );
    setEndDate(
      initialFilters.endDate ? new Date(initialFilters.endDate) : new Date()
    );
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (customDateTimeoutRef.current) clearTimeout(customDateTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const getDateRangeFromPreset = (preset) => {
    if (!preset) return { rangeStart: null, rangeEnd: null };
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (preset === "last7") {
      const start = subDays(new Date(), 6);
      start.setHours(0, 0, 0, 0);
      return { rangeStart: start, rangeEnd: new Date(today) };
    }
    if (preset === "last30") {
      const start = subDays(new Date(), 29);
      start.setHours(0, 0, 0, 0);
      return { rangeStart: start, rangeEnd: new Date(today) };
    }
    if (preset === "custom" && startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end };
    }
    return { rangeStart: null, rangeEnd: null };
  };

  const getCurrentFilters = () => {
    const { rangeStart, rangeEnd } = getDateRangeFromPreset(datePreset);
    return {
      itemStatus,
      datePreset,
      startDate: rangeStart,
      endDate: rangeEnd,
    };
  };

  const handleClose = () => {
    onApply(getCurrentFilters());
    onClose();
  };

  const handleItemStatus = (value) => {
    const next = itemStatus === value ? null : value;
    setItemStatus(next);
    const { rangeStart, rangeEnd } = getDateRangeFromPreset(datePreset);
    onApply({
      itemStatus: next,
      datePreset,
      startDate: rangeStart,
      endDate: rangeEnd,
    });
  };

  const handleDatePreset = (value) => {
    const next = datePreset === value ? null : value;
    setDatePreset(next);
    const { rangeStart, rangeEnd } = getDateRangeFromPreset(next);
    setStartDate(rangeStart ?? subDays(new Date(), 6));
    setEndDate(rangeEnd ?? new Date());
    onApply({
      itemStatus,
      datePreset: next,
      startDate: rangeStart,
      endDate: rangeEnd,
    });
  };

  const applyCustomDateRange = (newStart, newEnd) => {
    if (customDateTimeoutRef.current) clearTimeout(customDateTimeoutRef.current);
    customDateTimeoutRef.current = setTimeout(() => {
      customDateTimeoutRef.current = null;
      const start = newStart ? (() => { const d = new Date(newStart); d.setHours(0, 0, 0, 0); return d; })() : null;
      const end = newEnd ? (() => { const d = new Date(newEnd); d.setHours(23, 59, 59, 999); return d; })() : null;
      onApply({
        itemStatus,
        datePreset: start || end ? "custom" : null,
        startDate: start,
        endDate: end,
      });
    }, CUSTOM_DATE_DEBOUNCE_MS);
  };

  const handleStartChange = (e) => {
    e.preventDefault?.();
    const v = e.target.value;
    const d = v ? new Date(v) : null;
    setStartDate(d ?? subDays(new Date(), 6));
    setDatePreset(v ? "custom" : datePreset);
    const end = endDate ? new Date(endDate) : new Date();
    applyCustomDateRange(v ? new Date(v) : null, end);
  };

  const handleEndChange = (e) => {
    e.preventDefault?.();
    const v = e.target.value;
    const d = v ? new Date(v) : null;
    setEndDate(d ?? new Date());
    setDatePreset(v ? "custom" : datePreset);
    const start = startDate ? new Date(startDate) : subDays(new Date(), 6);
    applyCustomDateRange(start, v ? new Date(v) : null);
  };

  const formatDateForInput = (d) => {
    if (!d || !(d instanceof Date) || isNaN(d)) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-3 sm:p-4"
      onClick={handleClose}
      onKeyDown={(e) => e.key === "Escape" && handleClose()}
      aria-hidden
    >
      {/* Dropdown panel — centered. Form prevents Enter/submit from reloading the page. */}
      <div
        className="relative z-[10001] w-full max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        role="dialog"
        aria-label="Filter options"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          onSubmit={(e) => e.preventDefault()}
          className="contents"
          noValidate
        >
        {/* Title */}
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-[#0C2340]">Filter</h2>
        </div>

        {/* Body — Date Range, Custom Date Range, Item Status */}
        <div className="px-5 py-4 space-y-5">
          {/* 1. Filter by Date Range */}
          <div>
            <h3 className="text-sm font-semibold text-[#0C2340] mb-2">
              Filter by Date Range
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleDatePreset("last7")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                  datePreset === "last7"
                    ? "bg-[#2E8FEA]/15 border-[#2E8FEA] text-[#0C2340]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Last 7 days
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset("last30")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                  datePreset === "last30"
                    ? "bg-[#2E8FEA]/15 border-[#2E8FEA] text-[#0C2340]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Last 30 days
              </button>
            </div>
          </div>

          {/* 2. Custom Date Range */}
          <div>
            <h3 className="text-sm font-semibold text-[#0C2340] mb-2">
              Custom Date Range
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(startDate)}
                  onChange={handleStartChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(endDate)}
                  onChange={handleEndChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 3. Filter by Item Status (Archived only; Deleted filter removed) */}
          <div>
            <h3 className="text-sm font-semibold text-[#0C2340] mb-2">
              Filter by Item Status
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleItemStatus("archived")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors ${
                  itemStatus === "archived"
                    ? "bg-[#2E8FEA]/15 border-[#2E8FEA] text-[#0C2340]"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Archived
              </button>
            </div>
          </div>
        </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ItemsFilterDropdown;
