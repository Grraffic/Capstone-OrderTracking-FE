import React from "react";
import { Shield, User, FileText, Settings, Edit, CheckCircle, UserCog } from "lucide-react";

/**
 * RoleCard Component
 * 
 * Displays a role card with icon, title, description, stats, and actions
 */
const RoleCard = ({ role, onSelect, isSelected }) => {
  // Get icon component based on role icon type
  const getIcon = () => {
    const iconProps = { size: 24 };
    switch (role.icon) {
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
        return <User {...iconProps} />;
    }
  };

  // Get color classes based on role color
  const getColorClasses = () => {
    const colorMap = {
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
      red: "bg-red-100 text-red-600",
      blue: "bg-blue-100 text-blue-600",
      "dark-blue": "bg-blue-700 text-blue-50",
      yellow: "bg-yellow-100 text-yellow-600",
    };
    return colorMap[role.color] || "bg-gray-100 text-gray-600";
  };

  return (
    <div
      onClick={() => onSelect(role)}
      className={`bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "border-[#0C2340] shadow-md" : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`${getColorClasses()} rounded-full p-2`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{role.displayName}</h3>
            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(role);
          }}
          className="text-gray-400 hover:text-[#0C2340] transition-colors"
          title="Edit role"
        >
          <Edit size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-gray-600">
            <User size={16} />
            <span>{role.userCount} users</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <FileText size={16} />
            <span>{role.permissionCount} permissions</span>
          </div>
        </div>
        {role.isActive && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle size={16} />
            <span className="text-xs font-medium">Active</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
