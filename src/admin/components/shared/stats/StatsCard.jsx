import React from "react";

/**
 * Reusable StatsCard Component
 *
 * A flexible stat card component that can be used across different admin pages
 * to display statistics with icons, colors, and values.
 *
 * Props:
 * - title: string - The label for the stat
 * - value: number|string - The value to display
 * - icon: React component - Icon component (from lucide-react or custom)
 * - color: string - Text color class (e.g., "text-blue-600")
 * - bgColor: string - Background color class (e.g., "bg-blue-100")
 * - iconColor: string - Icon color class (e.g., "text-blue-600")
 * - subtitle: string (optional) - Additional subtitle text
 * - formatValue: function (optional) - Function to format the value
 */
const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = "text-gray-900",
  bgColor = "bg-gray-100",
  iconColor = "text-gray-600",
  subtitle,
  formatValue,
}) => {
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{displayValue}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center ${iconColor}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;


