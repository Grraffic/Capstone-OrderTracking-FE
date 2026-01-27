import React from "react";
import { Search, Plus } from "lucide-react";

/**
 * UserFilters Component
 * 
 * Provides search, role filter, status filter, and Add User button
 */
const UserFilters = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  statusFilter,
  onStatusFilterChange,
  onAddUser,
}) => {
  const roles = ["All Roles", "property_custodian", "system_admin", "finance_staff", "accounting_staff", "department_head"];
  const statuses = ["All Status", "Active", "Inactive"];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
      {/* Search Bar - First */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
        />
      </div>

      {/* Role Filter - Second */}
      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role === "All Roles" 
              ? "All Roles" 
              : role.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
          </option>
        ))}
      </select>

      {/* Status Filter - Third */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent bg-white"
      >
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {/* Add User Button - Right side corner */}
      <div className="ml-auto">
        <button
          onClick={onAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors font-medium"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add User</span>
        </button>
      </div>
    </div>
  );
};

export default UserFilters;


