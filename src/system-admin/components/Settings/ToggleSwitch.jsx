import React from "react";

/**
 * ToggleSwitch Component
 *
 * A custom styled toggle switch component
 *
 * Props:
 * - checked: Boolean - Whether the toggle is on
 * - onChange: Function - Callback when toggle changes
 * - disabled: Boolean - Whether the toggle is disabled
 * - label: String (optional) - Label text
 */
const ToggleSwitch = ({ checked, onChange, disabled = false, label }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            checked
              ? "bg-green-500"
              : "bg-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              checked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
