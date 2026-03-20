import React, { useState } from "react";
import { Edit, Trash2, User, Calendar } from "lucide-react";
import { splitDisplayName } from "../../../utils/displayName";

/**
 * Avatar cell with fallback when image fails to load
 */
const AvatarCell = ({ student, getAvatarUrl }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const url = getAvatarUrl(student);
  const { displayName } = splitDisplayName(student.name || "");
  const initial = (displayName || "S").charAt(0).toUpperCase();

  if (!url || imgFailed) {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <span className="text-xs font-medium text-gray-600">{initial}</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={student.name || "Student"}
      className="w-6 h-6 rounded-full object-cover shrink-0"
      onError={() => setImgFailed(true)}
    />
  );
};

/**
 * Format grade level for display: remove "1st/2nd/3rd/4th year" or "yr" so only the number remains.
 */
const formatGradeLevelDisplay = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/\s*1st\s*(?:year|yr)?\s*$/i, " 1")
    .replace(/\s*2nd\s*(?:year|yr)?\s*$/i, " 2")
    .replace(/\s*3rd\s*(?:year|yr)?\s*$/i, " 3")
    .replace(/\s*4th\s*(?:year|yr)?\s*$/i, " 4");
};

/**
 * StudentTable Component
 * 
 * Displays students in a table format with specific columns for student management
 */
const StudentTable = ({ 
  students, 
  selectedStudents, 
  onSelectStudent, 
  onSelectAll, 
  onEditStudent, 
  onDeleteStudent,
  onToggleActive,
  schoolYear = "",
  isFutureSchoolYear = false
}) => {
  // Format student ID from student_number (e.g., "22-000029MLR" -> "22 - 000029MLR")
  const formatStudentId = (studentNumber) => {
    if (!studentNumber) return "N/A";
    // If already formatted, return as is
    if (studentNumber.includes(" - ")) return studentNumber;
    // Format: "22-000029MLR" -> "22 - 000029MLR"
    const parts = studentNumber.split("-");
    if (parts.length >= 2) {
      return `${parts[0]} - ${parts.slice(1).join("-")}`;
    }
    return studentNumber;
  };

  // Get avatar URL or use default
  const getAvatarUrl = (student) => {
    return student.avatar_url || student.photo_url || null;
  };

  // Effective max items: if voided (unclaimed order), show 0; else admin override if set; else derived from student_type (8 new, 2 old)
  const getEffectiveMaxItemsPerOrder = (student) => {
    if (student.blocked_due_to_void === true) {
      return { value: 0, isOverride: false, isVoided: true };
    }
    if (student.total_item_limit != null && Number(student.total_item_limit) > 0) {
      return { value: Number(student.total_item_limit), isOverride: true, isVoided: false };
    }
    const st = (student.student_type || "").toLowerCase();
    if (st === "new") return { value: 8, isOverride: false, isVoided: false };
    if (st === "old") return { value: 2, isOverride: false, isVoided: false };
    return { value: null, isOverride: false, isVoided: false };
  };

  const sortedStudents = [...students].sort((a, b) => {
    const aIsVoided = a.blocked_due_to_void === true || Number(a.total_item_limit) === 0;
    const bIsVoided = b.blocked_due_to_void === true || Number(b.total_item_limit) === 0;

    const aIsInactive = a.is_active === false || a.status === "inactive";
    const bIsInactive = b.is_active === false || b.status === "inactive";

    // Voided students always at the very end.
    if (aIsVoided !== bIsVoided) return aIsVoided ? 1 : -1;

    // Non-voided inactive students go after active students.
    if (aIsInactive !== bIsInactive) return aIsInactive ? 1 : -1;

    return 0;
  });

  const ToggleSwitch = ({ isActive, studentId, onToggle }) => {
    if (typeof onToggle !== "function") {
      return <span className="text-sm text-gray-700">{isActive ? "Yes" : "No"}</span>;
    }

    return (
      <button
        type="button"
        onClick={() => onToggle(studentId, isActive)}
        className={`relative inline-flex h-5 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:ring-offset-2 px-1 ${
          isActive ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute text-xs font-bold whitespace-nowrap z-10 ${
            isActive ? "text-white left-2" : "text-gray-700 right-2"
          }`}
        >
          {isActive ? "Yes" : "No"}
        </span>
        <span
          className={`absolute inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            isActive ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
        <thead>
          <tr className="bg-[#003363] text-white">
            <th className="hidden px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-white focus:ring-white"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Student ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Student Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Education Level</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Grade Level</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Gender</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Is Active</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Total Item Limit</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Total Items Ordered</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.length === 0 ? (
            <tr>
              <td colSpan="10" className="px-4 py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  {isFutureSchoolYear ? (
                    <>
                      <div className="bg-blue-50 rounded-full p-4 mb-4">
                        <Calendar className="text-blue-500" size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No student enrollments yet for the selected school year
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md">
                        {schoolYear ? (
                          <>Students will appear once enrollment for <span className="font-medium text-gray-700">{schoolYear}</span> begins.</>
                        ) : (
                          "Students will appear once enrollment for this school year begins."
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-full p-4 mb-4">
                        <User className="text-gray-400" size={32} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No students found
                      </h3>
                      <p className="text-sm text-gray-500">
                        Try adjusting your filters or search criteria.
                      </p>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            sortedStudents.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="hidden px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => onSelectStudent(student.id)}
                    className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                  />
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {formatStudentId(student.student_number)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="flex items-center gap-2">
                    <AvatarCell student={student} getAvatarUrl={getAvatarUrl} />
                    <span>{splitDisplayName(student.name || "").displayName || "N/A"}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {student.education_level || "N/A"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {formatGradeLevelDisplay(student.course_year_level) || "N/A"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {student.gender || "N/A"}
                </td>
                <td className="px-4 py-4">
                  <ToggleSwitch
                    isActive={student.is_active ?? student.status !== "inactive"}
                    studentId={student.id}
                    onToggle={onToggleActive}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {(() => {
                    const { value: max, isOverride, isVoided } = getEffectiveMaxItemsPerOrder(student);
                    if (max == null) {
                      return (
                        <span className="inline-flex items-center gap-2">
                          <span>N/A</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Set limit
                          </span>
                        </span>
                      );
                    }
                    if (isVoided) {
                      return (
                        <span className="inline-flex items-center gap-2">
                          <span>0</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            Voided (unclaimed)
                          </span>
                        </span>
                      );
                    }
                    // Show the stored total item limit (what the admin set)
                    return (
                      <span className="font-medium text-gray-900">{max}</span>
                    );
                  })()}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {student.slots_used_from_placed_orders != null
                    ? Number(student.slots_used_from_placed_orders)
                    : "—"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEditStudent(student)}
                      className="text-[#0C2340] hover:text-[#e68b00] transition-colors"
                      title="Edit student"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteStudent(student.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete student"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;
