import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Shirt, Clock, Menu, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-hot-toast";
import { roleAPI } from "../../../services/role.service";

/**
 * CreateRoleModal Component
 * 
 * Modal for creating new roles
 */
const CreateRoleModal = ({ isOpen, onClose, onRoleCreated }) => {
  const [formData, setFormData] = useState({
    roleName: "",
    description: "",
    initialPermissions: [],
  });
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    itemManagement: true,
    orderManagement: true,
    inventoryManagement: true,
    adminPortal: true
  });

  // Fetch all permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllPermissions();
    } else {
      // Reset form when modal closes
      setFormData({
        roleName: "",
        description: "",
        initialPermissions: [],
      });
      setOpenSections({
        itemManagement: true,
        orderManagement: true,
        inventoryManagement: true,
        adminPortal: true
      });
    }
  }, [isOpen]);

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
      console.error("Error fetching permissions:", error);
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage && errorMessage.includes("Permissions system not initialized")) {
        toast.error(
          "Permissions system not initialized. Please run the database migrations first.",
          { duration: 6000 }
        );
      }
    }
  };

  // Map permissions to Portal structure (same as RoleDetails)
  const organizePermissionsByPortal = () => {
    // Item Management: Specific permissions by display name
    const itemManagementDisplayNames = [
      "Uniform Items",
      "Update Item Variants",
      "Activate / Deactivate Items",
      "View Item Catalog"
    ];
    const itemManagementPermissions = allPermissions.filter((p) => 
      itemManagementDisplayNames.includes(p.display_name)
    );

    // Order Management: Specific permissions by display name
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

  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const isSelected = prev.initialPermissions.includes(permissionId);
      return {
        ...prev,
        initialPermissions: isSelected
          ? prev.initialPermissions.filter((id) => id !== permissionId)
          : [...prev.initialPermissions, permissionId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For now, show info message that roles are managed through database
    toast.error(
      "Role creation is currently managed through the database. Please contact your system administrator to create new roles.",
      { duration: 5000 }
    );
    
    // Future implementation: Uncomment when backend supports role creation
    /*
    try {
      setLoading(true);
      // TODO: Implement role creation API endpoint
      // await roleAPI.createRole(formData);
      toast.success("Role created successfully");
      if (onRoleCreated) {
        onRoleCreated();
      }
      onClose();
    } catch (error) {
      console.error("Error creating role:", error);
      toast.error(error.response?.data?.message || "Failed to create role");
    } finally {
      setLoading(false);
    }
    */
  };

  if (!isOpen) return null;

  const { financePortal, adminPortal } = organizePermissionsByPortal();

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
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
            <span className="text-[#0C2340]">Create</span>{" "}
            <span className="text-[#e68b00]">Role</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-6 space-y-6 flex-1">
            {/* Role Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                placeholder="Enter Role Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 80) {
                    setFormData({ ...formData, description: e.target.value });
                  }
                }}
                placeholder="Enter Role's Description"
                rows={3}
                maxLength={80}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340] focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.description.length}/80 characters
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
                        type="button"
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
                              formData.initialPermissions.includes(p.id)
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
                            const isSelected = formData.initialPermissions.includes(permission.id);
                            return (
                              <label
                                key={permission.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handlePermissionToggle(permission.id)}
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
                        type="button"
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
                              formData.initialPermissions.includes(p.id)
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
                            const isSelected = formData.initialPermissions.includes(permission.id);
                            return (
                              <label
                                key={permission.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handlePermissionToggle(permission.id)}
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
                        type="button"
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
                              formData.initialPermissions.includes(p.id)
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
                            const isSelected = formData.initialPermissions.includes(permission.id);
                            return (
                              <label
                                key={permission.id}
                                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handlePermissionToggle(permission.id)}
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
                      type="button"
                      onClick={() => setOpenSections(prev => ({ ...prev, adminPortal: !prev.adminPortal }))}
                      className="flex items-center justify-between w-full"
                    >
                      <h4 className="text-white font-semibold">Admin Portal</h4>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#e68b00] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {adminPortal.permissions.filter((p) => 
                            formData.initialPermissions.includes(p.id)
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
                          const isSelected = formData.initialPermissions.includes(permission.id);
                          return (
                            <label
                              key={permission.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handlePermissionToggle(permission.id)}
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
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.roleName}
              className="px-6 py-2 bg-[#0C2340] text-white font-semibold rounded-lg hover:bg-[#0a1d33] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreateRoleModal;
