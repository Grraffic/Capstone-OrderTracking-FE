import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Maintenance Overlay Component
 *
 * Displays a full-screen gray overlay with maintenance message
 * Blocks all user interaction when maintenance mode is active
 */
const MaintenanceOverlay = ({ message }) => {
  console.log("🛠️ Rendering MaintenanceOverlay with message:", message);
  
  return (
    <div className="fixed inset-0 z-[99999]">
      {/* Gray filter overlay for the entire page - makes everything gray */}
      <div 
        className="absolute inset-0 bg-gray-500 opacity-80"
        style={{ 
          backdropFilter: "grayscale(100%)",
          WebkitBackdropFilter: "grayscale(100%)",
        }}
      ></div>
      
      {/* Maintenance message overlay */}
      <div className="absolute inset-0 bg-gray-700 bg-opacity-95 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md mx-4 text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-100 rounded-full p-4">
              <AlertTriangle className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            System Under Maintenance
          </h2>
          <p className="text-gray-600 mb-6 whitespace-pre-line">
            {message || "We are currently performing maintenance. Please check back later."}
          </p>
          <div className="text-sm text-gray-500">
            Thank you for your patience.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceOverlay;
