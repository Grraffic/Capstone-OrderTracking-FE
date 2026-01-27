import React from "react";
import { AlertCircle, Lock, Mail } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Inactive User Overlay Component
 *
 * Displays a full-screen gray overlay when a user's account is inactive
 * Blocks all user interaction with a beautiful, user-friendly design
 */
const InactiveUserOverlay = ({ userName, email }) => {
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
      
      {/* Background with logo */}
      <div className="absolute inset-0 bg-[#fefefe]">
        <img
          src="/assets/image/LandingPage.png"
          alt="Background"
          className="w-full h-full object-cover opacity-30 pointer-events-none"
        />
      </div>
      
      {/* Inactive user message overlay */}
      <div className="absolute inset-0 bg-gray-700 bg-opacity-90 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 text-center relative z-10 border-2 border-red-100">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/assets/image/LV Logo.png"
              alt="La Verdad Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 rounded-full p-5 border-4 border-red-100">
              <Lock className="h-16 w-16 text-red-600" />
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-3xl font-bold text-[#0C2340] mb-3">
            Account Deactivated
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-6">
            {userName 
              ? `Hello, ${userName}!`
              : email
              ? `Hello!`
              : "Hello!"}
          </p>
          
          {/* Main message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg text-left">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-800 font-medium mb-1">
                  Your account has been deactivated
                </p>
                <p className="text-sm text-gray-600">
                  An administrator has temporarily disabled access to your account. 
                  You will not be able to log in or access the system until your account is reactivated.
                </p>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  What to do next:
                </p>
                <p className="text-sm text-blue-800">
                  Please contact your system administrator to request account reactivation. 
                  {email && (
                    <span className="block mt-1 font-mono text-xs text-blue-700">
                      Your email: {email}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action button */}
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#0C2340] hover:bg-[#0a1d33] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <span>Return to Home</span>
            </Link>
            <p className="text-xs text-gray-500">
              You can return to the home page, but you won't be able to access your account until it's reactivated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactiveUserOverlay;
