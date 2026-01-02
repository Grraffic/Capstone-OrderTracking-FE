import React, { useState, useEffect } from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import UserFilters from "../components/UserManagement/UserFilters";
import UserTable from "../components/UserManagement/UserTable";
import UserModal from "../components/UserManagement/UserModal";
import { useUsers } from "../hooks/useUsers";
import { userAPI } from "../../services/user.service";
import { toast } from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers({
        page: 1,
        search: search || "",
        role: roleFilter === "All Roles" ? "" : roleFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
      });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [search, roleFilter, statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchUsers({ page: 1 });
  }, []);

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchUsers({
        page: nextPage,
        search: search || "",
        role: roleFilter === "All Roles" ? "" : roleFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
      });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchUsers({
        page: prevPage,
        search: search || "",
        role: roleFilter === "All Roles" ? "" : roleFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
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
      const refreshParams = {
        search: search || "",
        role: roleFilter === "All Roles" ? "" : roleFilter,
        status: statusFilter === "All Status" ? "" : statusFilter,
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

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-[#0C2340]">Manage Users</h1>

        {/* Modern Pill-Shaped Tab Switcher - Full Width */}
        <div className="w-full mb-6">
          <div className="flex bg-gray-100 p-1 rounded-full shadow-sm w-full">
            <button
              onClick={() => setActiveTab("Users")}
              className={`flex-1 px-6 py-2.5 font-semibold text-sm rounded-full transition-all duration-200 ${
                activeTab === "Users"
                  ? "bg-[#0C2340] text-white shadow-md"
                  : "text-[#0C2340] hover:bg-gray-200"
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("Roles & Permissions")}
              className={`flex-1 px-6 py-2.5 font-semibold text-sm rounded-full transition-all duration-200 ${
                activeTab === "Roles & Permissions"
                  ? "bg-[#0C2340] text-white shadow-md"
                  : "text-[#0C2340] hover:bg-gray-200"
              }`}
            >
              Roles & Permissions
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === "Users" ? (
          <>
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
                />
                
                {/* Pagination Controls */}
                {pagination.totalPages > 0 && (
                  <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between rounded-b-lg shadow-sm">
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
          <div className="py-12 text-center text-gray-500">
            Roles & Permissions management coming soon...
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
      </div>
    </SystemAdminLayout>
  );
};

export default UserManagement;


