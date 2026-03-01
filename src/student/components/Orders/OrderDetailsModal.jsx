import React from "react";
import { createPortal } from "react-dom";

/**
 * Order Details Modal
 *
 * Shows a single order's details: Name, Student No., Transaction No., Item, Size,
 * Order Amount, Status (Completed in green), Date Claimed, completion message, and Back button.
 */
const OrderDetailsModal = ({ order, item, profileData, onClose }) => {
  if (!order) return null;

  const name = order.student_name || order.studentName || "—";
  const studentNo =
    profileData?.studentNumber ||
    profileData?.student_number ||
    order.student_number ||
    "—";
  const transactionNo =
    order.order_number || order.orderNumber || order.id || "—";
  const items = order.items || [];
  const displayItem = item || (items.length > 0 ? items[0] : null);
  const itemName =
    displayItem?.name ||
    order.item ||
    (items.length > 0 ? items.map((i) => i.name).join(", ") : "—");
  const size =
    displayItem?.size ||
    order.size ||
    (items.length > 0 ? items[0].size : null) ||
    "—";
  const totalAmount = Number(order.total_amount);
  const amountDisplay =
    isNaN(totalAmount) || totalAmount === 0 || totalAmount === null
      ? "FREE"
      : `P${Number(totalAmount).toFixed(2)}`;
  const status =
    order.status === "claimed" || order.status === "completed"
      ? "Completed"
      : order.status || "—";
  const isCompleted = status === "Completed";
  // Date Claimed: Show today's date (when QR code is scanned)
  const dateClaimedDisplay = new Date().toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-2 sm:p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Order details"
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors z-10"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="text-center text-xl sm:text-2xl font-bold mb-6 pr-8">
          <span className="text-[#003363]">Order </span>
          <span className="text-[#F28C28]">Details</span>
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">Name</span>
            <span className="text-sm font-medium text-gray-900 text-right">
              {name}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">
              Student No.
            </span>
            <span className="text-sm font-medium text-gray-900 text-right">
              {studentNo}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">
              Transaction No.
            </span>
            <span className="text-sm font-medium text-[#003363] text-right">
              {transactionNo === "—" || !transactionNo
                ? "—"
                : String(transactionNo).startsWith("#")
                  ? transactionNo
                  : `#${transactionNo}`}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">Item</span>
            <span className="text-sm font-medium text-[#003363] text-right">
              {itemName}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">Size</span>
            <span className="text-sm font-medium text-[#003363] text-right">
              {size}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">
              Order Amount
            </span>
            <span className="text-sm font-medium text-gray-900 text-right">
              {amountDisplay}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">Status</span>
            <span
              className={`text-sm font-semibold ${isCompleted ? "text-green-600" : "text-gray-900"}`}
            >
              {status}
            </span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="text-sm font-medium text-gray-600">
              Date Claimed
            </span>
            <span className="text-sm font-medium text-gray-900 text-right">
              {dateClaimedDisplay}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {isCompleted && (
            <p className="text-sm italic text-green-600">
              This order is completed.
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors ml-auto sm:ml-0"
          >
            Back
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default OrderDetailsModal;
