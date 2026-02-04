import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const uniforms = [
  {
    id: "uniform-1",
    images: [
      { src: "../../assets/image/PANTS.png", alt: "Higher Education Pants" },
      { src: "../../assets/image/SHS BLOUSE.png", alt: "Higher Education Blouse" },
      { src: "../../assets/image/SHS SKIRT.png", alt: "Higher Education Skirt" },
    ],
    text: "Higher Education",
  },
  {
    id: "uniform-2",
    images: [
      { src: "../../assets/image/KINDER DRESS.png", alt: "Basic Education Dress" },
      { src: "../../assets/image/ELEMENTARY BLOUSE.png", alt: "Elementary Blouse" },
      { src: "../../assets/image/JHS BLOUSE.png", alt: "Junior High Blouse" },
      { src: "../../assets/image/POLO JACKET (Elem & JHS).png", alt: "Polo Jacket" },
    ],
    text: "Basic Education",
  },
  {
    id: "uniform-3",
    images: [
      { src: "../../assets/image/POLO JACKET (Elem & JHS).png", alt: "Basic Education Polo" },
      { src: "../../assets/image/JERSEY.png", alt: "PE Jersey" },
      { src: "../../assets/image/JOGGING PANTS.png", alt: "Jogging Pants" },
    ],
    text: "Basic Education Polo",
  },
];

const carouselSlides = [
  {
    type: "main",
    content: (
      <div className="relative w-full h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[55vh] xl:h-[60vh] bg-[#F3F3F3]">
        <h1 className="absolute left-0 top-1 px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 tracking-[-4px] sm:tracking-[-6px] md:tracking-[-5px] leading-none text-[42px] sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-SFRegular text-[#00396E] opacity-100 z-[0]">
          La Verdad{" "}
          <span className="text-[#f59301] drop-shadow-lg leading-tight text-[45px] sm:text-6xl md:text-7xl lg:text-[80px] xl:text-[110px] flex font-SFRegular">
            OrderFlow
          </span>
        </h1>

        <p className="absolute right-2 top-6 sm:right-3 sm:top-8 md:right-4 md:top-10 font-SFRegular text-xs sm:text-sm md:text-base text-[#00396E] opacity-100 z-[0] leading-tight">
          A seamless Order Tracking for <br />
          <span className="text-[#E68B00]">School Uniform and Items</span>
        </p>

        <img
          src="../../assets/image/LandingPage.png"
          alt="La Verdad Christian College"
          className="absolute inset-0 z-[10] w-full h-full object-cover shadow-gray-800 rounded-lg sm:rounded-xl shadow-md bg-black bg-opacity-10 pointer-events-none"
        />
      </div>
    ),
  },
  {
    type: "features",
    content: null, // This slide is dynamic below
  },
];

