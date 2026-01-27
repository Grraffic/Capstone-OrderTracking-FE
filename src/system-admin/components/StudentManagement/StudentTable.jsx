import React from "react";
import { Edit, Trash2, MoreVertical, User, Calendar, Info } from "lucide-react";

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

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
        <thead>
          <tr className="bg-[#003363] text-white">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-white focus:ring-white"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Student ID</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Student Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Grade Level</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Max Items Per Order</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Order Lockout Period</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Action</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-4 py-12">
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
            students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4">
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
                    {getAvatarUrl(student) ? (
                      <img
                        src={getAvatarUrl(student)}
                        alt={student.name || "Student"}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={14} className="text-gray-500" />
                      </div>
                    )}
                    <span>{student.name || "N/A"}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {student.course_year_level || "N/A"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {student.max_items_per_order !== null && student.max_items_per_order !== undefined
                    ? student.max_items_per_order
                    : "N/A"}
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  {student.order_lockout_period !== null && student.order_lockout_period !== undefined
                    ? student.order_lockout_period
                    : "N/A"}
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
                    <button
                      className="text-gray-600 hover:text-gray-800 transition-colors"
                      title="More options"
                    >
                      <MoreVertical size={16} />
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
