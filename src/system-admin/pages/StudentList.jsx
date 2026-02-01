import React, { useState, useEffect, useCallback } from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import StudentTable from "../components/StudentManagement/StudentTable";
import StudentFilters from "../components/StudentManagement/StudentFilters";
import EditTableModal from "../components/StudentManagement/EditTableModal";
import EditStudentOrderLimitsModal from "../components/StudentManagement/EditStudentOrderLimitsModal";
import DeleteStudentModal from "../components/StudentManagement/DeleteStudentModal";
import AddStudentModal from "../components/StudentManagement/AddStudentModal";
import UserModal from "../components/UserManagement/UserModal";
import { useUsers } from "../hooks/useUsers";
import { useSocketStudentUpdates } from "../hooks/useSocketStudentUpdates";
import { userAPI } from "../../services/user.service";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, GraduationCap, FileCheck, DollarSign, XCircle, FileX } from "lucide-react";
import { mapEducationLevelToDB, mapGradeLevelToDB } from "../utils/educationLevelMapper";

/**
 * StudentList Page
 * 
 * Displays a list of all students with filtering and management capabilities
 */
const StudentList = () => {
  const [search, setSearch] = useState("");
  const [schoolYear, setSchoolYear] = useState(() => {
    // Set default to current school year
    const currentYear = new Date().getFullYear();
    return `S.Y. ${currentYear} - ${currentYear + 1}`;
  });
  const [educationLevel, setEducationLevel] = useState("All Education Levels");
  const [gradeLevel, setGradeLevel] = useState("Grade Level");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [isOrderLimitsModalOpen, setIsOrderLimitsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPage, setEditingPage] = useState(false);
  const [pageInputValue, setPageInputValue] = useState("");
  
  // Delete student confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const { 
    users, 
    loading, 
    pagination, 
    fetchUsers, 
    createUser,
    updateUser, 
    deleteUser,
  } = useUsers();

  // Extract year from school year string (e.g., "S.Y. 2029 - 2030" -> "29")
  // Handles formats: "S.Y. 2029 - 2030", "S.Y. 2029-2030", "2029-2030", etc.
  const extractYearFromSchoolYear = (schoolYearStr) => {
    if (!schoolYearStr) {
      console.log(`[extractYearFromSchoolYear] Empty schoolYearStr, returning ""`);
      return "";
    }
    // Extract the start year from various formats:
    // - "S.Y. 2029 - 2030"
    // - "S.Y. 2029-2030"
    // - "2029-2030"
    // - "2029 - 2030"
    const match = schoolYearStr.match(/(\d{4})\s*-\s*\d{4}/);
    if (match) {
      const fullYear = parseInt(match[1]);
      // Convert to 2-digit format (e.g., 2029 -> "29", 2026 -> "26")
      // This matches the student_number prefix format (e.g., "29-11223" for school year 2029-2030)
      const twoDigitYear = String(fullYear).slice(-2);
      console.log(`[extractYearFromSchoolYear] Extracted "${twoDigitYear}" from "${schoolYearStr}" (fullYear: ${fullYear})`);
      return twoDigitYear;
    }
    console.log(`[extractYearFromSchoolYear] No match found for "${schoolYearStr}", returning ""`);
    return "";
  };

  // Check if the selected school year is in the future
  const isFutureSchoolYear = (schoolYearStr) => {
    if (!schoolYearStr) return false;
    const match = schoolYearStr.match(/(\d{4})\s*-\s*\d{4}/);
    if (match) {
      const startYear = parseInt(match[1]);
      const currentYear = new Date().getFullYear();
      // Current school year is currentYear to currentYear + 1
      // So a school year is "future" if its start year is greater than currentYear
      return startYear > currentYear;
    }
    return false;
  };

  // Function to refresh student list with current filters
  const refreshStudentList = useCallback(() => {
    const mappedEducationLevel = mapEducationLevelToDB(educationLevel);
    const mappedGradeLevel = mapGradeLevelToDB(gradeLevel);
    const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
    
    fetchUsers({
      page: currentPage,
      search: search || "",
      role: "student",
      education_level: mappedEducationLevel,
      course_year_level: mappedGradeLevel,
      school_year: schoolYearPrefix,
    });
  }, [currentPage, search, educationLevel, gradeLevel, schoolYear, fetchUsers]);

  // Fetch students when filters change (reset to page 1)
  // This handles both initial load and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      const mappedEducationLevel = mapEducationLevelToDB(educationLevel);
      const mappedGradeLevel = mapGradeLevelToDB(gradeLevel);
      const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
      const isFuture = isFutureSchoolYear(schoolYear);
      
      // Debug logging
      console.log(`[StudentList] Fetching with filters:`, {
        educationLevel,
        mappedEducationLevel,
        mappedEducationLevelType: typeof mappedEducationLevel,
        mappedEducationLevelLength: mappedEducationLevel?.length,
        gradeLevel,
        mappedGradeLevel,
        schoolYear,
        schoolYearPrefix,
        schoolYearPrefixType: typeof schoolYearPrefix,
        schoolYearPrefixLength: schoolYearPrefix?.length,
        isFutureSchoolYear: isFuture,
        willFilterBySchoolYear: schoolYearPrefix !== "" && schoolYearPrefix !== null
      });
      
      // IMPORTANT: For future school years, always send the school_year filter
      // This ensures backend filters out students from current/past years
      // Even if somehow students exist with that year prefix, they shouldn't be enrolled yet
      fetchUsers({
        page: 1,
        search: search || "",
        role: "student", // Always filter by student role
        education_level: mappedEducationLevel,
        course_year_level: mappedGradeLevel,
        school_year: schoolYearPrefix, // Pass 2-digit year prefix (e.g., "28" for 2028-2029)
        // Backend will filter by student_number prefix, ensuring only students
        // enrolled in that specific school year are shown
      });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, educationLevel, gradeLevel, schoolYear]);

  // Handle real-time student updates via WebSocket
  const handleStudentUpdate = useCallback((event) => {
    const { type, data } = event;
    console.log(`📡 [StudentList] Received student update: ${type}`, data);

    // Refresh the student list to reflect changes
    // This ensures the list stays in sync with the current filters
    refreshStudentList();

    // Show toast notifications for user feedback
    switch (type) {
      case "created":
        // Don't show toast for created - the modal already shows success
        break;
      case "updated":
        // Don't show toast for updated - the modal already shows success
        break;
      case "deleted":
        // Don't show toast for deleted - the modal already shows success
        break;
      case "bulk-updated":
        // Don't show toast for bulk updated - the modal already shows success
        break;
      default:
        console.log(`📡 [StudentList] Unknown student update type: ${type}`);
    }
  }, [refreshStudentList]);

  // Connect to WebSocket for real-time updates
  useSocketStudentUpdates(handleStudentUpdate);

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
      fetchUsers({
        page: nextPage,
        search: search || "",
        role: "student",
        education_level: mapEducationLevelToDB(educationLevel),
        course_year_level: mapGradeLevelToDB(gradeLevel),
        school_year: schoolYearPrefix,
      });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
      fetchUsers({
        page: prevPage,
        search: search || "",
        role: "student",
        education_level: mapEducationLevelToDB(educationLevel),
        course_year_level: mapGradeLevelToDB(gradeLevel),
        school_year: schoolYearPrefix,
      });
    }
  };

  const handleGoToPage = (pageNumber) => {
    const page = parseInt(pageNumber);
    if (isNaN(page) || page < 1 || page > pagination.totalPages) {
      toast.error(`Please enter a page number between 1 and ${pagination.totalPages}`);
      setEditingPage(false);
      return;
    }
    setCurrentPage(page);
    setEditingPage(false);
    const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
    fetchUsers({
      page: page,
      search: search || "",
      role: "student",
      education_level: mapEducationLevelToDB(educationLevel),
      course_year_level: mapGradeLevelToDB(gradeLevel),
      school_year: schoolYearPrefix,
    });
  };

  const handlePageClick = () => {
    setEditingPage(true);
    setPageInputValue(currentPage.toString());
  };

  const handlePageInputBlur = () => {
    if (pageInputValue && pageInputValue !== currentPage.toString()) {
      handleGoToPage(pageInputValue);
    } else {
      setEditingPage(false);
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGoToPage(pageInputValue);
    } else if (e.key === "Escape") {
      setEditingPage(false);
      setPageInputValue("");
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === users.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(users.map((user) => user.id));
    }
  };

  const handleEditStudent = async (student) => {
    try {
      const response = await userAPI.getUserById(student.id);
      if (response.data && response.data.success) {
        setEditingStudent(response.data.data);
      } else {
        setEditingStudent(student);
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      setEditingStudent(student);
    }
    setIsOrderLimitsModalOpen(true);
  };

  const handleSaveOrderLimits = async (updateData) => {
    if (!editingStudent) return;
    try {
      const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
      const refreshParams = {
        page: currentPage,
        search: search || "",
        role: "student",
        education_level: mapEducationLevelToDB(educationLevel),
        course_year_level: mapGradeLevelToDB(gradeLevel),
        school_year: schoolYearPrefix,
      };
      await updateUser(editingStudent.id, updateData, refreshParams);
      toast.success("Order limits updated successfully");
      setIsOrderLimitsModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      toast.error(error.message || "Failed to update order limits");
    }
  };

  const handleSaveStudent = async (studentData) => {
    try {
      const refreshParams = {
        search: search || "",
        role: "student",
        education_level: mapEducationLevelToDB(educationLevel),
        course_year_level: mapGradeLevelToDB(gradeLevel),
      };

      if (editingStudent) {
        await updateUser(editingStudent.id, studentData, refreshParams);
        toast.success("Student updated successfully");
      }
      setIsUserModalOpen(false);
      setEditingStudent(null);
    } catch (error) {
      toast.error(error.message || "Failed to save student");
    }
  };

  // Calculate education level from course year level (same logic as EditStudentOrderLimitsModal)
  const getEducationLevel = (courseYearLevel) => {
    if (!courseYearLevel) return null;
    if (courseYearLevel === "Prekindergarten" || courseYearLevel === "Kindergarten" || courseYearLevel === "Kinder") {
      return "Kindergarten";
    }
    if (courseYearLevel.match(/^Grade [1-6]$/)) {
      return "Elementary";
    }
    if (courseYearLevel.match(/^Grade (7|8|9|10)$/)) {
      return "Junior High School";
    }
    if (courseYearLevel.match(/^Grade (11|12)$/)) {
      return "Senior High School";
    }
    if (courseYearLevel.match(/^(BSIS|BSA|BSAIS|BSSW|BAB|ACT) (1st|2nd|3rd|4th) (Year|yr)$/i)) {
      return "College";
    }
    return null;
  };

  const handleAddStudent = async (studentData) => {
    try {
      // Calculate education_level from course_year_level
      const calculatedEducationLevel = getEducationLevel(studentData.course_year_level);
      if (calculatedEducationLevel) {
        studentData.education_level = calculatedEducationLevel;
      }

      const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
      const refreshParams = {
        page: currentPage,
        search: search || "",
        role: "student",
        education_level: mapEducationLevelToDB(educationLevel),
        course_year_level: mapGradeLevelToDB(gradeLevel),
        school_year: schoolYearPrefix,
      };
      await createUser(studentData, refreshParams);
      toast.success("Student created successfully");
      setIsAddStudentModalOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to create student");
    }
  };

  const handleDeleteStudent = (studentId) => {
    const student = users.find((u) => u.id === studentId);
    setStudentToDelete({ id: studentId, name: student?.name || "this student" });
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
      const refreshParams = {
        page: currentPage,
        search: search || "",
        role: "student",
        education_level: mapEducationLevelToDB(educationLevel),
        course_year_level: mapGradeLevelToDB(gradeLevel),
        school_year: schoolYearPrefix,
      };
      await deleteUser(studentToDelete.id, refreshParams);
      toast.success("Student deleted successfully");
      // Remove from selected if it was selected
      setSelectedStudents((prev) => prev.filter((id) => id !== studentToDelete.id));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete student");
    }
  };

  const handleBulkUpdate = async (updateData) => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student to update");
      return;
    }

    try {
      // Call bulk update API
      const response = await userAPI.bulkUpdateUsers(selectedStudents, updateData);
      if (response.data && response.data.success) {
        toast.success(`Updated ${selectedStudents.length} student(s) successfully`);
        setIsEditTableModalOpen(false);
        setSelectedStudents([]);
        // Refresh the list
        const schoolYearPrefix = extractYearFromSchoolYear(schoolYear);
        fetchUsers({
          page: currentPage,
          search: search || "",
          role: "student",
          education_level: mapEducationLevelToDB(educationLevel),
          course_year_level: mapGradeLevelToDB(gradeLevel),
          school_year: schoolYearPrefix,
        });
      } else {
        throw new Error(response.data?.message || "Failed to update students");
      }
    } catch (error) {
      console.error("Error bulk updating students:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update students");
    }
  };

  // Calculate stats based on enrollment status
  // If it's a future school year, show 0 for all stats since no enrollments exist yet
  const isFuture = isFutureSchoolYear(schoolYear);
  const stats = {
    totalStudents: isFuture ? 0 : (pagination.total || 0),
    currentlyEnrolled: isFuture ? 0 : (pagination.total || 0),
    eligibleForEnrollment: isFuture ? 0 : users.filter((u) => u.enrollment_status === "eligible_for_enrollment").length,
    notEligible: isFuture ? 0 : users.filter((u) => u.enrollment_status === "not_eligible").length,
    droppedOfficially: isFuture ? 0 : users.filter((u) => u.enrollment_status === "dropped_officially").length,
  };

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-[#0C2340]">
            List of <span className="text-[#e68b00]">Students</span>
          </h1>
        </div>

        {/* Stats Cards - 5 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Total Students (filtered by current selection) */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full p-3 mb-3">
                <GraduationCap className="text-blue-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-blue-600 mb-1">{stats.totalStudents}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </div>

          {/* Currently Enrolled */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 rounded-full p-3 mb-3">
                <FileCheck className="text-green-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">{stats.currentlyEnrolled}</p>
              <p className="text-sm text-gray-600">Currently Enrolled</p>
            </div>
          </div>

          {/* Eligible for Enrollment */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="bg-yellow-100 rounded-full p-3 mb-3">
                <GraduationCap className="text-yellow-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-yellow-600 mb-1">{stats.eligibleForEnrollment}</p>
              <p className="text-sm text-gray-600">Eligible for Enrollment</p>
            </div>
          </div>

          {/* Not Eligible for Enrollment */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="bg-orange-100 rounded-full p-3 mb-3">
                <XCircle className="text-orange-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-orange-600 mb-1">{stats.notEligible}</p>
              <p className="text-sm text-gray-600">Not Eligible for Enrollment</p>
            </div>
          </div>

          {/* Dropped Officially */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 rounded-full p-3 mb-3">
                <FileX className="text-red-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-red-600 mb-1">{stats.droppedOfficially}</p>
              <p className="text-sm text-gray-600">Dropped Officially</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <StudentFilters
          search={search}
          onSearchChange={setSearch}
          schoolYear={schoolYear}
          onSchoolYearChange={setSchoolYear}
          educationLevel={educationLevel}
          onEducationLevelChange={setEducationLevel}
          gradeLevel={gradeLevel}
          onGradeLevelChange={setGradeLevel}
          onEditTable={() => setIsEditTableModalOpen(true)}
          onAddUser={() => setIsAddStudentModalOpen(true)}
          selectedCount={selectedStudents.length}
        />

        {/* Student Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading students...</div>
          </div>
        ) : (
          <>
            <StudentTable
              students={isFutureSchoolYear(schoolYear) ? [] : users}
              selectedStudents={selectedStudents}
              onSelectStudent={handleSelectStudent}
              onSelectAll={handleSelectAll}
              onEditStudent={handleEditStudent}
              onDeleteStudent={handleDeleteStudent}
              schoolYear={schoolYear}
              isFutureSchoolYear={isFutureSchoolYear(schoolYear)}
            />
            
            {/* Pagination Controls */}
            {pagination.totalPages > 0 && (
              <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-lg shadow-sm">
                {/* Left: Page Indicator with Editable Page Number */}
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  Page{" "}
                  {editingPage ? (
                    <input
                      type="number"
                      min="1"
                      max={pagination.totalPages}
                      value={pageInputValue}
                      onChange={(e) => setPageInputValue(e.target.value)}
                      onBlur={handlePageInputBlur}
                      onKeyDown={handlePageInputKeyDown}
                      autoFocus
                      className="w-12 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] text-sm text-center font-semibold"
                    />
                  ) : (
                    <span
                      className="font-semibold cursor-pointer hover:text-[#0C2340] hover:underline"
                      onClick={handlePageClick}
                      title="Click to edit page number"
                    >
                      {currentPage}
                    </span>
                  )}{" "}
                  of <span className="font-semibold">{pagination.totalPages}</span>
                </div>

                {/* Right: Navigation Buttons */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0C2340] hover:text-white hover:border-[#0C2340] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-colors flex items-center gap-1 font-medium text-sm"
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                  </button>

                  {/* Next Button */}
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-[#0C2340] hover:text-white hover:border-[#0C2340] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300 transition-colors flex items-center gap-1 font-medium text-sm"
                    title="Next page"
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Table Modal (bulk) */}
        <EditTableModal
          isOpen={isEditTableModalOpen}
          onClose={() => setIsEditTableModalOpen(false)}
          selectedCount={selectedStudents.length}
          selectedStudents={users.filter((user) => selectedStudents.includes(user.id))}
          onSave={handleBulkUpdate}
        />

        {/* Edit Order Limits Modal (single student, row pencil) */}
        <EditStudentOrderLimitsModal
          isOpen={isOrderLimitsModalOpen}
          onClose={() => {
            setIsOrderLimitsModalOpen(false);
            setEditingStudent(null);
          }}
          student={editingStudent}
          onSave={handleSaveOrderLimits}
        />

        {/* User Modal (for editing user details; not opened from row pencil) */}
        <UserModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setEditingStudent(null);
          }}
          user={editingStudent}
          onSave={handleSaveStudent}
        />

        {/* Add Student Modal */}
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          onSave={handleAddStudent}
          educationLevels={[
            "Preschool",
            "Elementary",
            "Junior Highschool",
            "Senior Highschool",
            "College",
          ]}
          gradeLevelOptions={(() => {
            // Get grade level options based on current education level
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
                "Preschool": ["Grade Level", "Prekindergarten", "Kindergarten"],
                "Elementary": ["Grade Level", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
                "Junior Highschool": ["Grade Level", "Grade 7", "Grade 8", "Grade 9", "Grade 10"],
                "Senior Highschool": ["Grade Level", "Grade 11", "Grade 12"],
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
            return getGradeLevelOptions(educationLevel === "All Education Levels" ? "All Education Levels" : educationLevel);
          })()}
        />

        {/* Delete Student Confirmation Modal */}
        <DeleteStudentModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setStudentToDelete(null);
          }}
          onConfirm={confirmDeleteStudent}
          studentName={studentToDelete?.name || ""}
        />
      </div>
    </SystemAdminLayout>
  );
};

export default StudentList;
