import React from "react";

const HeroSection = () => {
  return (
    <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/assets/image/LandingPage.png"
          alt="La Verdad Campus"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback gradient if image fails to load
            e.target.style.display = "none";
            e.target.parentElement.style.background =
              "linear-gradient(135deg, #003363 0%, #0C2340 100%)";
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#003363]/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-start justify-start px-4 sm:px-8 md:px-16 pt-8 sm:pt-12 md:pt-16">
        <div className="text-left">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl leading-tight">
            Order
            <br />
            Yours
          </h1>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
