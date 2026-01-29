import React, { useState, useEffect } from "react";
import { subDays } from "date-fns";
import { X } from "lucide-react";

/**
 * ItemsFilterModal Component
 *
 * Filter modal (opens when Filters is clicked) with correct arrangement:
 * 1. Filter by Date Range (Last 7 days, Last 30 days)
 * 2. Custom Date Range (Start Date, End Date)
 * 3. Filter by Item Status (Archived only)
 *
 * No Active, All, Cancel, or Apply — filters apply when user selects an option.
 */
const ItemsFilterModal = ({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [itemStatus, setItemStatus] = useState(
    initialFilters.itemStatus ?? "archived"
  );
  const [datePreset, setDatePreset] = useState(
    initialFilters.datePreset ?? "last7"
  );
  const [startDate, setStartDate] = useState(
    initialFilters.startDate ?? subDays(new Date(), 6)
  );
  const [endDate, setEndDate] = useState(
    initialFilters.endDate ?? new Date()
  );

  useEffect(() => {
    if (!isOpen) return;
    setItemStatus(initialFilters.itemStatus ?? "archived");
    setDatePreset(initialFilters.datePreset ?? "last7");
    setStartDate(
      initialFilters.startDate
        ? new Date(initialFilters.startDate)
        : subDays(new Date(), 6)
    );
    setEndDate(
      initialFilters.endDate ? new Date(initialFilters.endDate) : new Date()
    );
  }, [isOpen]);

  if (!isOpen) return null;

  const handleItemStatus = (value) => {
    setItemStatus(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let rangeStart = null;
    let rangeEnd = null;
    if (datePreset === "last7") {
      rangeStart = subDays(new Date(), 6);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(today);
    } else if (datePreset === "last30") {
      rangeStart = subDays(new Date(), 29);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(today);
    } else if (datePreset === "custom" && startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    }
    onApply({
      itemStatus: value,
      datePreset,
      startDate: rangeStart,
      endDate: rangeEnd,
    });
  };

  const handleDatePreset = (value) => {
    setDatePreset(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let rangeStart = null;
    let rangeEnd = null;
    if (value === "last7") {
      rangeStart = subDays(new Date(), 6);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(today);
    } else if (value === "last30") {
      rangeStart = subDays(new Date(), 29);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(today);
    } else if (value === "custom" && startDate && endDate) {
      rangeStart = new Date(startDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    }
    onApply({
      itemStatus,
      datePreset: value,
      startDate: rangeStart,
      endDate: rangeEnd,
    });
  };

  const handleStartChange = (e) => {
    const v = e.target.value;
    const d = v ? new Date(v) : null;
    setStartDate(d);
    if (v) {
      setDatePreset("custom");
      const start = new Date(v);
      start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      onApply({
        itemStatus,
        datePreset: "custom",
        startDate: start,
        endDate: end,
      });
    }
  };

  const handleEndChange = (e) => {
    const v = e.target.value;
    const d = v ? new Date(v) : null;
    setEndDate(d);
    if (v) {
      setDatePreset("custom");
      const start = startDate ? new Date(startDate) : subDays(new Date(), 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(v);
      end.setHours(23, 59, 59, 999);
      onApply({
        itemStatus,
        datePreset: "custom",
        startDate: start,
        endDate: end,
      });
    }
  };

  const formatDateForInput = (d) => {
    if (!d || !(d instanceof Date) || isNaN(d)) return "";
    return d.toISOString().slice(0, 10);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-[#0C2340]">Filter</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body — correct order: Date Range, Custom Date Range, Item Status */}
        <div className="px-5 py-4 space-y-6">
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
      </div>
    </div>
  );
};

export default ItemsFilterModal;
