import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

/**
 * UserTable Component
 * 
 * Displays users in a table format with all columns from the design
 */
const UserTable = ({ users, selectedUsers, onSelectUser, onSelectAll, onEditUser, onDeleteUser, onToggleActive }) => {
  const { userRole } = useAuth();
  // Hide delete button if the logged-in user is a system admin
  const isSystemAdmin = userRole === "system_admin";
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

  const ToggleSwitch = ({ isActive, userId, onToggle }) => {
    return (
      <button
        type="button"
        onClick={() => onToggle(userId, isActive)}
        className={`relative inline-flex h-5 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:ring-offset-2 px-1 ${
          isActive ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        {/* Text - positioned away from handle */}
        <span className={`absolute text-xs font-bold whitespace-nowrap z-10 ${
          isActive 
            ? "text-white left-2" 
            : "text-gray-700 right-2"
        }`}>
          {isActive ? "Yes" : "No"}
        </span>
        {/* Handle - positioned on opposite side from text */}
        <span
          className={`absolute inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            isActive ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
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
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="bg-[#003363]">
            <th className="px-4 py-3 text-left rounded-tl-lg">
              <input
                type="checkbox"
                checked={selectedUsers.length === users.length && users.length > 0}
                onChange={onSelectAll}
                className="rounded border-gray-300 text-white focus:ring-white"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Username</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Email</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">User Role</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Is Active</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white">Last Login</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white rounded-tr-lg">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-4 py-8 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4 rounded-l-lg">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => onSelectUser(user.id)}
                    className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                  />
                </td>
                <td className="px-4 py-4 text-sm text-[#003363]">{user.name || "N/A"}</td>
                <td className="px-4 py-4 text-sm text-[#003363]">{getUsername(user.email)}</td>
                <td className="px-4 py-4 text-sm text-[#003363] max-w-[300px] break-words leading-tight line-clamp-2">{user.email || "N/A"}</td>
                <td className="px-4 py-4 text-sm text-[#003363]">{getRoleDisplay(user.role)}</td>
                <td className="px-4 py-4">
                  <ToggleSwitch
                    isActive={user.is_active}
                    userId={user.id}
                    onToggle={onToggleActive}
                  />
                </td>
                <td className="px-4 py-4 text-sm text-[#003363]">
                  {formatDate(user.last_login || user.updated_at)}
                </td>
                <td className="px-4 py-4 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onEditUser(user)}
                      className="text-[#0C2340] hover:text-[#e68b00] transition-colors font-medium text-sm flex items-center gap-1"
                      title="Edit user"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    {!isSystemAdmin && (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 transition-colors font-medium text-sm flex items-center gap-1"
                        title="Delete user"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
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

export default UserTable;


