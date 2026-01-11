import React from "react";
import { ChevronDown } from "lucide-react";

/**
 * EducationLevelFilter Component
 *
 * Dropdown filter for selecting education level.
 * Used in inventory detail section to filter inventory data.
 *
 * Props:
 * - value: string - Current selected value
 * - onChange: function - Change handler
 */
const EducationLevelFilter = ({ value, onChange }) => {
  const options = [
    { value: "Preschool", label: "Preschool" },
    { value: "Elementary", label: "Elementary" },
    { value: "Junior High School", label: "Junior High School" },
    { value: "Senior High School", label: "Senior High School" },
    { value: "College", label: "College" },
  ];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white appearance-none pr-10 text-sm font-medium text-gray-700"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none w-5 h-5 text-gray-400"
        size={20}
      />
    </div>
  );
};

export default EducationLevelFilter;
