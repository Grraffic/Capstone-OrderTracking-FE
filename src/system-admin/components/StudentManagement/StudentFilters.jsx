import React, { useState, useMemo } from "react";
import { Search, Calendar, Edit, UserPlus } from "lucide-react";

/**
 * StudentFilters Component
 * 
 * Provides search, school year selector, education level filter, grade level filter, and Edit Table button
 */
const StudentFilters = ({
  search,
  onSearchChange,
  schoolYear,
  onSchoolYearChange,
  educationLevel,
  onEducationLevelChange,
  gradeLevel,
  onGradeLevelChange,
  onEditTable,
  onAddUser,
  selectedCount,
}) => {
  // Education level options - matching property custodian
  const educationLevels = [
    "All Education Levels",
    "Preschool",
    "Elementary",
    "Junior Highschool",
    "Senior Highschool",
    "College",
  ];

  // Grade level options based on education level - matching property custodian
  const getGradeLevelOptions = (eduLevel) => {
    const gradeLevelMap = {
      "All Education Levels": [
        "Grade Level",
        "Prekindergarten",
        "Kindergarten",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
        "Grade 11",
        "Grade 12",
        "BSA 1st yr",
        "BSA 2nd yr",
        "BSA 3rd yr",
        "BSA 4th yr",
        "BSAIS 1st year",
        "BSAIS 2nd year",
        "BSAIS 3rd year",
        "BSAIS 4th year",
        "BAB 1st year",
        "BAB 2nd year",
        "BAB 3rd year",
        "BAB 4th year",
        "BSSW 1st year",
        "BSSW 2nd year",
        "BSSW 3rd year",
        "BSSW 4th year",
        "BSIS 1st year",
        "BSIS 2nd year",
        "BSIS 3rd year",
        "BSIS 4th year",
        "ACT 1st year",
        "ACT 2nd year",
      ],
      "Preschool": [
        "Grade Level",
        "Prekindergarten",
        "Kindergarten",
      ],
      "Elementary": [
        "Grade Level",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
      ],
      "Junior Highschool": [
        "Grade Level",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
      ],
      "Senior Highschool": [
        "Grade Level",
        "Grade 11",
        "Grade 12",
      ],
      "College": [
        "Grade Level",
        "BSA 1st yr",
        "BSA 2nd yr",
        "BSA 3rd yr",
        "BSA 4th yr",
        "BSAIS 1st yr",
        "BSAIS 2nd yr",
        "BSAIS 3rd yr",
        "BSAIS 4th yr",
        "BAB 1st yr",
        "BAB 2nd yr",
        "BAB 3rd yr",
        "BAB 4th yr",
        "BSSW 1st yr",
        "BSSW 2nd yr",
        "BSSW 3rd yr",
        "BSSW 4th yr",
        "BSIS 1st yr",
        "BSIS 2nd yr",
        "BSIS 3rd yr",
        "BSIS 4th yr",
        "ACT 1st yr",
        "ACT 2nd yr",
      ],
    };

    return gradeLevelMap[eduLevel] || ["Grade Level"];
  };

  const gradeLevelOptions = useMemo(() => {
    return getGradeLevelOptions(educationLevel);
  }, [educationLevel]);

  // Generate school year options for Quick Select (2025-2026 to 2029-2030)
  const generateQuickSelectSchoolYears = () => {
    const years = [];
    for (let year = 2025; year <= 2029; year++) {
      years.push(`S.Y. ${year} - ${year + 1}`);
    }
    // Reverse so most recent years appear first
    return years.reverse();
  };

  const quickSelectSchoolYearOptions = useMemo(() => generateQuickSelectSchoolYears(), []);

  // Reset grade level when education level changes
  const handleEducationLevelChange = (value) => {
    onEducationLevelChange(value);
    onGradeLevelChange("Grade Level");
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* School Year Selector - Top Row, Right Aligned */}
      <div className="flex items-center gap-2 justify-end">
        <div className="relative w-56">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={schoolYear}
            onChange={(e) => onSchoolYearChange(e.target.value)}
            placeholder="S.Y. 2026 - 2027"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white"
          />
        </div>
        {/* Quick select dropdown (2025-2026 to 2029-2030) */}
        <div className="relative">
          <select
            onChange={(e) => {
              if (e.target.value) {
                onSchoolYearChange(e.target.value);
              }
            }}
            value=""
            className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white appearance-none text-gray-600"
          >
            <option value="" disabled>Quick Select</option>
            {quickSelectSchoolYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search, Filters, and Edit Table Button - Second Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
          />
        </div>

        {/* Education Level Filter */}
        <select
          value={educationLevel}
          onChange={(e) => handleEducationLevelChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white"
        >
          {educationLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        {/* Grade Level Filter */}
        <select
          value={gradeLevel}
          onChange={(e) => onGradeLevelChange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white"
        >
          {gradeLevelOptions.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        {/* Add User and Edit Table Buttons - Right side */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onAddUser}
            className="flex items-center gap-2 px-4 py-2 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97a1f] transition-colors font-medium"
            title="Add new student"
          >
            <UserPlus size={20} />
            <span className="hidden sm:inline">Add User</span>
          </button>
          <button
            onClick={onEditTable}
            className="flex items-center gap-2 px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors font-medium"
            title={selectedCount === 0 ? "Select students first to edit their settings" : `Edit ${selectedCount} selected student(s)`}
          >
            <Edit size={20} />
            <span className="hidden sm:inline">Edit Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentFilters;
