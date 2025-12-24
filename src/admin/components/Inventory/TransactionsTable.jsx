import React from "react";

/**
 * TransactionsTable Component
 * 
 * Displays transaction data in a table format with columns:
 * - TYPE, DATE & TIME, USER, ACTION, DETAILS
 */
const TransactionsTable = ({ transactions }) => {
  // Helper function to parse user information
  const parseUserInfo = (user) => {
    // Parse user field: "Jeremy Amponget Property Custodian"
    // Split by "Property Custodian" or "Student" etc.
    const nameMatch = user.match(/^(.+?)\s+(Property Custodian|Student|Admin|Teacher)$/i);
    const name = nameMatch ? nameMatch[1].trim() : user;
    const role = nameMatch ? nameMatch[2] : "";
    
    return { name, role };
  };

  // Helper function to extract item name from action
  const extractItemFromAction = (action) => {
    // Extract item name from action: "ITEM CREATED SHS Men's Polo"
    // Remove action prefixes like "ITEM CREATED", "PURCHASE RECORDED", etc.
    const itemMatch = action.match(/(?:ITEM CREATED|PURCHASE RECORDED|RETURN RECORDED|ITEM RELEASED|ITEM DETAILS UPDATED)\s+(.+)$/i);
    return itemMatch ? itemMatch[1].trim() : "";
  };

  // Helper function to extract action prefix
  const extractActionPrefix = (action) => {
    // Extract action prefix: "ITEM CREATED", "PURCHASE RECORDED", etc.
    const prefixMatch = action.match(/^(ITEM CREATED|PURCHASE RECORDED|RETURN RECORDED|ITEM RELEASED|ITEM DETAILS UPDATED)/i);
    return prefixMatch ? prefixMatch[1] : action;
  };

  // Helper function to extract variant info from details
  const extractVariants = (details) => {
    // Extract variant info from details: "With 6 Variants"
    const variantMatch = details.match(/With\s+(\d+)\s+Variants?/i);
    return variantMatch ? `With ${variantMatch[1]} Variants` : "";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6 shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0C2340]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                TYPE
                <svg
                  className="inline-block ml-2 w-4 h-4"
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                DATE & TIME
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                USER
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                ACTION
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                DETAILS
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-3 text-sm text-green-600 font-medium">
                  {transaction.type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {transaction.dateTime}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {(() => {
                    const userInfo = parseUserInfo(transaction.user);
                    return (
                      <div className="flex flex-col">
                        {userInfo.name && (
                          <span className="font-medium">{userInfo.name}</span>
                        )}
                        {userInfo.role && (
                          <span className="text-xs text-gray-500">
                            {userInfo.role}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-sm text-green-600 font-medium">
                  <div className="flex flex-col">
                    <span>{extractActionPrefix(transaction.action)}</span>
                    {extractItemFromAction(transaction.action) && (
                      <span className="text-xs text-gray-600 mt-1 font-normal">
                        {extractItemFromAction(transaction.action)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <div className="flex flex-col">
                    <span>
                      {transaction.details
                        .split(transaction.price || "")
                        .map((part, idx) => (
                          <span key={idx}>
                            {part}
                            {idx === 0 && transaction.price && (
                              <span className="text-[#E68B00] font-semibold">
                                {transaction.price}
                              </span>
                            )}
                          </span>
                        ))}
                    </span>
                    {extractVariants(transaction.details) && (
                      <span className="text-xs text-gray-500 mt-1">
                        {extractVariants(transaction.details)}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Table */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-green-600">
                  {transaction.type}
                </span>
                <span className="text-xs text-gray-500">
                  {transaction.dateTime}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-1">
                {(() => {
                  const userInfo = parseUserInfo(transaction.user);
                  return (
                    <div className="flex flex-col">
                      {userInfo.name && (
                        <span className="font-medium">{userInfo.name}</span>
                      )}
                      {userInfo.role && (
                        <span className="text-xs text-gray-500">
                          {userInfo.role}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="text-sm text-green-600 font-medium mb-1">
                <div className="flex flex-col">
                  <span>{extractActionPrefix(transaction.action)}</span>
                  {extractItemFromAction(transaction.action) && (
                    <span className="text-xs text-gray-600 mt-1 font-normal">
                      {extractItemFromAction(transaction.action)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <div className="flex flex-col">
                  <span>
                    {transaction.details
                      .split(transaction.price || "")
                      .map((part, idx) => (
                        <span key={idx}>
                          {part}
                          {idx === 0 && transaction.price && (
                            <span className="text-[#E68B00] font-semibold">
                              {transaction.price}
                            </span>
                          )}
                        </span>
                      ))}
                  </span>
                  {extractVariants(transaction.details) && (
                    <span className="text-xs text-gray-500 mt-1">
                      {extractVariants(transaction.details)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;

