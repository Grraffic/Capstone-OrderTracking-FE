import React from "react";
import { Edit } from "lucide-react";

/**
 * UserTable Component
 * 
 * Displays users in a table format with all columns from the design
 */
const UserTable = ({ users, selectedUsers, onSelectUser, onSelectAll, onEditUser }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (isActive, role) => {
    // Determine status based on is_active and potentially other factors
    // For now, we'll use is_active to determine Active/Inactive
    // Pending status might need additional logic
    let status = isActive ? "Active" : "Inactive";
    let bgColor = isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";

    // You can add logic here to determine "Pending" status if needed
    // For example, if a user was just created but not yet activated

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor}`}
      >
        {status}
      </span>
    );
  };

  const getRoleDisplay = (role) => {
    if (!role) return "N/A";
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getUsername = (email) => {
    if (!email) return "N/A";
    return email.split("@")[0];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">Username</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">Email</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">User Role</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">Last Login</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-[#0C2340]">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                  />
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">{user.name || "N/A"}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{getUsername(user.email)}</td>
                <td className="px-4 py-4 text-sm text-gray-900 max-w-[300px] break-words leading-tight">{user.email || "N/A"}</td>
                <td className="px-4 py-4 text-sm text-gray-900">{getRoleDisplay(user.role)}</td>
                <td className="px-4 py-4">
                  {getStatusBadge(user.is_active, user.role)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {formatDate(user.last_login || user.updated_at)}
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => onEditUser(user)}
                    className="text-[#0C2340] hover:text-[#e68b00] transition-colors font-medium text-sm"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;


