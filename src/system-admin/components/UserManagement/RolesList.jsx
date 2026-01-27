import React, { useState } from "react";
import { Shield, Plus, Search } from "lucide-react";
import RoleCard from "./RoleCard";

/**
 * RolesList Component (Left Panel)
 * 
 * Displays list of roles with search and create functionality
 */
const RolesList = ({ roles, loading, selectedRole, onSelectRole, onCreateRole }) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter roles based on search term and exclude student role
  const filteredRoles = roles.filter(
    (role) =>
      role.role?.toLowerCase() !== "student" &&
      (role.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="w-full lg:w-1/2 pr-0 lg:pr-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="text-[#0C2340]" size={20} />
          <h2 className="text-lg font-semibold text-[#0C2340]">Roles & Permissions</h2>
          <span className="text-sm text-gray-500">({filteredRoles.length} Roles Available)</span>
        </div>
        <button
          onClick={onCreateRole}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Create Role
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search Roles"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
        />
      </div>

      {/* Roles List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading roles...</div>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Shield size={48} className="mb-3 text-gray-400" />
          <p className="text-sm font-medium">No roles found</p>
          <p className="text-xs mt-1">
            {searchTerm ? "Try a different search term" : "No roles available"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.role}
              role={role}
              onSelect={onSelectRole}
              isSelected={selectedRole?.role === role.role}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RolesList;
