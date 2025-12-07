import React, { useState } from "react";
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * OrdersTable Component
 *
 * Displays a comprehensive table of all orders with:
 * - Checkbox selection
 * - Transaction number
 * - Item ordered (with "more items" indicator)
 * - Size/Description
 * - Customer name
 * - Grade or Program
 * - Transaction date
 * - Action menu
 * - Pagination controls (Previous/Next buttons)
 *
 * Reuses the same design and layout as RecentOrdersTable from Dashboard
 *
 * Props:
 * - orders: Array of order objects to display
 * - currentPage: Current page number
 * - totalPages: Total number of pages
 * - onPrevPage: Handler for previous page button
 * - onNextPage: Handler for next page button
 * - onGoToPage: Handler for going to specific page
 */
const OrdersTable = ({
  orders,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
}) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleRowSelection = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === orders.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(orders.map((order) => order.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Header Row - Always visible */}
      <div className="bg-[#0C2340] rounded-xl py-4 px-6 shadow-lg">
        <div className="grid grid-cols-7 gap-6 items-center">
          <div className="text-sm font-bold text-white">Transaction no.</div>
          <div className="text-sm font-bold text-white">Item Ordered</div>
          <div className="text-sm font-bold text-white">Size</div>
          <div className="text-sm font-bold text-white">Name</div>
          <div className="text-sm font-bold text-white">Grade Level</div>
          <div className="text-sm font-bold text-white">Grade Level Category</div>
          <div className="text-sm font-bold text-white text-right">Action</div>
        </div>
      </div>

      {/* Table Rows or Empty State */}
      {(!orders || orders.length === 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-500">
              There are no orders to display at the moment.
            </p>
          </div>
        </div>
      ) : (
        orders.map((order) => {
        // Helper function to get size color
        const getSizeColor = (size) => {
          const sizeUpper = (size || "").toUpperCase();
          if (sizeUpper === "SMALL") return "text-[#e68b00]";
          if (sizeUpper === "MEDIUM") return "text-[#d97706]";
          if (sizeUpper === "LARGE") return "text-[#e68b00]";
          return "text-gray-600";
        };

        return (
          <div
            key={order.id}
            className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:bg-amber-50/30 transition-all duration-200 ${
              selectedRows.has(order.id) ? "bg-amber-50/50" : ""
            }`}
          >
            <div className="grid grid-cols-7 gap-6 items-center">
              {/* Transaction No */}
              <div className="text-sm font-bold text-[#0C2340]">
                {order.transactionNo}
              </div>

              {/* Item Ordered */}
              <div>
                <div className="text-sm font-semibold text-[#0C2340] mb-1">
                  {order.itemOrdered}
                </div>
                {order.moreItems && (
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-[#e68b00] transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("See more clicked for order:", order.id);
                    }}
                  >
                    See more
                  </a>
                )}
              </div>

              {/* Size */}
              <div
                className={`text-sm font-semibold ${getSizeColor(
                  order.size
                )}`}
              >
                {order.size || "N/A"}
              </div>

              {/* Name */}
              <div className="text-sm font-medium text-[#0C2340]">
                {order.name}
              </div>

              {/* Grade Level */}
              <div className="text-sm font-medium text-blue-600">
                {order.gradeOrProgram}
              </div>

              {/* Grade Level Category */}
              <div className="text-sm font-medium text-blue-600">
                {order.gradeOrProgram}
              </div>

              {/* Action Icons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    console.log("Edit order:", order.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Edit order"
                  title="Edit order"
                >
                  <Edit2 size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    console.log("Delete order:", order.id);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded transition-colors"
                  aria-label="Delete order"
                  title="Delete order"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        );
      })
      )}

      {/* Pagination Controls */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Left: Page Indicator */}
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold">{currentPage}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </div>

        {/* Right: Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors flex items-center gap-1 font-medium text-sm"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
            <span>Previous</span>
          </button>

          {/* Next Button */}
          <button
            onClick={onNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-[#e68b00] text-white rounded-lg hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e68b00] transition-colors flex items-center gap-1 font-medium text-sm shadow-sm"
            title="Next page"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;

