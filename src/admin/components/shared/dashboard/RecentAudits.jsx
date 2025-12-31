import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

/**
 * RecentAudits Component
 *
 * Displays recent transactions/audits from the inventory page
 * Shows date & time, user, action, details, and status
 *
 * Props:
 * - transactions: Array of transaction objects
 */
const RecentAudits = ({ transactions = [] }) => {
  const navigate = useNavigate();

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Items":
        return "text-blue-600 hover:text-blue-700";
      case "Purchases":
        return "text-green-600 hover:text-green-700";
      case "Returns":
        return "text-red-600 hover:text-red-700";
      case "Releases":
        return "text-purple-600 hover:text-purple-700";
      default:
        return "text-gray-600 hover:text-gray-700";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#0C2340]">
          Recent <span className="text-[#e68b00]">Audits</span>
        </h2>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No recent transactions</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  DATE & TIME
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  USER
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  ACTION
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  DETAILS
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-[#0C2340] uppercase tracking-wider">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {transaction.dateTime}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {transaction.user}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {transaction.action}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {transaction.details}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-sm font-medium cursor-pointer ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Link */}
      {transactions.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => navigate("/admin/inventory")}
            className="text-sm text-[#e68b00] hover:text-[#d97706] font-medium flex items-center gap-1 transition-colors"
          >
            <span>View all activity</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentAudits;

