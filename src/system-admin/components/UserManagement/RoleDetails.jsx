import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Shirt, Clock, Menu, Shield, User, FileText, Folder, Edit, UserCog, CheckCircle, X, ChevronDown, ChevronUp } from "lucide-react";
import { roleAPI } from "../../../services/role.service";
import { toast } from "react-hot-toast";

/**
 * RoleDetails Component (Right Panel)
 * 
 * Displays role details and permissions management in a right panel
 */
const RoleDetails = ({ selectedRole, onUpdate }) => {
  const [permissions, setPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  // Local state for modal edits (not saved until Save Edit is clicked)
  const [localPermissionIds, setLocalPermissionIds] = useState(new Set());
  const [localRoleName, setLocalRoleName] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    itemManagement: true,
    orderManagement: true,
    inventoryManagement: true,
    adminPortal: true
  });

  // Fetch permissions when role is selected
  useEffect(() => {
    if (selectedRole) {
      setRoleName(selectedRole.displayName || selectedRole.role || "");
      setDescription(selectedRole.description || "");
      setIsEditMode(false);
      fetchRolePermissions();
      fetchAllPermissions();
    } else {
      setPermissions([]);
      setSelectedPermissionIds(new Set());
      setRoleName("");
      setDescription("");
      setIsEditMode(false);
      setLocalPermissionIds(new Set());
      setLocalRoleName("");
      setLocalDescription("");
    }
  }, [selectedRole]);

  // Initialize local state when opening edit modal
  useEffect(() => {
    if (isEditMode && selectedRole) {
      setLocalPermissionIds(new Set(selectedPermissionIds));
      setLocalRoleName(roleName);
      setLocalDescription(description);
    }
  }, [isEditMode]);

  const fetchRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      setLoading(true);
      const response = await roleAPI.getRolePermissions(selectedRole.role);
      if (response.data && response.data.success) {
        const rolePermissions = response.data.data || [];
        setPermissions(rolePermissions);
        setSelectedPermissionIds(new Set(rolePermissions.map((p) => p.id)));
      }
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      toast.error("Failed to load role permissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const response = await roleAPI.getAllPermissions();
      if (response.data && response.data.success) {
        // Convert grouped permissions to flat array
        const grouped = response.data.data;
        const flat = Object.values(grouped).flat();
        setAllPermissions(flat);
      }
    } catch (error) {
      console.error("Error fetching all permissions:", error);
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage && errorMessage.includes("Permissions system not initialized")) {
        toast.error(
          "Permissions system not initialized. Please run the database migrations first.",
          { duration: 6000 }
        );
      }
    }
  };

  const handlePermissionToggle = async (permissionId, isChecked) => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      if (isChecked) {
        await roleAPI.assignPermission(selectedRole.role, permissionId);
        setSelectedPermissionIds((prev) => new Set([...prev, permissionId]));
        toast.success("Permission assigned");
      } else {
        await roleAPI.removePermission(selectedRole.role, permissionId);
        setSelectedPermissionIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(permissionId);
          return newSet;
        });
        toast.success("Permission removed");
      }
      
      // Refresh permissions list
      await fetchRolePermissions();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error toggling permission:", error);
      toast.error("Failed to update permission");
    } finally {
      setSaving(false);
    }
  };

  const handleLocalPermissionToggle = (permissionId, isChecked) => {
    setLocalPermissionIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      
      // Get permissions to add and remove
      const currentIds = new Set(selectedPermissionIds);
      const newIds = new Set(localPermissionIds);
      
      const toAdd = Array.from(newIds).filter(id => !currentIds.has(id));
      const toRemove = Array.from(currentIds).filter(id => !newIds.has(id));

      // Apply permission changes
      for (const permissionId of toAdd) {
        await roleAPI.assignPermission(selectedRole.role, permissionId);
      }
      
      for (const permissionId of toRemove) {
        await roleAPI.removePermission(selectedRole.role, permissionId);
      }

      // Update state with saved values
      setSelectedPermissionIds(new Set(localPermissionIds));
      setRoleName(localRoleName);
      setDescription(localDescription);
      
      // Note: Role name and description updates would require backend API
      // For now, only permissions are actually saved to the backend

      toast.success("Role permissions updated successfully");
      setIsEditMode(false);
      
      // Refresh permissions list
      await fetchRolePermissions();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error saving role:", error);
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset local state to original values
    setLocalPermissionIds(new Set(selectedPermissionIds));
    setLocalRoleName(roleName);
    setLocalDescription(description);
    setIsEditMode(false);
  };

  // Get icon component based on role icon type
  const getRoleIcon = () => {
    const iconProps = { size: 32 };
    switch (selectedRole?.icon) {
      case "shield":
        return <Shield {...iconProps} />;
      case "user":
        return <User {...iconProps} />;
      case "file-text":
        return <FileText {...iconProps} />;
      case "settings":
      case "user-cog":
        return <UserCog {...iconProps} />;
      default:
        return <Shield {...iconProps} />;
    }
  };

  // Get color classes based on role color
  const getRoleColorClasses = () => {
    const colorMap = {
      orange: "bg-orange-100 text-orange-600 border-orange-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      red: "bg-red-100 text-red-600 border-red-200",
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      "dark-blue": "bg-blue-700 text-blue-50 border-blue-800",
      yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
    };
    return colorMap[selectedRole?.color] || "bg-orange-100 text-orange-600 border-orange-200";
  };

  // Map permissions to Portal structure based on display names
  // This function maps existing permissions to the desired portal structure
  const organizePermissionsByPortal = () => {
    // Item Management: Map to specific display names
    const itemManagementDisplayNames = [
      "Uniform Items",
      "Update Item Variants",
      "Activate / Deactivate Items",
      "View Item Catalog"
    ];
    const itemManagementPermissions = allPermissions.filter((p) => 
      itemManagementDisplayNames.includes(p.display_name)
    );

    // Order Management: Map to specific display names
    const orderManagementDisplayNames = [
      "View All Orders",
      "Approve / Process Orders",
      "Update Order Status",
      "View Order Status Logs",
      "Cancel / Rollback Orders"
    ];
    const orderManagementPermissions = allPermissions.filter((p) => 
      orderManagementDisplayNames.includes(p.display_name)
    );

    // Inventory Management: Same as Order Management (as per user requirement)
    const inventoryManagementPermissions = allPermissions.filter((p) => 
      orderManagementDisplayNames.includes(p.display_name)
    );

    const financePortal = {
      itemManagement: {
        name: "Item Management",
        icon: Shirt,
        iconColor: "text-purple-600",
        permissions: itemManagementPermissions,
      },
      orderManagement: {
        name: "Order Management",
        icon: Clock,
        iconColor: "text-yellow-600",
        permissions: orderManagementPermissions,
      },
      inventoryManagement: {
        name: "Inventory Management",
        icon: Menu,
        iconColor: "text-green-600",
        permissions: inventoryManagementPermissions,
      },
    };

    // Admin Portal: Specific permissions by display name
    const adminPortalDisplayNames = [
      "Manage users (Students and employee)",
      "Assign Roles",
      "Override Permissions",
      "View Audit Logs",
      "System Configuration"
    ];
    const adminPortal = {
      permissions: allPermissions.filter((p) => 
        adminPortalDisplayNames.includes(p.display_name)
      ),
    };

    return { financePortal, adminPortal };
  };

  if (!selectedRole) {
    return (
      <div className="w-full lg:w-1/2 pl-0 lg:pl-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-lg font-semibold text-[#0C2340] mb-2">
            Roles <span className="text-[#e68b00]">Details</span>
          </h2>
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Shield size={64} className="mb-4 text-gray-400" />
            <p className="text-sm font-medium">Select a role to view its details and permissions</p>
          </div>
        </div>
      </div>
    );
  }

  const { financePortal, adminPortal } = organizePermissionsByPortal();
  const totalPermissions = selectedPermissionIds.size;

  // Calculate counts for each sub-section
  const itemManagementCount = financePortal.itemManagement.permissions.filter((p) => 
    selectedPermissionIds.has(p.id)
  ).length;
  const orderManagementCount = financePortal.orderManagement.permissions.filter((p) => 
    selectedPermissionIds.has(p.id)
  ).length;
  const inventoryManagementCount = financePortal.inventoryManagement.permissions.filter((p) => 
    selectedPermissionIds.has(p.id)
  ).length;
  const adminPortalCount = adminPortal.permissions.filter((p) => 
    selectedPermissionIds.has(p.id)
  ).length;

  // Calculate portal count (portals with at least one permission)
  const portalCount = [
    itemManagementCount > 0 || orderManagementCount > 0 || inventoryManagementCount > 0,
    adminPortalCount > 0
  ].filter(Boolean).length;

  // Get user count from selectedRole
  const userCount = selectedRole.userCount || 0;

  return (
    <div className="w-full lg:w-1/2 pl-0 lg:pl-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading permissions...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Role Header Section */}
            <div className={`${getRoleColorClasses()} rounded-lg p-6 border-2`}>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`${getRoleColorClasses().split(' ')[0]} ${getRoleColorClasses().split(' ')[1]} rounded-full p-3`}>
                    {getRoleIcon()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-[#0C2340] whitespace-nowrap">
                      {selectedRole.displayName || selectedRole.role}
                    </h2>
                    <p className="text-sm text-[#0C2340] mt-1">
                      {selectedRole.description || "No description available"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors shadow-md whitespace-nowrap flex-shrink-0"
                >
                  <Edit size={18} />
                  <span>Edit Role</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              {/* Assigned Users Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0C2340]">{userCount}</p>
                    <p className="text-xs text-gray-600">Assigned Users</p>
                  </div>
                </div>
              </div>

              {/* Permissions Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileText className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{totalPermissions}</p>
                    <p className="text-xs text-gray-600">Permissions</p>
                  </div>
                </div>
              </div>

              {/* Portals Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Folder className="text-orange-600" size={20} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{portalCount}</p>
                    <p className="text-xs text-gray-600">Portals</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Role Modal */}
            {isEditMode && createPortal(
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    handleCancel();
                  }
                }}
              >
                <div 
                  className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">
                      <span className="text-[#0C2340]">Edit</span>{" "}
                      <span className="text-[#e68b00]">Role</span>
                    </h2>
                    <button
                      onClick={handleCancel}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Close modal"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Role Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role
                      </label>
                      <input
                        type="text"
                        value={localRoleName}
                        onChange={(e) => setLocalRoleName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
                        placeholder="Enter role name"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Description
                      </label>
                      <textarea
                        value={localDescription}
                        onChange={(e) => {
                          if (e.target.value.length <= 80) {
                            setLocalDescription(e.target.value);
                          }
                        }}
                        rows={3}
                        maxLength={80}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent resize-none"
                        placeholder="Describe the role's responsibilities and access level..."
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {localDescription.length}/80 characters
                      </p>
                    </div>

                    {/* Permissions Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Permissions{" "}
                        <span className="text-[#e68b00]">({allPermissions.length})</span>
                      </h3>

                      <div className="space-y-4">
                        {/* Finance and Accounting Portal */}
                        <div>
                          <div className="bg-[#003363] rounded-t-lg p-4">
                            <h4 className="text-white font-semibold">
                              Finance and Accounting Portal
                            </h4>
                          </div>
                          
                          {/* Single white background for all categories */}
                          <div className="bg-white rounded-b-lg p-4 space-y-4">
                            {/* Item Management */}
                            <div>
                              <button
                                onClick={() => setOpenSections(prev => ({ ...prev, itemManagement: !prev.itemManagement }))}
                                className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Shirt className="text-purple-600" size={20} />
                                  <span className="font-medium text-gray-900">Item Management</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {financePortal.itemManagement.permissions.filter((p) => 
                                      localPermissionIds.has(p.id)
                                    ).length}
                                  </span>
                                  {openSections.itemManagement ? (
                                    <ChevronUp className="text-gray-500" size={20} />
                                  ) : (
                                    <ChevronDown className="text-gray-500" size={20} />
                                  )}
                                </div>
                              </button>
                              {openSections.itemManagement && (
                                <div className="space-y-2 pl-6">
                                  {financePortal.itemManagement.permissions.map((permission) => {
                                    const isSelected = localPermissionIds.has(permission.id);
                                    return (
                                      <label
                                        key={permission.id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) =>
                                            handleLocalPermissionToggle(permission.id, e.target.checked)
                                          }
                                          disabled={saving}
                                          className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                                        />
                                        <span className="text-sm text-gray-900">
                                          {permission.display_name}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Order Management */}
                            <div>
                              <button
                                onClick={() => setOpenSections(prev => ({ ...prev, orderManagement: !prev.orderManagement }))}
                                className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="text-yellow-600" size={20} />
                                  <span className="font-medium text-gray-900">Order Management</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {financePortal.orderManagement.permissions.filter((p) => 
                                      localPermissionIds.has(p.id)
                                    ).length}
                                  </span>
                                  {openSections.orderManagement ? (
                                    <ChevronUp className="text-gray-500" size={20} />
                                  ) : (
                                    <ChevronDown className="text-gray-500" size={20} />
                                  )}
                                </div>
                              </button>
                              {openSections.orderManagement && (
                                <div className="space-y-2 pl-6">
                                  {financePortal.orderManagement.permissions.map((permission) => {
                                    const isSelected = localPermissionIds.has(permission.id);
                                    return (
                                      <label
                                        key={permission.id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) =>
                                            handleLocalPermissionToggle(permission.id, e.target.checked)
                                          }
                                          disabled={saving}
                                          className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                                        />
                                        <span className="text-sm text-gray-900">
                                          {permission.display_name}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Inventory Management */}
                            <div>
                              <button
                                onClick={() => setOpenSections(prev => ({ ...prev, inventoryManagement: !prev.inventoryManagement }))}
                                className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Menu className="text-green-600" size={20} />
                                  <span className="font-medium text-gray-900">Inventory Management</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {financePortal.inventoryManagement.permissions.filter((p) => 
                                      localPermissionIds.has(p.id)
                                    ).length}
                                  </span>
                                  {openSections.inventoryManagement ? (
                                    <ChevronUp className="text-gray-500" size={20} />
                                  ) : (
                                    <ChevronDown className="text-gray-500" size={20} />
                                  )}
                                </div>
                              </button>
                              {openSections.inventoryManagement && (
                                <div className="space-y-2 pl-6">
                                  {financePortal.inventoryManagement.permissions.map((permission) => {
                                    const isSelected = localPermissionIds.has(permission.id);
                                    return (
                                      <label
                                        key={permission.id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) =>
                                            handleLocalPermissionToggle(permission.id, e.target.checked)
                                          }
                                          disabled={saving}
                                          className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                                        />
                                        <span className="text-sm text-gray-900">
                                          {permission.display_name}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Portal */}
                        <div>
                          <div className="bg-[#003363] rounded-t-lg p-4">
                            <button
                              onClick={() => setOpenSections(prev => ({ ...prev, adminPortal: !prev.adminPortal }))}
                              className="flex items-center justify-between w-full"
                            >
                              <h4 className="text-white font-semibold">Admin Portal</h4>
                              <div className="flex items-center gap-2">
                                <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                  {adminPortal.permissions.filter((p) => 
                                    localPermissionIds.has(p.id)
                                  ).length}
                                </span>
                                {openSections.adminPortal ? (
                                  <ChevronUp className="text-white" size={20} />
                                ) : (
                                  <ChevronDown className="text-white" size={20} />
                                )}
                              </div>
                            </button>
                          </div>
                          {openSections.adminPortal && (
                            <div className="bg-white rounded-b-lg p-4">
                              <div className="space-y-2">
                                {adminPortal.permissions.map((permission) => {
                                  const isSelected = localPermissionIds.has(permission.id);
                                  return (
                                    <label
                                      key={permission.id}
                                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) =>
                                          handleLocalPermissionToggle(permission.id, e.target.checked)
                                        }
                                        disabled={saving}
                                        className="rounded border-gray-300 text-[#0C2340] focus:ring-[#0C2340]"
                                      />
                                      <span className="text-sm text-gray-900">
                                        {permission.display_name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-[#0C2340] text-white font-semibold rounded-lg hover:bg-[#0a1d33] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Edit
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Permissions Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Permissions{" "}
                <span className="text-[#e68b00]">({totalPermissions})</span>
              </h3>

              <div className="space-y-4">
                {/* Finance and Accounting Portal */}
                <div>
                  <div className="bg-[#003363] rounded-t-lg p-4">
                    <h4 className="text-white font-semibold">
                      Finance and Accounting Portal
                    </h4>
                  </div>
                  
                  {/* Single white background for all categories */}
                  <div className="bg-white rounded-b-lg p-4 space-y-4">
                    {/* Item Management */}
                    <div>
                      <button
                        onClick={() => setOpenSections(prev => ({ ...prev, itemManagement: !prev.itemManagement }))}
                        className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Shirt className="text-purple-600" size={20} />
                          <span className="font-medium text-gray-900">Item Management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {itemManagementCount}
                          </span>
                          {openSections.itemManagement ? (
                            <ChevronUp className="text-gray-500" size={20} />
                          ) : (
                            <ChevronDown className="text-gray-500" size={20} />
                          )}
                        </div>
                      </button>
                      {openSections.itemManagement && (
                        <div className="space-y-2 pl-6">
                          {financePortal.itemManagement.permissions
                            .filter((permission) => selectedPermissionIds.has(permission.id))
                            .map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center gap-2 p-2"
                              >
                                <CheckCircle className="text-green-600" size={18} />
                                <span className="text-sm text-gray-900">
                                  {permission.display_name}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Order Management */}
                    <div>
                      <button
                        onClick={() => setOpenSections(prev => ({ ...prev, orderManagement: !prev.orderManagement }))}
                        className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="text-yellow-600" size={20} />
                          <span className="font-medium text-gray-900">Order Management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {orderManagementCount}
                          </span>
                          {openSections.orderManagement ? (
                            <ChevronUp className="text-gray-500" size={20} />
                          ) : (
                            <ChevronDown className="text-gray-500" size={20} />
                          )}
                        </div>
                      </button>
                      {openSections.orderManagement && (
                        <div className="space-y-2 pl-6">
                          {financePortal.orderManagement.permissions
                            .filter((permission) => selectedPermissionIds.has(permission.id))
                            .map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center gap-2 p-2"
                              >
                                <CheckCircle className="text-green-600" size={18} />
                                <span className="text-sm text-gray-900">
                                  {permission.display_name}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Inventory Management */}
                    <div>
                      <button
                        onClick={() => setOpenSections(prev => ({ ...prev, inventoryManagement: !prev.inventoryManagement }))}
                        className="flex items-center justify-between w-full mb-3 hover:bg-gray-50 p-2 rounded transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Menu className="text-green-600" size={20} />
                          <span className="font-medium text-gray-900">Inventory Management</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                            {inventoryManagementCount}
                          </span>
                          {openSections.inventoryManagement ? (
                            <ChevronUp className="text-gray-500" size={20} />
                          ) : (
                            <ChevronDown className="text-gray-500" size={20} />
                          )}
                        </div>
                      </button>
                      {openSections.inventoryManagement && (
                        <div className="space-y-2 pl-6">
                          {financePortal.inventoryManagement.permissions
                            .filter((permission) => selectedPermissionIds.has(permission.id))
                            .map((permission) => (
                              <div
                                key={permission.id}
                                className="flex items-center gap-2 p-2"
                              >
                                <CheckCircle className="text-green-600" size={18} />
                                <span className="text-sm text-gray-900">
                                  {permission.display_name}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Admin Portal */}
                <div>
                  <div className="bg-[#003363] rounded-t-lg p-4">
                    <button
                      onClick={() => setOpenSections(prev => ({ ...prev, adminPortal: !prev.adminPortal }))}
                      className="flex items-center justify-between w-full"
                    >
                      <h4 className="text-white font-semibold">Admin Portal</h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {adminPortalCount}
                        </span>
                        {openSections.adminPortal ? (
                          <ChevronUp className="text-white" size={20} />
                        ) : (
                          <ChevronDown className="text-white" size={20} />
                        )}
                      </div>
                    </button>
                  </div>
                  {openSections.adminPortal && (
                    <div className="bg-white rounded-b-lg p-4">
                      <div className="space-y-2">
                        {adminPortal.permissions
                          .filter((permission) => selectedPermissionIds.has(permission.id))
                          .map((permission) => (
                            <div
                              key={permission.id}
                              className="flex items-center gap-2 p-2"
                            >
                              <CheckCircle className="text-green-600" size={18} />
                              <span className="text-sm text-gray-900">
                                {permission.display_name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleDetails;
