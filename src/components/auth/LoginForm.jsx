import React, { useState } from "react";

export default function LoginPage() {
  const [role, setRole] = useState("Student");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10">
          <button className="text-sm text-gray-500 mb-6 flex items-center gap-2">
            ← Back
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login</h2>
          <p className="text-gray-500 mb-6">
            You are now logging-in as a{" "}
            <span className="text-blue-600 font-semibold">{role}</span>
          </p>

          {/* Role Switch */}
          <div className="flex mb-6">
            <button
              className={`w-1/2 py-2 rounded-l-lg border ${
                role === "Student"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setRole("Student")}
            >
              Student
            </button>
            <button
              className={`w-1/2 py-2 rounded-r-lg border ${
                role === "Coordinator"
                  ? "bg-blue-900 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setRole("Coordinator")}
            >
              Coordinator
            </button>
          </div>

          {/* Info Box */}
          <div className="flex items-center p-3 mb-6 bg-gray-100 rounded-lg">
            <span className="text-xl mr-3">👥</span>
            <div>
              <p className="font-semibold text-gray-700">Student Portal</p>
              <p className="text-sm text-gray-500">
                You can now access the user side of the site
              </p>
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600">E-mail</label>
            <input
              type="email"
              placeholder="Enter your e-mail"
              className="w-full border-b focus:outline-none focus:border-blue-600 py-2"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border-b focus:outline-none focus:border-blue-600 py-2"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex justify-between items-center mb-6">
            <label className="flex items-center text-sm text-gray-600">
              <input type="checkbox" className="mr-2" />
              Remember me
            </label>
            <a href="#" className="text-sm text-blue-600">
              Forgot your password
            </a>
          </div>

          {/* Login Button */}
          <button className="w-full bg-blue-900 text-white py-2 rounded-lg font-semibold">
            Login
          </button>

          {/* Register Link */}
          <p className="text-sm text-center mt-6 text-gray-600">
            Don’t have an account?{" "}
            <a href="#" className="text-orange-500 font-semibold">
              Register here
            </a>
          </p>
        </div>

        {/* Right Side - Welcome Image */}
        <div className="w-full md:w-1/2 bg-gray-50 relative flex flex-col items-center justify-center p-8 md:p-10">
          <img
            src="https://via.placeholder.com/400x300"
            alt="Placeholder"
            className="w-full h-56 md:h-64 object-cover rounded-lg shadow-md mb-6"
          />
          <h2 className="text-2xl font-bold text-center md:text-left">
            Welcome <span className="text-orange-500">back</span>
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center md:text-left">
            Sign in to your account to continue
          </p>
        </div>
      </div>
    </div>
  );
}
