import React, { useState, useEffect } from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import UserFilters from "../components/UserManagement/UserFilters";
import UserTable from "../components/UserManagement/UserTable";
import UserModal from "../components/UserManagement/UserModal";
import RolesList from "../components/UserManagement/RolesList";
import RoleDetails from "../components/UserManagement/RoleDetails";
import CreateRoleModal from "../components/UserManagement/CreateRoleModal";
import DisableUserModal from "../components/UserManagement/DisableUserModal";
import { useUsers } from "../hooks/useUsers";
import { userAPI } from "../../services/user.service";
import { roleAPI } from "../../services/role.service";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight, Users, Shield, User, CheckCircle, XCircle } from "lucide-react";

/**
 * UserManagement Page
 * 
 * Main page for managing users with tabs, filters, and table
 */
const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("Users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Disable user confirmation modal state
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [userToDisable, setUserToDisable] = useState(null);
  
  // Roles & Permissions state
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);

  const { 
    users, 
    loading, 
    pagination, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser,
  } = useUsers();

  // Fetch users when filters change (reset to page 1)
  // Exclude students - only show users with other roles (admin, property_custodian, etc.)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      const roleToFilter = roleFilter === "All Roles" ? "" : roleFilter;
      // Always exclude students - if roleFilter is "student", don't fetch
      // If roleFilter is empty or other role, fetch with that filter
      if (roleToFilter === "student") {
        // Don't fetch if student role is selected
        return;
      }
      fetchUsers({
        page: 1,
        search: search || "",
        role: roleToFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
        excludeRole: "student", // Always exclude students
      });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [search, roleFilter, statusFilter]);

  // Initial fetch - exclude students
  useEffect(() => {
    fetchUsers({ 
      page: 1,
      excludeRole: "student", // Always exclude students
    });
  }, []);

  // Fetch roles when Roles & Permissions tab is active
  useEffect(() => {
    if (activeTab === "Roles & Permissions") {
      fetchRoles();
    }
  }, [activeTab]);

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await roleAPI.getAllRoles();
      if (response.data && response.data.success) {
        // Filter out student role
        const allRoles = response.data.data || [];
        const filteredRoles = allRoles.filter(
          (role) => role.role?.toLowerCase() !== "student"
        );
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch roles";
      const hint = error.response?.data?.hint;
      
      if (errorMessage.includes("Permissions system not initialized")) {
        toast.error(
          "Permissions system not initialized. Please run the database migrations first.",
          { duration: 6000 }
        );
        console.error("Migration required:", hint || "See backend/migrations/README_ROLES_PERMISSIONS.md");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setRolesLoading(false);
    }
  };

  // Handle role selection
  const handleSelectRole = async (role) => {
    setSelectedRole(role);
    // Fetch full role details with permissions
    try {
      const response = await roleAPI.getRoleDetails(role.role);
      if (response.data && response.data.success) {
        setSelectedRole(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching role details:", error);
      toast.error("Failed to load role details");
    }
  };

  // Handle role update (refresh roles list)
  const handleRoleUpdate = () => {
    fetchRoles();
  };

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      const roleToFilter = roleFilter === "All Roles" ? "" : roleFilter;
      if (roleToFilter === "student") {
        return; // Don't fetch if student role is selected
      }
      fetchUsers({
        page: nextPage,
        search: search || "",
        role: roleToFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
        excludeRole: "student", // Always exclude students
      });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      const roleToFilter = roleFilter === "All Roles" ? "" : roleFilter;
      if (roleToFilter === "student") {
        return; // Don't fetch if student role is selected
      }
      fetchUsers({
        page: prevPage,
        search: search || "",
        role: roleToFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
        excludeRole: "student", // Always exclude students
      });
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = async (user) => {
    try {
      // Fetch full user details to get isLastSystemAdmin flag
      const response = await userAPI.getUserById(user.id);
      if (response.data && response.data.success) {
        setEditingUser(response.data.data);
      } else {
        setEditingUser(user); // Fallback to passed user if fetch fails
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      setEditingUser(user); // Fallback to passed user on error
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      // Prepare current filter params for refresh
      const roleToFilter = roleFilter === "All Roles" ? "" : roleFilter;
      const refreshParams = {
        page: currentPage,
        search: search || "",
        role: roleToFilter === "student" ? "" : roleToFilter, // Don't filter by student
        status: statusFilter === "All Status" ? "" : statusFilter,
        excludeRole: "student", // Always exclude students
      };

      if (editingUser) {
        await updateUser(editingUser.id, userData, refreshParams);
        toast.success("User updated successfully");
      } else {
        await createUser(userData, refreshParams);
        toast.success("User created successfully");
      }
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      toast.error(error.message || "Failed to save user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const roleToFilter = roleFilter === "All Roles" ? "" : roleFilter;
        const refreshParams = {
          page: currentPage,
          search: search || "",
          role: roleToFilter === "student" ? "" : roleToFilter, // Don't filter by student
          status: statusFilter === "All Status" ? "" : statusFilter,
          excludeRole: "student", // Always exclude students
        };
        await deleteUser(userId, refreshParams);
        toast.success("User deleted successfully");
      } catch (error) {
        toast.error(error.message || "Failed to delete user");
      }
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    // If user is currently active and we're disabling them, show confirmation modal
    if (currentStatus) {
      const user = users.find((u) => u.id === userId);
      setUserToDisable({ id: userId, name: user?.name || "this user" });
      setIsDisableModalOpen(true);
    } else {
      // If user is inactive and we're activating them, proceed directly
      await confirmToggleActive(userId, false);
    }
  };

  const confirmToggleActive = async (userId, wasActive) => {
    try {
      const roleToFilter = roleFilter === "All Roles" ? "" : roleFilter;
      const refreshParams = {
        page: currentPage,
        search: search || "",
        role: roleToFilter === "student" ? "" : roleToFilter, // Don't filter by student
        status: statusFilter === "All Status" ? "" : statusFilter,
        excludeRole: "student", // Always exclude students
      };
      await updateUser(userId, { is_active: !wasActive }, refreshParams);
      toast.success(`User ${!wasActive ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  // Calculate stats
  const stats = {
    totalUsers: pagination.total || 0,
    activeUsers: users.filter((u) => u.is_active).length,
    inactiveUsers: users.filter((u) => !u.is_active).length,
    totalRoles: new Set(users.map((u) => u.role)).size,
  };

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-3xl font-bold text-[#0C2340]">
            List of <span className="text-[#e68b00]">Employees</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Control user access and permissions for staff</p>
        </div>

        {/* Compact Tab Switcher with Icons - Left Aligned */}
        <div className="mb-6">
          <div className="inline-flex bg-gray-100 p-1 rounded-full shadow-sm">
            <button
              onClick={() => setActiveTab("Users")}
              className={`inline-flex items-center gap-2 px-6 py-2.5 font-semibold text-sm rounded-full transition-all duration-200 ${
                activeTab === "Users"
                  ? "bg-[#0C2340] text-white shadow-md"
                  : "text-[#0C2340] hover:bg-gray-200"
              }`}
            >
              <Users size={18} />
              Users
            </button>
            <button
              onClick={() => setActiveTab("Roles & Permissions")}
              className={`inline-flex items-center gap-2 px-6 py-2.5 font-semibold text-sm rounded-full transition-all duration-200 ${
                activeTab === "Roles & Permissions"
                  ? "bg-[#0C2340] text-white shadow-md"
                  : "text-[#0C2340] hover:bg-gray-200"
              }`}
            >
              <Shield size={18} />
              Roles & Permissions
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "Users" ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Users */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-full p-3">
                    <User className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              {/* Active Users */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-3">
                    <CheckCircle className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              {/* Inactive Users */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 rounded-full p-3">
                    <XCircle className="text-red-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Inactive Users</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</p>
                  </div>
                </div>
              </div>

              {/* Total Roles */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-3">
                    <Shield className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Roles</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalRoles}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Add User Button */}
            <UserFilters
              search={search}
              onSearchChange={setSearch}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onAddUser={handleAddUser}
            />

            {/* User Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Loading users...</div>
              </div>
            ) : (
              <>
                <UserTable
                  users={users}
                  selectedUsers={selectedUsers}
                  onSelectUser={handleSelectUser}
                  onSelectAll={handleSelectAll}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUser}
                  onToggleActive={handleToggleActive}
                />
                
                {/* Pagination Controls */}
                {pagination.totalPages > 0 && (
                  <div className=" px-6 py-4 flex items-center justify-between shadow-sm">
                    {/* Left: Page Indicator */}
                    <div className="text-sm text-gray-600">
                      Page <span className="font-semibold">{currentPage}</span> of{" "}
                      <span className="font-semibold">{pagination.totalPages}</span>
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
          </>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <RolesList
              roles={roles}
              loading={rolesLoading}
              selectedRole={selectedRole}
              onSelectRole={handleSelectRole}
              onCreateRole={() => setIsCreateRoleModalOpen(true)}
            />
            <RoleDetails
              selectedRole={selectedRole}
              onUpdate={handleRoleUpdate}
            />
          </div>
        )}

        {/* User Modal */}
        <UserModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          user={editingUser}
          onSave={handleSaveUser}
        />

        {/* Create Role Modal */}
        <CreateRoleModal
          isOpen={isCreateRoleModalOpen}
          onClose={() => setIsCreateRoleModalOpen(false)}
          onRoleCreated={handleRoleUpdate}
        />

        {/* Disable User Confirmation Modal */}
        <DisableUserModal
          isOpen={isDisableModalOpen}
          onClose={() => {
            setIsDisableModalOpen(false);
            setUserToDisable(null);
          }}
          onConfirm={async () => {
            if (userToDisable) {
              await confirmToggleActive(userToDisable.id, true);
              setIsDisableModalOpen(false);
              setUserToDisable(null);
            }
          }}
          userName={userToDisable?.name || ""}
        />
      </div>
    </SystemAdminLayout>
  );
};

export default UserManagement;


