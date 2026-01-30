import React from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import { Archive } from "lucide-react";

/**
 * Archive Users Page
 *
 * Placeholder for archived/deactivated users. Can be extended later
 * with a table and filters for archived employees and students.
 */
const ArchiveUsers = () => {
  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0C2340]">
            Archive <span className="text-[#e68b00]">Users</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage archived or deactivated user accounts
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-12 shadow-sm flex flex-col items-center justify-center min-h-[320px]">
          <div className="bg-gray-100 rounded-full p-6 mb-4">
            <Archive className="text-gray-400" size={48} />
          </div>
          <p className="text-gray-500 text-center max-w-md">
            Archived users will be listed here. This section can be extended
            with filters and a table for deactivated employees and students.
          </p>
        </div>
      </div>
    </SystemAdminLayout>
  );
};

export default ArchiveUsers;
