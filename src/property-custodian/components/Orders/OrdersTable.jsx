import React, { useState } from "react";
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import EditOrderModal from "./EditOrderModal";

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
  onOrderUpdated,
  onOpenQRScanner,
}) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [openMenuId, setOpenMenuId] = useState(null);
  
  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Handle edit click
  const handleEditClick = (order) => {
    setSelectedOrder(order.originalOrder || order);
    setEditModalOpen(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setEditModalOpen(false);
    setSelectedOrder(null);
  };

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
    <div className="space-y-3 sm:space-y-4">
      {/* Table Header Row - Always visible on desktop, hidden on mobile */}
      <div className="hidden lg:block bg-[#0C2340] rounded-xl py-3 sm:py-4 px-4 sm:px-6 shadow-lg">
        <div className="grid grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-center">
          <div className="text-xs sm:text-sm font-bold text-white">Transaction no.</div>
          <div className="text-xs sm:text-sm font-bold text-white">Item Ordered</div>
          <div className="text-xs sm:text-sm font-bold text-white">Size</div>
          <div className="text-xs sm:text-sm font-bold text-white">Name</div>
          <div className="text-xs sm:text-sm font-bold text-white">Education level</div>
          <div className="text-xs sm:text-sm font-bold text-white text-right">Action</div>
        </div>
      </div>

      {/* Table Rows or Empty State */}
      {(!orders || orders.length === 0) ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-8 sm:p-12 text-center">
            <div className="text-gray-400 mb-3 sm:mb-4">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
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
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
              No Orders Found
            </h3>
            <p className="text-sm sm:text-base text-gray-500 px-4">
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
            className={`bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-amber-50/30 transition-all duration-200 ${
              selectedRows.has(order.id) ? "bg-amber-50/50" : ""
            }`}
          >
            {/* Desktop Layout - Grid */}
            <div className="hidden lg:grid lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 items-center p-4 sm:p-5 lg:p-6">
              {/* Transaction No */}
              <div className="text-xs sm:text-sm font-bold text-[#0C2340] truncate">
                {order.transactionNo}
              </div>

              {/* Item Ordered */}
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-[#0C2340] mb-1 truncate">
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
                className={`text-xs sm:text-sm font-semibold truncate ${getSizeColor(
                  order.size
                )}`}
              >
                {order.size || "N/A"}
              </div>

              {/* Name */}
              <div className="text-xs sm:text-sm font-medium text-[#0C2340] truncate">
                {order.name}
              </div>

              {/* Education level */}
              <div className="text-xs sm:text-sm font-medium text-blue-600 truncate">
                {order.gradeOrProgram}
              </div>

              {/* Action Icons */}
              <div className="flex items-center justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => handleEditClick(order)}
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

            {/* Mobile/Tablet Layout - Stacked */}
            <div className="lg:hidden p-3 sm:p-4 space-y-2.5 sm:space-y-3">
              {/* Transaction No & Actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Transaction No.</div>
                  <div className="text-sm sm:text-base font-bold text-[#0C2340] break-words">
                    {order.transactionNo}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditClick(order)}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded transition-colors"
                    aria-label="Edit order"
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => {
                      console.log("Delete order:", order.id);
                    }}
                    className="p-1.5 sm:p-2 hover:bg-red-50 rounded transition-colors"
                    aria-label="Delete order"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              {/* Item Ordered */}
              <div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">Item Ordered</div>
                <div className="text-sm sm:text-base font-semibold text-[#0C2340] break-words">
                  {order.itemOrdered}
                </div>
                {order.moreItems && (
                  <a
                    href="#"
                    className="text-xs text-gray-500 hover:text-[#e68b00] transition-colors inline-block mt-1"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("See more clicked for order:", order.id);
                    }}
                  >
                    See more
                  </a>
                )}
              </div>

              {/* Size and Name - Side by side on larger mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {/* Size */}
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Size</div>
                  <div className={`text-sm sm:text-base font-semibold ${getSizeColor(order.size)}`}>
                    {order.size || "N/A"}
                  </div>
                </div>

                {/* Name */}
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-0.5">Name</div>
                  <div className="text-sm sm:text-base font-medium text-[#0C2340] break-words">
                    {order.name}
                  </div>
                </div>
              </div>

              {/* Education level */}
              <div>
                <div className="text-xs text-gray-500 font-medium mb-0.5">Education level</div>
                <div className="text-sm sm:text-base font-medium text-blue-600 break-words">
                  {order.gradeOrProgram}
                </div>
              </div>
            </div>
          </div>
        );
      })
      )}

      {/* Pagination Controls */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between mt-4">
        {/* Left side - Page info */}
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        
        {/* Right side - Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 transition-colors"
            title="Previous page"
            aria-label="Previous page"
          >
            Previous
          </button>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages && onGoToPage) {
                onGoToPage(page);
              }
            }}
            onBlur={(e) => {
              const page = parseInt(e.target.value);
              if (!page || page < 1) {
                if (onGoToPage) onGoToPage(1);
              } else if (page > totalPages) {
                if (onGoToPage) onGoToPage(totalPages);
              } else {
                if (onGoToPage) onGoToPage(page);
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
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-medium text-white bg-[#e68b00] border border-[#e68b00] rounded-lg hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#e68b00] transition-colors"
            title="Next page"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Order Modal */}
      <EditOrderModal 
        isOpen={editModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onOrderUpdated={onOrderUpdated}
        onOpenQRScanner={onOpenQRScanner}
      />
    </div>
  );
};

export default OrdersTable;

