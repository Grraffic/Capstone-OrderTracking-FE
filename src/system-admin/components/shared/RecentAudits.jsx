import { ChevronRight } from "lucide-react";

/**
 * RecentAudits Component for System Admin
 *
 * Displays recent student actions/transactions
 * Shows date & time, user, action, details, and status
 *
 * Props:
 * - transactions: Array of transaction objects
 */
const RecentAudits = ({ transactions = [] }) => {
  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Order":
        return "text-blue-600 hover:text-blue-700";
      case "Inventory":
        return "text-green-600 hover:text-green-700";
      case "Item":
        return "text-purple-600 hover:text-purple-700";
      case "User":
        return "text-orange-600 hover:text-orange-700";
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
        <p className="text-sm text-gray-500 mt-1">All student actions</p>
      </div>

      {/* Content */}
      <div className="overflow-x-auto">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No recent student actions</p>
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
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                    {(() => {
                      // Split dateTime into date and time parts
                      const dateTimeStr = transaction.dateTime || "";
                      // Format is usually "Feb 1, 2026 04:24 AM" or "Jan 26, 2024 2:30 PM"
                      // Split by pattern: space before time (HH:MM AM/PM or H:MM AM/PM)
                      const timeMatch = dateTimeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
                      if (timeMatch) {
                        const timeIndex = dateTimeStr.indexOf(timeMatch[1]);
                        const datePart = dateTimeStr.substring(0, timeIndex).trim();
                        const timePart = timeMatch[1].trim();
                        
                        return (
                          <div className="flex flex-col">
                            <span className="whitespace-nowrap">{datePart}</span>
                            <span className="whitespace-nowrap text-xs text-gray-600 mt-0.5">{timePart}</span>
                          </div>
                        );
                      }
                      // Fallback: if no time pattern found, show as is
                      return <span className="whitespace-nowrap">{dateTimeStr}</span>;
                    })()}
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
    </div>
  );
};

export default RecentAudits;
