import React from "react";
import { Loader2 } from "lucide-react";

/**
 * ItemPermissionsStep Component
 *
 * Displays items categorized by education level with checkboxes to enable/disable ordering permissions
 * for old students.
 *
 * Props:
 * - itemsByEducationLevel: Object with education levels as keys and arrays of items as values
 * - permissions: Object mapping normalized item names to enabled status
 * - onPermissionChange: Function(itemName, enabled) - Called when checkbox is toggled
 * - loading: Boolean indicating loading state
 * - studentEducationLevel: The student's education level (to filter which sections to show)
 */
const ItemPermissionsStep = ({
  itemsByEducationLevel,
  permissions,
  onPermissionChange,
  loading,
  studentEducationLevel,
}) => {
  const educationLevelLabels = {
    "Kindergarten": "Kindergarten / Preschool",
    "Elementary": "Elementary",
    "Junior High School": "Junior High School (JHS)",
    "Senior High School": "Senior High School (SHS)",
    "College": "College",
    "All Education Levels": "All Education Levels",
  };

  const handleCheckboxChange = (itemName, checked) => {
    onPermissionChange(itemName, checked);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#0C2340] mr-2" size={24} />
        <div className="text-gray-500">Loading items...</div>
      </div>
    );
  }

  const hasItems = Object.keys(itemsByEducationLevel || {}).length > 0;

  if (!hasItems) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-50 rounded-full p-4 mb-4">
          <Loader2 className="text-gray-400" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No items found
        </h3>
        <p className="text-sm text-gray-500">
          No items available for this education level.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto">
      <div className="text-sm text-gray-600 mb-4">
        <p>
          Select items that the student(s) are allowed to order. Items that are
          not checked will be visible to the student but remain disabled for
          ordering.
        </p>
      </div>

      {Object.entries(itemsByEducationLevel || {})
        .filter(([level]) => {
          // Only show items for the student's education level and "All Education Levels"
          if (!studentEducationLevel) return true; // Show all if no level specified
          const studentLevel = studentEducationLevel;
          return level === studentLevel || level === "All Education Levels";
        })
        .map(([level, items]) => (
        <div key={level} className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Education Level Header */}
          <div className="bg-[#0C2340] text-white px-4 py-3 rounded-t-lg">
            <h3 className="text-lg font-semibold">
              {educationLevelLabels[level] || level}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              {items.length} item{items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Items List */}
          <div className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No items in this category
              </div>
            ) : (
              items.map((item) => {
                const isEnabled = permissions[item.normalizedName] ?? item.enabled ?? false;
                return (
                  <div
                    key={item.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      {item.category && (
                        <div className="text-sm text-gray-500 mt-1">
                          {item.category}
                          {item.itemType && ` • ${item.itemType}`}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) =>
                            handleCheckboxChange(item.normalizedName, e.target.checked)
                          }
                          className="w-5 h-5 text-[#0C2340] border-gray-300 rounded focus:ring-[#0C2340] focus:ring-2"
                        />
                        <span
                          className={`ml-2 text-sm font-medium ${
                            isEnabled ? "text-green-600" : "text-gray-500"
                          }`}
                        >
                          {isEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </label>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItemPermissionsStep;
