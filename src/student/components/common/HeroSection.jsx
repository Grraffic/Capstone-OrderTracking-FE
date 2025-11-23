import React from "react";

const HeroSection = () => {
  const heroHeight = "calc(16rem + 4rem)"; // 16rem image + 4rem navbar

  return (
    <div
      className="pointer-events-none"
      style={{ "--hero-height": heroHeight }}
    >
      {/* Fixed Background */}
      <div
        className="fixed top-0 left-0 right-0 z-0"
        style={{
          height: "var(--hero-height)",
        }}
      >
        <img
          src="/assets/image/LandingPage.png"
          alt="La Verdad Campus"
          className="w-full h-full object-cover"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "var(--hero-height)",
            objectFit: "cover",
          }}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.parentElement.style.background =
              "linear-gradient(135deg, #003363 0%, #0C2340 100%)";
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#003363]/40 to-transparent"></div>
      </div>

      {/* Fixed Content */}
      <div
        className="fixed px-4 sm:px-8 md:px-16"
        style={{
          top: "calc(4rem + 2rem)", // Navbar + small offset
          zIndex: -5,
        }}
      >
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