function FeatureCarousel() {
  const navigate = useNavigate();
  const [mainIndex, setMainIndex] = useState(0);
  const [displayedUniforms, setDisplayedUniforms] = useState([...uniforms]);
  
  // Track current image index for each uniform
  const [uniformImageIndices, setUniformImageIndices] = useState(
    uniforms.reduce((acc, uniform) => {
      acc[uniform.id] = 0;
      return acc;
    }, {})
  );

  // Auto-rotate images within each uniform card
  useEffect(() => {
    if (mainIndex !== 1) return;

    const imageRotationInterval = setInterval(() => {
      setUniformImageIndices((prev) => {
        const newIndices = { ...prev };
        displayedUniforms.forEach((uniform) => {
          newIndices[uniform.id] = 
            (prev[uniform.id] + 1) % uniform.images.length;
        });
        return newIndices;
      });
    }, 4000); // Rotate images every 4 seconds

    return () => clearInterval(imageRotationInterval);
  }, [mainIndex, displayedUniforms]);

  // Auto-rotate uniforms every 5 seconds (only on the uniforms/features slide)
  useEffect(() => {
    if (mainIndex !== 1) return;

    const intervalId = setInterval(() => {
      setDisplayedUniforms((prev) => {
        const newArray = [...prev];
        const firstItem = newArray.shift();
        newArray.push(firstItem);
        return newArray;
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [mainIndex]);

  // Handle circular navigation - move 2nd to 1st, 1st to last
  const handleNext = () => {
    setDisplayedUniforms((prev) => {
      const newArray = [...prev];
      const firstItem = newArray.shift(); // Remove first item
      newArray.push(firstItem); // Add it to the end
      return newArray;
    });
  };

  // Handle back navigation - move last to 1st, 1st to 2nd
  const handleBack = () => {
    setDisplayedUniforms((prev) => {
      const newArray = [...prev];
      const lastItem = newArray.pop(); // Remove last item
      newArray.unshift(lastItem); // Add it to the beginning
      return newArray;
    });
  };

  const renderUniformCards = () => (
    <div className="flex gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 justify-end items-end flex-nowrap sm:absolute sm:left-0 sm:top-[96px] md:absolute md:left-0 md:top-[96px] lg:relative lg:left-auto lg:top-auto w-full max-w-full">
      {displayedUniforms.map((uniform, idx) => (
        <div
          key={uniform.id}
          className={`flex flex-col items-center justify-center
            rounded-lg sm:rounded-xl shadow-lg transition-all duration-500 ease-in-out
            w-[clamp(90px,18vw,200px)] min-h-[115px] h-[clamp(115px,22vw,220px)]
            transform
            ${idx === 0 ? "relative scale-105 flex" : idx === 1 ? "relative scale-100 hidden sm:flex bg-white" : "relative scale-95 hidden md:flex bg-white"}
          `}
          style={
            idx === 0
              ? {
                  zIndex: 2,
                  background: "linear-gradient(to bottom, #F3F3F3 0%, rgba(249,240,227,0.97) 11%, rgba(203,123,0,0.7) 60%, rgba(1,109,211,0.7) 100%)",
                }
              : { zIndex: 1 }
          }
        >
          <img
            key={`${uniform.id}-${uniformImageIndices[uniform.id]}`}
            src={uniform.images[uniformImageIndices[uniform.id]]?.src || uniform.images[0].src}
            alt={uniform.images[uniformImageIndices[uniform.id]]?.alt || uniform.images[0].alt}
            className="w-full h-full min-h-[100px] max-h-[200px] object-contain object-center flex-1"
            style={{
              animation: "fadeIn 0.8s ease-in-out",
            }}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative w-full min-h-[280px] h-[40vh] sm:h-[45vh] md:h-[50vh] lg:h-[55vh] xl:h-[60vh]">
      <div className="relative z-20 w-full h-full">
        {mainIndex === 0 ? (
          carouselSlides[mainIndex].content
        ) : (
          <div className="relative w-full h-full">
            <div className="relative w-full h-full">
              <img
                src="../../assets/image/LandingPage.png"
                alt="Building Background"
                className="absolute z-10 w-full h-full object-cover shadow-gray-800 rounded-lg sm:rounded-xl shadow-md bg-black bg-opacity-10"
              />
              <div className="absolute inset-0 bg-white opacity-80 z-10" />
              <div className="relative z-20 flex flex-col h-full items-end gap-2 sm:gap-3 md:gap-4">
                {/* La Verdad OrderFlow label - one position per breakpoint */}
                <p className="absolute left-[10px] top-4 sm:left-6 sm:top-8 md:left-8 md:top-10 lg:left-8 lg:top-8 text-xs sm:text-sm md:text-base text-[#00396E] font-semibold py-1 sm:py-2 px-2 sm:px-4 md:px-6 z-30">
                  La Verdad <span className="text-[#E68B00]">OrderFlow</span>
                </p>
                {/* Single content block: title, hr, description, Order Now - in line at every breakpoint */}
                <div className="absolute left-[20px] top-[80px] sm:left-6 sm:top-[120px] md:left-6 md:top-[126px] lg:left-4 lg:top-34 max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md z-30 flex flex-col text-left font-sf-semibold">
                  <div className="flex flex-col px-2 pt-0 sm:px-4 sm:pt-0 md:px-6 md:pt-0 lg:px-10 lg:pt-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#00396E] leading-tight">
                      School <br />{" "}
                      <span className="text-[#E68B00]">Uniforms</span>
                    </h2>
                    <hr className="border border-[#f59301] sm:border-2 w-[122px] sm:w-24 md:w-[235px] lg:w-[238px] my-1 sm:my-2" />
                    <p className="text-[10px] sm:text-xs md:text-sm text-[#003363] mb-1 sm:mb-1.5 md:mb-2 font-medium leading-tight">
                      School Uniforms from Basic Education
                      <br />
                      to Higher Education
                      are now Available
                    </p>
                    <button 
                      onClick={() => navigate("/login")}
                      className="mt-1 sm:mt-1.5 md:mt-2 px-3 py-2 sm:px-5 sm:py-2.5 md:px-8 md:py-3 border border-[#f59301] sm:border-2 text-[#f59301] rounded-full font-bold shadow hover:bg-orange-50 hover:text-orange-600 transition w-fit text-xs sm:text-sm md:text-base min-h-[6px] sm:min-h-[40px] md:min-h-[44px] flex items-center justify-center self-start"
                    >
                      Order Now
                    </button>
                  </div>
                </div>

                <div className="absolute right-[10px] top-[50px] sm:right-6 sm:top-8 md:right-4 md:top-8 lg:right-4 lg:top-2 z-40">
                  <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-1 items-end min-w-[100px] sm:min-w-0">
                    <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2 md:gap-3 justify-end ">
                      <div className="flex gap-1 sm:gap-1.5 md:gap-2 items-center justify-end order-1 sm:order-3 pr-4 md:mt-10 md:pr-0">
                        <button
                          className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1 border border-[#00396E] sm:border-2 text-[#00396E] bg-white rounded-full font-bold shadow hover:bg-orange-50 hover:text-orange-600 transition text-[10px] sm:text-xs md:text-sm min-h-[28px] sm:min-h-[32px] md:min-h-[36px] min-w-[40px] sm:min-w-[48px] md:min-w-[55px] flex items-center justify-center"
                          onClick={handleBack}
                          aria-label="Back"
                        >
                          Back
                        </button>
                        <button
                          className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-1 border border-[#00396E] sm:border-2 text-[#00396E] bg-white rounded-full font-bold shadow hover:bg-orange-50 hover:text-orange-600 transition text-[10px] sm:text-xs md:text-sm min-h-[28px] sm:min-h-[32px] md:min-h-[36px] min-w-[40px] sm:min-w-[48px] md:min-w-[55px] flex items-center justify-center"
                          onClick={handleNext}
                          aria-label="Next"
                        >
                          Next
                        </button>
                      </div>
                      <span className="text-[#00396E] font-medium text-[10px] sm:text-xs md:text-sm whitespace-nowrap order-2 sm:order-1 pr-4 md:mt-10">
                        {displayedUniforms[0].text}
                      </span>
                      <span className="h-0.5 w-6 sm:w-10 md:w-16 lg:w-24 bg-[#f59301] hidden sm:inline-block order-2 sm:order-2 md:mt-10"></span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 justify-end pr-2 pb-2 sm:pr-4 sm:pb-4 sm:ml-16 md:ml-24 md:pr-6 md:pb-6 lg:pr-2 lg:pb-6 lg:ml-0 mt-4 sm:mt-6 md:mt-8 lg:mt-8">
                      {renderUniformCards()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#f59301] text-white flex items-center justify-center shadow hover:bg-orange-700 z-30 text-sm sm:text-base md:text-lg min-w-[44px] min-h-[44px]"
        onClick={() =>
          setMainIndex(
            (prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length
          )
        }
        aria-label="Carousel Previous"
      >
        &#8592;
      </button>
      <button
        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#f59301] text-white flex items-center justify-center shadow hover:bg-orange-700 z-30 text-sm sm:text-base md:text-lg min-w-[44px] min-h-[44px]"
        onClick={() =>
          setMainIndex((prev) => (prev + 1) % carouselSlides.length)
        }
        aria-label="Carousel Next"
      >
        &#8594;
      </button>
    </div>
  );
}

export default FeatureCarousel;
