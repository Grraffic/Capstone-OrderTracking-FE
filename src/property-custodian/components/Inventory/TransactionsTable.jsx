import React from "react";

/**
 * TransactionsTable Component
 * 
 * Displays transaction data in a table format with columns:
 * - DATE & TIME, USER, ACTION, DETAILS, STATUS
 * Includes pagination controls at the bottom
 */
const TransactionsTable = ({ transactions, currentPage = 1, pagination, onPageChange }) => {
  // Helper function to parse user information
  const parseUserInfo = (transaction) => {
    // First check if transaction has separate user_name and user_role fields
    if (transaction.user_name || transaction.user_role) {
      const userName = transaction.user_name || "System";
      const userRole = transaction.user_role || "system";

      // Format role for display
      const formattedRole = userRole === "property_custodian" 
        ? "Property Custodian" 
        : userRole === "student" 
        ? "Student" 
        : userRole === "system_admin" 
        ? "System Admin"
        : userRole === "finance_staff"
        ? "Finance Staff"
        : userRole === "accounting_staff"
        ? "Accounting Staff"
        : userRole === "department_head"
        ? "Department Head"
        : userRole === "system"
        ? "System"
        : userRole || "Unknown";

      // Avoid showing duplicate "System System" when this is a true system action
      if (
        (userName || "").trim().toLowerCase() === "system" &&
        formattedRole === "System"
      ) {
        return { name: "System", role: "" };
      }

      return { name: userName, role: formattedRole };
    }
    
    // Fallback: Parse user field if it's a combined string
    const user = transaction.user || "";
    // Parse user field: "Jeremy Amponget Property Custodian" or "System (system)"
    const nameMatch = user.match(/^(.+?)\s+(Property Custodian|Student|Admin|Teacher|System)$/i);
    const parenMatch = user.match(/^(.+?)\s*\(([^)]+)\)$/);
    
    if (parenMatch) {
      // Format: "System (system)" or "yasuor446 (Property Custodian)"
      const name = parenMatch[1].trim();
      const roleRaw = parenMatch[2].trim();
      const formattedRole = roleRaw === "property_custodian" 
        ? "Property Custodian" 
        : roleRaw === "student" 
        ? "Student" 
        : roleRaw === "system_admin" 
        ? "System Admin"
        : roleRaw === "finance_staff"
        ? "Finance Staff"
        : roleRaw === "accounting_staff"
        ? "Accounting Staff"
        : roleRaw === "department_head"
        ? "Department Head"
        : roleRaw === "system"
        ? "System"
        : roleRaw;
      return { name, role: formattedRole };
    }
    
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const role = nameMatch[2];
      return { name, role };
    }
    
    return { name: user || "System", role: "System" };
  };

  // Helper function to extract item name from action or metadata
  const extractItemFromAction = (action, metadata) => {
    // First try metadata
    if (metadata?.item_name) {
      return metadata.item_name;
    }
    // Fallback to parsing action string
    const itemMatch = action.match(/(?:ITEM CREATED|PURCHASE RECORDED|RETURN RECORDED|ITEM RELEASED|ITEM DETAILS UPDATED)\s+(.+)$/i);
    return itemMatch ? itemMatch[1].trim() : "";
  };

  // Helper function to extract action prefix
  const extractActionPrefix = (action) => {
    // Extract action prefix: "ITEM CREATED", "PURCHASE RECORDED", etc.
    const prefixMatch = action.match(/^(ITEM CREATED|PURCHASE RECORDED|RETURN RECORDED|ITEM RELEASED|ITEM DETAILS UPDATED)/i);
    return prefixMatch ? prefixMatch[1] : action;
  };

  // Helper function to get status color based on transaction type
  const getStatusColor = (status) => {
    const statusMap = {
      "Items": "text-blue-600",
      "Purchases": "text-green-600",
      "Returns": "text-red-600",
      "Releases": "text-green-600",
    };
    return statusMap[status] || "text-gray-600";
  };

  // Helper function to get indicator color (left border/icon color)
  const getIndicatorColor = (status) => {
    const colorMap = {
      "Items": "bg-blue-500",
      "Purchases": "bg-green-500",
      "Returns": "bg-red-500",
      "Releases": "bg-green-500",
    };
    return colorMap[status] || "bg-gray-500";
  };

  // Format details dynamically based on action type and metadata
  const formatDetails = (transaction) => {
    const { action, metadata, details } = transaction;
    const meta = metadata || {};

    // ITEM CREATED
    if (action.startsWith("ITEM CREATED")) {
      const beginningInv = meta.beginning_inventory || 0;
      const price = meta.price || meta.unit_price || 0;
      const variantCount = meta.variant_count || 0;
      
      const parts = [];
      if (beginningInv > 0) {
        parts.push(
          <span key="beginning">
            Beginning Inventory: <strong>{beginningInv} units</strong>
            {price > 0 && (
              <> at <strong>P{price}</strong></>
            )}
          </span>
        );
      } else {
        // If no beginning inventory, show the original details
        return <span>{details}</span>;
      }
      if (variantCount > 0) {
        parts.push(
          <span key="variants" className="block mt-1 text-xs text-gray-500">
            With {variantCount} Variant{variantCount !== 1 ? "s" : ""}
          </span>
        );
      }
      return parts.length > 0 ? <div>{parts}</div> : <span>{details}</span>;
    }

    // PURCHASE RECORDED
    if (action.startsWith("PURCHASE RECORDED")) {
      const quantity = meta.quantity || 0;
      const unitPrice = meta.unit_price || 0;
      const newStock = meta.new_stock || 0;
      
      const parts = [];
      if (quantity > 0) {
        parts.push(
          <span key="quantity">
            <strong>+{quantity} unit{quantity !== 1 ? "s" : ""}</strong>
            {unitPrice > 0 && (
              <> at <strong>P{unitPrice}</strong></>
            )}
          </span>
        );
      }
      if (newStock >= 0) {
        parts.push(
          <span key="total" className="block mt-1 text-xs text-gray-500">
            New total ending inventory: {newStock}
          </span>
        );
      }
      return parts.length > 0 ? <div>{parts}</div> : <span>{details}</span>;
    }

    // RETURN RECORDED
    if (action.startsWith("RETURN RECORDED")) {
      const quantity = meta.quantity || 0;
      const unitPrice = meta.unit_price || meta.price || 0;
      const newStock = meta.new_stock || 0;
      
      const parts = [];
      if (quantity > 0) {
        parts.push(
          <span key="quantity">
            <strong>+{quantity} unit{quantity !== 1 ? "s" : ""}</strong>
            {unitPrice > 0 && (
              <> at <strong>P{unitPrice}</strong></>
            )}
          </span>
        );
      }
      if (newStock >= 0) {
        parts.push(
          <span key="total" className="block mt-1 text-xs text-gray-500">
            New total ending inventory: {newStock}
          </span>
        );
      }
      return parts.length > 0 ? <div>{parts}</div> : <span>{details}</span>;
    }

    // ITEM RELEASED
    if (action.startsWith("ITEM RELEASED")) {
      const quantity = meta.quantity || 0;
      const unitPrice = meta.unit_price || meta.price || 0;
      const newStock = meta.new_stock || 0;
      
      const parts = [];
      if (quantity > 0) {
        parts.push(
          <span key="quantity">
            <strong>-{quantity} unit{quantity !== 1 ? "s" : ""}</strong>
            {unitPrice > 0 && (
              <> at <strong>P{unitPrice}</strong></>
            )}
          </span>
        );
      }
      if (newStock >= 0) {
        parts.push(
          <span key="total" className="block mt-1 text-xs text-gray-500">
            New total ending inventory: {newStock}
          </span>
        );
      }
      return parts.length > 0 ? <div>{parts}</div> : <span>{details}</span>;
    }

    // ITEM DETAILS UPDATED
    if (action.startsWith("ITEM DETAILS UPDATED")) {
      return <span>{details}</span>;
    }

    // Default: return original details
    return <span>{details}</span>;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 sm:mb-6 shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0C2340]">
            <tr>
              <th className="w-1 px-0"></th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-white">
                DATE & TIME
                <svg
                  className="inline-block ml-2 w-3 h-3 lg:w-4 lg:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-white">
                USER
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-white">
                ACTION
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-white">
                DETAILS
              </th>
              <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-semibold text-white">
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 lg:px-4 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <svg
                      className="w-12 h-12 mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm font-medium">No transactions found</p>
                    <p className="text-xs mt-1">Try adjusting your date range or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => {
              const itemName = extractItemFromAction(transaction.action, transaction.metadata);
              const statusColor = getStatusColor(transaction.status);
              const indicatorColor = getIndicatorColor(transaction.status);

              return (
                <tr
                  key={transaction.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                >
                  {/* Color-coded indicator on the left */}
                  <td className="w-1 px-0 py-0">
                    <div className={`${indicatorColor} w-1 h-full min-h-[60px]`}></div>
                  </td>
                  <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-700">
                    {transaction.dateTime}
                  </td>
                  <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-700">
                    {(() => {
                      const userInfo = parseUserInfo(transaction);
                      return (
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{userInfo.name}</span>
                          {userInfo.role && (
                            <span className="text-xs text-gray-500 mt-0.5">
                              {userInfo.role}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm font-medium">
                    <div className="flex flex-col">
                      <span className={statusColor}>
                        {extractActionPrefix(transaction.action)}
                      </span>
                      {itemName && (
                        <span className="text-xs text-gray-600 mt-1 font-normal">
                          {itemName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-700">
                    {formatDetails(transaction)}
                  </td>
                  <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm">
                    <span className={`font-medium ${statusColor}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden">
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const itemName = extractItemFromAction(transaction.action, transaction.metadata);
            const statusColor = getStatusColor(transaction.status);
            const indicatorColor = getIndicatorColor(transaction.status);

            return (
              <div 
                key={transaction.id} 
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Color-coded indicator on the left */}
                <div className={`${indicatorColor} w-1 h-full absolute left-0 top-0`}></div>
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3 pb-3 border-b border-gray-200">
                  <div className="flex flex-col">
                    {(() => {
                      // Split dateTime into date and time parts
                      const dateTimeStr = transaction.dateTime || "";
                      // Format is usually "Jan 26, 2024 2:30 PM" or "Jan 26, 2024, 2:30 PM"
                      // Split by pattern: space before time (HH:MM AM/PM)
                      const timeMatch = dateTimeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
                      if (timeMatch) {
                        const timeIndex = dateTimeStr.indexOf(timeMatch[1]);
                        const datePart = dateTimeStr.substring(0, timeIndex).trim();
                        const timePart = timeMatch[1].trim();
                        
                        return (
                          <>
                            <span className="text-xs text-gray-500 font-medium">
                              {datePart}
                            </span>
                            <span className="text-xs text-gray-500 font-medium mt-0.5">
                              {timePart}
                            </span>
                          </>
                        );
                      }
                      // Fallback: if no time pattern found, show as is
                      return (
                        <span className="text-xs text-gray-500 font-medium">
                          {dateTimeStr}
                        </span>
                      );
                    })()}
                  </div>
                  <span className={`font-medium text-sm ${statusColor}`}>
                    {transaction.status}
                  </span>
                </div>

                {/* User Info */}
                <div className="mb-3">
                  {(() => {
                    const userInfo = parseUserInfo(transaction);
                    return (
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900">{userInfo.name}</span>
                        {userInfo.role && (
                          <span className="text-xs text-gray-500 mt-0.5">
                            {userInfo.role}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Action */}
                <div className="mb-3">
                  <div className="flex flex-col">
                    <span className={`text-sm font-semibold ${statusColor}`}>
                      {extractActionPrefix(transaction.action)}
                    </span>
                    {itemName && (
                      <span className="text-xs text-gray-600 mt-1 font-normal">
                        {itemName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex flex-col">
                    {formatDetails(transaction)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination - Right aligned */}
      {pagination && pagination.totalPages > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between mt-4">
          {/* Left side - Page info */}
          <div className="text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </div>
          
          {/* Right side - Navigation buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
            <input
              type="number"
              min="1"
              max={pagination.totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= pagination.totalPages) {
                  onPageChange && onPageChange(page);
                }
              }}
              onBlur={(e) => {
                const page = parseInt(e.target.value);
                if (!page || page < 1) {
                  onPageChange && onPageChange(1);
                } else if (page > pagination.totalPages) {
                  onPageChange && onPageChange(pagination.totalPages);
                } else {
                  onPageChange && onPageChange(page);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              className="w-16 px-4 py-2 text-sm font-medium text-[#0C2340] bg-white border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
            />
            <button
              onClick={() => onPageChange && onPageChange((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-white bg-[#e68b00] border border-[#e68b00] rounded-lg hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e68b00] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsTable;

