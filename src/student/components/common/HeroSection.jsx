import React from "react";

/**
 * @param {Object} props
 * @param {string} [props.heading] - Override text (e.g. "User Profile", "Item Card"). Default: "Order\nYours"
 * @param {'left'|'bottom-right'|'bottom-center'} [props.align] - Position of heading. Default: "left"
 */
const HeroSection = ({ heading, align = "left" }) => {
  const heroHeight = "20rem"; // 16rem image + 4rem for spacing
  const isBottomRight = align === "bottom-right";
  const isBottomCenter = align === "bottom-center";
  const displayText = heading ?? "Order\nYours";

  const contentClasses =
    align === "bottom-right"
      ? "relative z-10 px-4 sm:px-8 md:px-16 h-full flex items-end justify-end pb-6"
      : align === "bottom-center"
        ? "relative z-10 px-4 sm:px-8 md:px-16 h-full flex items-end justify-center pb-6"
        : "relative z-10 px-4 sm:px-8 md:px-16 pt-24";

  const headingClasses = `text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-2xl leading-tight ${isBottomRight ? "text-right" : isBottomCenter ? "text-center" : ""}`;

  return (
    <div
      className="relative w-full overflow-hidden sticky z-0"
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

      {/* Hero Content – left (default), bottom-right, or bottom-center */}
      <div className={contentClasses}>
        <h1 className={headingClasses}>
          {displayText.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < displayText.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </h1>
      </div>
    </div>
  );
};

export default HeroSection;
