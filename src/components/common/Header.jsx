import { User } from "lucide-react";

export default function Header() {
  return (
    <header className="w-full flex justify-between items-center px-16 py-8 bg-white shadow-sm">
      {/* Left side - Logo + Title */}
      <div className="flex items-center gap-3">
        <img
          src="../../../assets/image/LV Logo.png" // replace with your logo path
          alt="La Verdad Logo"
          className="h-16 w-16"
        />
        <h1 className="text-xl font-semibold">
          <span className="text-[#003363] font-SFPro">La Verdad</span>
          <span className="text-[#F28C28] font-SFPro"> OrderFlow</span>
        </h1>
      </div>

      {/* Right side - Auth links */}
      <div className="flex items-center gap-6">
        <a
          href="/signup"
          className="text-[#0C2340] relative font-medium hover:text-[#F28C28] transition"
        >
          Sign up
          <span className="absolute left-0 -bottom-1 w-full h-[2px] bg-[#F28C28]"></span>
        </a>

        <a
          href="/login"
          className="flex items-center gap-2 px-4 py-2 border-2 border-[#003363] text-[#00396E] rounded-full font-medium hover:bg-[#0C2340] hover:text-white transition"
        >
          <User size={18} />
          Log in
        </a>
      </div>
    </header>
  );
}
