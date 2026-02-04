import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import transactionService from "../../services/transaction.service";
import { userAPI } from "../../services/user.service";
import { format } from "date-fns";
import { FileText, Search, Clock, X } from "lucide-react";

/**
 * Recent Audits Page
 * 
 * Displays all recent audit transactions with filtering and search capabilities
 */
const RecentAudits = () => {
  const [allAudits, setAllAudits] = useState([]); // Store all fetched audits
  const [audits, setAudits] = useState([]); // Displayed audits (paginated)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 0,
  });

  // Fetch all audits from backend
  const fetchAllAudits = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch audits for all roles except system_admin
      // This includes: students, finance staff, accounting staff, department heads, and property custodians
      // System admin actions are excluded to allow system admins to monitor all user actions
      const rolesToFetch = [
        "student", 
        "finance_staff", 
        "department_head", 
        "accounting_staff", 
        "property_custodian"
      ];
      
      // Fetch transactions for each role and combine them
      const allResults = await Promise.all(
        rolesToFetch.map(role => 
          transactionService.getTransactions({
            limit: 10000, // Fetch all audits for each role
            userRole: role,
          })
        )
      );

      // Combine all results into a single array
      const combinedData = allResults
        .filter(result => result.success && result.data)
        .flatMap(result => result.data);

      // Sort by created_at timestamp (most recent first) before processing
      combinedData.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA; // Descending order (newest first)
      });

      // Create a result object with the combined data
      const result = {
        success: true,
        data: combinedData,
      };

      if (result.success && result.data) {
        // Helper function to fetch user name with multiple fallback methods
        const fetchUserName = async (tx) => {
          // Try 1: Use stored user_name if valid
          if (tx.user_name && tx.user_name !== "System" && tx.user_name.trim() !== "") {
            return { name: tx.user_name, role: tx.user_role || null };
          }
          
          // Try 2: Fetch by user_id
          if (tx.user_id) {
            try {
              const userResponse = await userAPI.getUserById(tx.user_id);
              if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                const fetchedName = userResponse.data.data.name;
                const fetchedRole = userResponse.data.data.role;
                if (fetchedName && fetchedName !== "System" && fetchedName.trim() !== "") {
                  return { 
                    name: fetchedName, 
                    role: fetchedRole || tx.user_role || null 
                  };
                }
              }
            } catch (err) {
              console.warn(`[RecentAudits] Failed to fetch user by ID ${tx.user_id}:`, err);
            }
          }
          
          // Try 3: Fetch by email from metadata
          const emailFromMetadata = tx.metadata?.email || tx.metadata?.student_email;
          if (emailFromMetadata && typeof emailFromMetadata === "string") {
            try {
              // getUserById now supports email lookup if userId is an email
              const userResponse = await userAPI.getUserById(emailFromMetadata);
              if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                const fetchedName = userResponse.data.data.name;
                const fetchedRole = userResponse.data.data.role;
                if (fetchedName && fetchedName !== "System" && fetchedName.trim() !== "") {
                  // console.log(`[RecentAudits] ✅ Found user by email from metadata: ${emailFromMetadata}`);
                  return { 
                    name: fetchedName, 
                    role: fetchedRole || tx.user_role || null 
                  };
                }
              }
            } catch (err) {
              console.warn(`[RecentAudits] Failed to fetch user by email ${emailFromMetadata}:`, err);
            }
          }
          
          // Try 4: If user_id looks like an email, try fetching by it
          if (tx.user_id && typeof tx.user_id === "string" && tx.user_id.includes("@")) {
            try {
              const userResponse = await userAPI.getUserById(tx.user_id);
              if (userResponse.data && userResponse.data.success && userResponse.data.data) {
                const fetchedName = userResponse.data.data.name;
                const fetchedRole = userResponse.data.data.role;
                if (fetchedName && fetchedName !== "System" && fetchedName.trim() !== "") {
                  // console.log(`[RecentAudits] ✅ Found user by email (user_id): ${tx.user_id}`);
                  return { 
                    name: fetchedName, 
                    role: fetchedRole || tx.user_role || null 
                  };
                }
              }
            } catch (err) {
              console.warn(`[RecentAudits] Failed to fetch user by email (user_id) ${tx.user_id}:`, err);
            }
          }
          
          // Fallback: return stored values or System
          return { 
            name: tx.user_name || "System", 
            role: tx.user_role || null 
          };
        };
        
        // Fetch user names and roles for transactions
        const auditsWithUsers = await Promise.all(
          result.data.map(async (tx) => {
            const userInfo = await fetchUserName(tx);
            const userName = userInfo.name;
            const userRole = userInfo.role;
            
            // Format role for display (capitalize first letter of each word)
            const formatRole = (role) => {
              if (!role || role === "system" || role === "unknown") return null;
              // Special handling for specific roles
              if (role === "property_custodian") {
                return "Property Custodian";
              }
              if (role === "finance_staff") {
                return "Finance Staff";
              }
              if (role === "accounting_staff") {
                return "Accounting Staff";
              }
              if (role === "department_head") {
                return "Department Head";
              }
              if (role === "system_admin") {
                return "System Admin";
              }
              return role
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
            };
            
            return {
              id: tx.id,
              dateTime: format(new Date(tx.created_at), "MMM d, yyyy h:mm a"),
              user: userName,
              userRole: formatRole(userRole),
              action: tx.action || "Unknown Action",
              details: tx.details || "No details available",
              type: tx.type || "Unknown",
            };
          })
        );

        // Audits are already sorted by created_at, so we can use them directly
        const formattedAudits = auditsWithUsers;

        // Apply search filter on frontend if needed
        let filteredAudits = formattedAudits;
        if (search.trim()) {
          const searchLower = search.toLowerCase();
          filteredAudits = formattedAudits.filter(
            (audit) =>
              audit.action.toLowerCase().includes(searchLower) ||
              audit.user.toLowerCase().includes(searchLower) ||
              audit.details.toLowerCase().includes(searchLower) ||
              audit.type.toLowerCase().includes(searchLower)
          );
        }

        // Store all filtered audits
        setAllAudits(filteredAudits);
      } else {
        setAllAudits([]);
      }
    } catch (err) {
      console.error("Error fetching audits:", err);
      setError(err.message || "Failed to fetch audits");
      setAllAudits([]);
    } finally {
      setLoading(false);
    }
  };

  // Paginate the stored audits based on current page and filters
  useEffect(() => {
    let filteredAudits = allAudits;

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredAudits = allAudits.filter(
        (audit) =>
          audit.action.toLowerCase().includes(searchLower) ||
          audit.user.toLowerCase().includes(searchLower) ||
          audit.details.toLowerCase().includes(searchLower) ||
          audit.type.toLowerCase().includes(searchLower)
      );
    }

    // Paginate the filtered results (8 items per page)
    const totalFiltered = filteredAudits.length;
    const totalPages = Math.ceil(totalFiltered / 8) || 1;
    const startIndex = (currentPage - 1) * 8;
    const endIndex = startIndex + 8;
    const paginatedAudits = filteredAudits.slice(startIndex, endIndex);

    setAudits(paginatedAudits);
    setPagination({
      page: currentPage,
      limit: 8,
      total: totalFiltered,
      totalPages: totalPages,
    });
  }, [allAudits, currentPage, search]);

  // Fetch audits on mount
  useEffect(() => {
    fetchAllAudits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case "User":
        return "bg-blue-100 text-blue-800";
      case "Order":
        return "bg-green-100 text-green-800";
      case "Inventory":
        return "bg-purple-100 text-purple-800";
      case "Item":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0C2340]">Recent Audits</h1>
            <p className="text-gray-600 mt-1">View all activity and audit logs from all users (excluding system admin actions)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by action, user, or details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0C2340] focus:border-transparent"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Audits Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading audits...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded-lg">
              Error loading audits: {error}
            </div>
          ) : audits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No audits found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {audits.map((audit) => (
                      <tr 
                        key={audit.id} 
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedAudit(audit);
                          setIsModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{audit.dateTime}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{audit.user}</span>
                            {audit.userRole && (
                              <span className="text-xs text-gray-500 mt-0.5">{audit.userRole}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{audit.action}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                              audit.type
                            )}`}
                          >
                            {audit.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600" title={audit.details}>
                            {audit.details.length > 50
                              ? `${audit.details.substring(0, 50)}...`
                              : audit.details}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Pagination - Left text, Right buttons */}
          {!loading && !error && pagination.totalPages > 0 && (
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between mt-4">
              {/* Left side - Page info */}
              <div className="text-sm text-gray-600">
                Page {currentPage} of {pagination.totalPages}
              </div>
              
              {/* Right side - Navigation buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                      setCurrentPage(page);
                    }
                  }}
                  onBlur={(e) => {
                    const page = parseInt(e.target.value);
                    if (!page || page < 1) {
                      setCurrentPage(1);
                    } else if (page > pagination.totalPages) {
                      setCurrentPage(pagination.totalPages);
                    } else {
                      setCurrentPage(page);
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
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage >= pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e68b00] border border-[#e68b00] rounded-lg hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e68b00] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Details Modal */}
      {isModalOpen && selectedAudit && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              setSelectedAudit(null);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#0C2340]">Audit Details</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAudit(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                <p className="text-sm text-gray-900">{selectedAudit.dateTime}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <p className="text-sm text-gray-900">{selectedAudit.user}</p>
                {selectedAudit.userRole && (
                  <p className="text-xs text-gray-500 mt-0.5">{selectedAudit.userRole}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <p className="text-sm text-gray-900">{selectedAudit.action}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                    selectedAudit.type
                  )}`}
                >
                  {selectedAudit.type}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedAudit.details}</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedAudit(null);
                }}
                className="px-4 py-2 bg-[#0C2340] text-white font-medium rounded-lg hover:bg-[#0a1d33] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </SystemAdminLayout>
  );
};

export default RecentAudits;
