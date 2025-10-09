import { User } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="w-[90%] max-w-7xl mx-auto mb-10  flex justify-between items-center px-6 py-4 shadow-gray-800 rounded-xl shadow-md bg-black bg-opacity-10">
      {/* Left side - Logo + Title */}
      <div className="flex items-center gap-3">
        <img
          src="../../../assets/image/LV Logo.png"
          alt="La Verdad Logo"
          className="h-14 w-14"
        />
        <h1 className="text-xl font-semibold">
          <span className="text-[#003363] font-SFPro">La Verdad</span>
          <span className="text-[#F28C28] font-SFPro"> OrderFlow</span>
        </h1>
      </div>

      {/* Center Navigation */}
      <nav className="flex gap-10 font-medium">
        <NavLink
          to="/featured"
          className={({ isActive }) =>
            isActive
              ? "relative px-3 py-2 text-white bg-[#0C2340] rounded-md"
              : "relative px-3 py-2 text-[#0C2340] hover:text-[#F28C28] transition"
          }
        >
          Featured
          {({ isActive }) => (
            <span
              className={`absolute left-1/2 -bottom-1 w-8 h-[2px] transform -translate-x-1/2 transition ${
                isActive
                  ? "bg-[#F28C28]"
                  : "bg-transparent group-hover:bg-[#F28C28]"
              }`}
            ></span>
          )}
        </NavLink>

        <NavLink
          to="/about"
          className={({ isActive }) =>
            isActive
              ? "relative px-3 py-2 text-white bg-[#0C2340] rounded-md"
              : "relative px-3 py-2 text-[#0C2340] hover:text-[#F28C28] transition"
          }
        >
          About
          {({ isActive }) => (
            <span
              className={`absolute left-1/2 -bottom-1 w-8 h-[2px] transform -translate-x-1/2 transition ${
                isActive
                  ? "bg-[#F28C28]"
                  : "bg-transparent group-hover:bg-[#F28C28]"
              }`}
            ></span>
          )}
        </NavLink>

        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive
              ? "relative px-3 py-2 text-white bg-[#0C2340] rounded-md"
              : "relative px-3 py-2 text-[#0C2340] hover:text-[#F28C28] transition"
          }
        >
          Contact Us
          {({ isActive }) => (
            <span
              className={`absolute left-1/2 -bottom-1 w-8 h-[2px] transform -translate-x-1/2 transition ${
                isActive
                  ? "bg-[#F28C28]"
                  : "bg-transparent group-hover:bg-[#F28C28]"
              }`}
            ></span>
          )}
        </NavLink>
      </nav>

      {/* Right side - Auth links */}
      <div className="flex items-center gap-6">
        <NavLink
          to="/signup"
          className={({ isActive }) =>
            isActive
              ? "text-[#F28C28] relative font-medium"
              : "text-[#0C2340] relative font-medium hover:text-[#F28C28] transition"
          }
        >
          Sign up
          <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#F28C28]"></span>
        </NavLink>

        <NavLink
          to="/login"
          className={({ isActive }) =>
            isActive
              ? "flex items-center gap-2 px-4 py-2 border-2 border-[#003363] bg-[#0C2340] text-white rounded-full font-medium"
              : "flex items-center gap-2 px-4 py-2 border-2 border-[#003363] text-[#00396E] rounded-full font-medium hover:bg-[#0C2340] hover:text-white transition"
          }
        >
          <User size={18} />
          Log in
        </NavLink>
      </div>
    </header>
  );
}
