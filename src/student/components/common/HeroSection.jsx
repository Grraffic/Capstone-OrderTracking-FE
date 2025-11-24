import React from "react";

const HeroSection = () => {
  const heroHeight = "20rem"; // 16rem image + 4rem for spacing

  return (
    <div
      className="relative w-full overflow-hidden sticky  z-0"
      style={{ height: heroHeight }}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/image/LandingPage.png"
          alt="La Verdad Campus"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background =
              "linear-gradient(135deg, #003363 0%, #0C2340 100%)";
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#003363]/40 to-transparent"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 px-4 sm:px-8 md:px-16 pt-24">
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl leading-tight">
          Order
          <br />
          Yours
        </h1>
      </div>
    </div>
  );
};

export default HeroSection;
