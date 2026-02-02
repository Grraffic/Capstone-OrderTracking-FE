import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * EmployeeList Component
 *
 * Displays list of employees (system_admin and property_custodian roles)
 * Shows name, email, role, status, and last login
 *
 * Props:
 * - employees: Array of employee objects
 */
const EmployeeList = ({ employees = [] }) => {
  const navigate = useNavigate();

  // Helper function to format role display
  const getRoleDisplay = (role) => {
    if (!role) return "N/A";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0C2340]">
          <span className="text-[#e68b00]">Employees</span>
        </h2>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No employees found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  NAME
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  EMAIL
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  ROLE
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  LAST LOGIN
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr
                  key={employee.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {employee.name || "N/A"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {employee.email || "N/A"}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {getRoleDisplay(employee.role)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(employee.is_active)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {formatDate(employee.last_login || employee.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Link */}
      {employees.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => navigate("/admin/user-management")}
            className="text-sm text-[#e68b00] hover:text-[#d97706] font-medium flex items-center gap-1 transition-colors"
          >
            <span>View all employees</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
