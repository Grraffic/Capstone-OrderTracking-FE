import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PRODUCT_CATEGORIES } from "../../constants/studentProducts";

const CategorySidebar = ({ selectedCategory, onCategoryChange }) => {
  const [expandedCategories, setExpandedCategories] = useState(["uniform"]);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isActive = (categoryValue) => selectedCategory === categoryValue;

  return (
    <div
      className="sticky top-20 space-y-3 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar pr-2"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#d1d5db #f3f4f6",
      }}
    >
      <h2 className="text-2xl font-bold text-[#003363] mb-6">Categories</h2>

      <div className="space-y-2">
        {PRODUCT_CATEGORIES.map((category) => (
          <div key={category.id}>
            {/* Main Category */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => onCategoryChange(category.value)}
                className={`flex-1 text-left px-5 py-3 rounded-full transition-all duration-200 font-medium ${
                  isActive(category.value)
                    ? "bg-[#003363] text-white shadow-md"
                    : "text-[#003363] hover:bg-gray-100"
                }`}
              >
                {category.label}
              </button>

              {/* Expand/Collapse Button for categories with subcategories */}
              {category.subcategories && (
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                  {expandedCategories.includes(category.id) ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
            </div>

            {/* Subcategories */}
            {category.subcategories &&
              expandedCategories.includes(category.id) && (
                <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                  {category.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => onCategoryChange(subcategory.value)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                        isActive(subcategory.value)
                          ? "bg-[#F28C28] text-white font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {subcategory.label}
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySidebar;
