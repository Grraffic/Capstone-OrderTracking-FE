import React, { useState, useEffect } from "react";
import SystemAdminLayout from "../components/layouts/SystemAdminLayout";
import { useItemApproval } from "../hooks/useItemApproval";
import { CheckCircle2, XCircle, Search, CheckSquare, Square } from "lucide-react";
import { toast } from "react-hot-toast";

/**
 * ItemApproval Page
 *
 * System admin page for approving items added by property custodians
 * Features:
 * - View pending items
 * - Approve/reject items
 * - Bulk approve
 * - Search functionality
 * - Approval statistics
 */
const ItemApproval = () => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pendingOnly, setPendingOnly] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const {
    items,
    loading,
    error,
    pagination,
    stats,
    fetchItems,
    fetchStats,
    approveItem,
    approveItems,
    rejectItem,
  } = useItemApproval();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data when filters change
  useEffect(() => {
    fetchItems(
      {
        pendingOnly,
        search: debouncedSearch,
      },
      currentPage,
      10
    );
  }, [currentPage, debouncedSearch, pendingOnly, fetchItems]);

  // Fetch stats on mount and after approval actions
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /**
   * Handle approve single item
   */
  const handleApproveItem = async (itemId) => {
    try {
      await approveItem(itemId);
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    } catch (error) {
      // Error already handled in hook
    }
  };

  /**
   * Handle reject item
   */
  const handleRejectItem = async (itemId) => {
    if (
      window.confirm(
        "Are you sure you want to reject this item? It will be set back to pending status."
      )
    ) {
      try {
        await rejectItem(itemId);
        setSelectedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      } catch (error) {
        // Error already handled in hook
      }
    }
  };

  /**
   * Handle bulk approve
   */
  const handleBulkApprove = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select at least one item to approve");
      return;
    }

    try {
      await approveItems(Array.from(selectedItems));
      setSelectedItems(new Set());
    } catch (error) {
      // Error already handled in hook
    }
  };

  /**
   * Handle select/deselect item
   */
  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  /**
   * Handle select all visible items
   */
  const handleSelectAll = () => {
    const pendingItems = items.filter((item) => !item.isApproved);
    if (selectedItems.size === pendingItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(pendingItems.map((item) => item.id)));
    }
  };

  /**
   * Handle page change
   */
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setSelectedItems(new Set()); // Clear selection on page change
  };

  const pendingItems = items.filter((item) => !item.isApproved);
  const allPendingSelected =
    pendingItems.length > 0 &&
    pendingItems.every((item) => selectedItems.has(item.id));

  return (
    <SystemAdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#0C2340] rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0C2340]">Item Approval</h1>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve items added by property custodians
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Items</div>
            <div className="text-3xl font-bold text-[#0C2340] mt-2">
              {stats.total}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Approved</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {stats.approved}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.pending}
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C2340]"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pendingOnly}
                onChange={(e) => {
                  setPendingOnly(e.target.checked);
                  setCurrentPage(1);
                  setSelectedItems(new Set());
                }}
                className="w-4 h-4 text-[#0C2340] rounded focus:ring-[#0C2340]"
              />
              <span className="text-sm text-gray-700">Pending Only</span>
            </label>
          </div>

          {/* Bulk Approve Button */}
          {pendingOnly && selectedItems.size > 0 && (
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={20} />
              Approve Selected ({selectedItems.size})
            </button>
          )}
        </div>

        {/* Items Table */}
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading items...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <CheckCircle2 className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">
              {pendingOnly
                ? "No pending items to approve"
                : "No items found"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {pendingOnly && (
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center"
                        >
                          {allPendingSelected ? (
                            <CheckSquare className="text-[#0C2340]" size={20} />
                          ) : (
                            <Square className="text-gray-400" size={20} />
                          )}
                        </button>
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Education Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {pendingOnly && (
                        <td className="px-6 py-4">
                          {!item.isApproved && (
                            <button
                              onClick={() => handleSelectItem(item.id)}
                              className="flex items-center"
                            >
                              {selectedItems.has(item.id) ? (
                                <CheckSquare
                                  className="text-[#0C2340]"
                                  size={20}
                                />
                              ) : (
                                <Square className="text-gray-400" size={20} />
                              )}
                            </button>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.educationLevel}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.size || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.stock}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isApproved
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {!item.isApproved ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApproveItem(item.id)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <CheckCircle2 size={18} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectItem(item.id)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            >
                              <XCircle size={18} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRejectItem(item.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <XCircle size={18} />
                            Unapprove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} items
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SystemAdminLayout>
  );
};

export default ItemApproval;
