import React from "react";
import { createPortal } from "react-dom";

/**
 * DisableUserModal Component
 * 
 * Confirmation modal for disabling a user
 */
const DisableUserModal = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Content */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon – red triangular warning with white exclamation */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <svg
              viewBox="0 0 64 64"
              className="w-16 h-16 flex-shrink-0"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M32 6L58 54H6L32 6Z"
                fill="#dc2626"
                stroke="#dc2626"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M32 20v20"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="32" cy="48" r="3" fill="white" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-[#0C2340] text-center mb-4">
          Disable User
        </h2>

        {/* Message */}
        <p className="text-[#0C2340] text-center mb-8">
          Are you sure you want to disable <span className="font-bold">{userName}</span>?
        </p>

        {/* Buttons */}
        <div className="flex gap-4">
          {/* No Button */}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm"
          >
            No
          </button>

          {/* Yes Button */}
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            Yes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DisableUserModal;
