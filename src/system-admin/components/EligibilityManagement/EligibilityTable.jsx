import React from "react";
import { Trash2 } from "lucide-react";

/**
 * EligibilityTable Component
 *
 * Displays items in a table format with eligibility checkboxes for each education level
 * Columns: Item Name, Preschool, Elementary, JHS, SHS, College
 *
 * Props:
 * - items: Array of item objects with eligibility data
 * - loading: Boolean indicating loading state
 * - isEditMode: Boolean indicating if table is in edit mode
 * - onEligibilityChange: Function(itemId, eligibility) - Called when checkbox is toggled
 * - onDeleteItem: Function(itemId) - Called when delete button is clicked
 * - getItemEligibility: Function(item) - Returns current eligibility for an item
 */
const EligibilityTable = ({
  items,
  loading,
  isEditMode,
  onEligibilityChange,
  onDeleteItem,
  getItemEligibility,
}) => {
  /**
   * Handle checkbox change for a single level
   */
  const handleCheckboxChange = (itemId, field, checked) => {
    const currentEligibility = getItemEligibility(
      items.find((item) => item.id === itemId)
    );
    const updatedEligibility = {
      ...currentEligibility,
      [field]: checked,
    };
    onEligibilityChange(itemId, updatedEligibility);
  };

  /**
   * Handle "All Education Levels" checkbox: check/uncheck Preschool through College at once
   */
  const handleAllLevelsChange = (itemId, checked) => {
    const updatedEligibility = {
      isPreschoolEligible: checked,
      isElementaryEligible: checked,
      isJHSEligible: checked,
      isSHSEligible: checked,
      isCollegeEligible: checked,
    };
    onEligibilityChange(itemId, updatedEligibility);
  };

  const isAllLevelsChecked = (eligibility) =>
    eligibility.isPreschoolEligible &&
    eligibility.isElementaryEligible &&
    eligibility.isJHSEligible &&
    eligibility.isSHSEligible &&
    eligibility.isCollegeEligible;

  /**
   * Handle delete button click
   */
  const handleDelete = (itemId, itemName) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      )
    ) {
      onDeleteItem(itemId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading items...</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
        <thead>
          <tr className="bg-[#003363] text-white">
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">
              Item Name
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white" title="Check to make item available for all levels (Preschool through College)">
              All Levels
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              Preschool
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              Elementary
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              JHS
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              SHS
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-white">
              College
            </th>
            {isEditMode && (
              <th className="px-4 py-3 text-center text-sm font-semibold text-white">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={isEditMode ? 8 : 7}
                className="px-4 py-12 text-center"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-gray-50 rounded-full p-4 mb-4">
                    <Trash2 className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No items found
                  </h3>
                  <p className="text-sm text-gray-500">
                    Try adjusting your search criteria.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const eligibility = getItemEligibility(item);
              const isPlaceholder = item._placeholder === true;
              const canEdit = isEditMode && !isPlaceholder;
              return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-100 transition-colors ${
                    isPlaceholder ? "bg-gray-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Item Name */}
                  <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                    {item.name}
                    {isPlaceholder && (
                      <span className="ml-2 text-xs text-gray-500 font-normal">
                        (not in inventory yet)
                      </span>
                    )}
                  </td>

                  {/* All Education Levels: one click to check Preschool through College */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isAllLevelsChecked(eligibility)}
                      onChange={(e) =>
                        handleAllLevelsChange(item.id, e.target.checked)
                      }
                      disabled={!canEdit}
                      className="eligibility-checkbox"
                      title="Check to make this item available for all education levels (Preschool through College)"
                    />
                  </td>

                  {/* Preschool Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={eligibility.isPreschoolEligible || false}
                      onChange={(e) =>
                        handleCheckboxChange(
                          item.id,
                          "isPreschoolEligible",
                          e.target.checked
                        )
                      }
                      disabled={!canEdit}
                      className="eligibility-checkbox"
                    />
                  </td>

                  {/* Elementary Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={eligibility.isElementaryEligible || false}
                      onChange={(e) =>
                        handleCheckboxChange(
                          item.id,
                          "isElementaryEligible",
                          e.target.checked
                        )
                      }
                      disabled={!canEdit}
                      className="eligibility-checkbox"
                    />
                  </td>

                  {/* JHS Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={eligibility.isJHSEligible || false}
                      onChange={(e) =>
                        handleCheckboxChange(
                          item.id,
                          "isJHSEligible",
                          e.target.checked
                        )
                      }
                      disabled={!canEdit}
                      className="eligibility-checkbox"
                    />
                  </td>

                  {/* SHS Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={eligibility.isSHSEligible || false}
                      onChange={(e) =>
                        handleCheckboxChange(
                          item.id,
                          "isSHSEligible",
                          e.target.checked
                        )
                      }
                      disabled={!canEdit}
                      className="eligibility-checkbox"
                    />
                  </td>

                  {/* College Checkbox */}
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={eligibility.isCollegeEligible || false}
                      onChange={(e) =>
                        handleCheckboxChange(
                          item.id,
                          "isCollegeEligible",
                          e.target.checked
                        )
                      }
                      disabled={!canEdit}
                      className="eligibility-checkbox"
                    />
                  </td>

                  {/* Delete Button (only in edit mode, and only for items in inventory) */}
                  {isEditMode && (
                    <td className="px-4 py-4 text-center">
                      {isPlaceholder ? (
                        <span className="text-gray-400" title="Add this item in Property Custodian to manage eligibility">—</span>
                      ) : (
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EligibilityTable;
