import React, { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { useScrollOnState } from "../hooks/useScrollOnState";
import Header from "../components/common/Header";
import ContactForm from "../components/common/ContactForm";
import FeatureCarousel from "../constants/carouselSlides";

// Featured items data for automatic rotation
const featuredItems = {
  seniorHigh: [
    {
      image: "../../assets/image/SHS BLOUSE.png",
      title: "Senior High",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Senior", "High School"],
    },
    {
      image: "../../assets/image/SHS SKIRT.png",
      title: "Senior High",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Senior", "High School"],
    },
    {
      image: "../../assets/image/SHS NECKTIE.png",
      title: "Senior High",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Senior", "High School"],
    },
    {
      image: "../../assets/image/PANTS.png",
      title: "Senior High",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Senior", "High School"],
    },
  ],
  basicEducation: [
    {
      image: "../../assets/image/ELEMENTARY BLOUSE.png",
      title: "Basic Education",
      subtitle: "Uniforms",
      description: "are now in stock!",
      watermark: ["Basic", "Education"],
    },
    {
      image: "../../assets/image/JHS BLOUSE.png",
      title: "Basic Education",
      subtitle: "Uniforms",
      description: "are now in stock!",
      watermark: ["Basic", "Education"],
    },
    {
      image: "../../assets/image/KINDER DRESS.png",
      title: "Basic Education",
      subtitle: "Uniforms",
      description: "are now in stock!",
      watermark: ["Basic", "Education"],
    },
    {
      image: "../../assets/image/POLO JACKET (Elem & JHS).png",
      title: "Basic Education",
      subtitle: "Uniforms",
      description: "are now in stock!",
      watermark: ["Basic", "Education"],
    },
  ],
  peUniforms: [
    {
      image: "../../assets/image/JERSEY.png",
      title: "PE Uniforms",
      subtitle: "",
      description: "are now Available!",
      watermark: ["PE", "Uniform"],
    },
    {
      image: "../../assets/image/JOGGING PANTS.png",
      title: "PE Uniforms",
      subtitle: "",
      description: "are now Available!",
      watermark: ["PE", "Uniform"],
    },
  ],
  higherEducation: [
    {
      image: "../../assets/image/PANTS.png",
      title: "Higher Education",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Higher", "Education"],
    },
    {
      image: "../../assets/image/SHS BLOUSE.png",
      title: "Higher Education",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Higher", "Education"],
    },
    {
      image: "../../assets/image/POLO JACKET (Elem & JHS).png",
      title: "Higher Education",
      subtitle: "Uniforms",
      description: "are now Available!",
      watermark: ["Higher", "Education"],
    },
  ],
};

export default function LandingPage() {
  useScrollOnState();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [seniorHighIndex, setSeniorHighIndex] = useState(0);
  const [basicEducationIndex, setBasicEducationIndex] = useState(0);
  const [peUniformsIndex, setPeUniformsIndex] = useState(0);
  const [higherEducationIndex, setHigherEducationIndex] = useState(0);
  
  // Detect mobile screen size (375px and 430px) and tablet (768px)
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Track which cards are currently visible
  // Desktop: 3 cards (0=Senior High, 1=Basic Education, 2=PE Uniforms, 3=Higher Education)
  // Mobile: 1 card at a time
  // Initialize based on screen size - default to mobile (1 card) to prevent flash of multiple cards
  const getInitialVisibleCards = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      // Mobile M (375px) and Mobile L (430px) - always 1 card
      if (width >= 375 && width <= 430) {
        return [0]; // Force single card
      }
    }
    return [0, 1, 2]; // Desktop/Tablet: Start with Senior High, Basic Education, PE Uniforms
  };
  const [visibleCards, setVisibleCards] = useState(getInitialVisibleCards);
  const [exitingCard, setExitingCard] = useState(null);
  const [enteringCard, setEnteringCard] = useState(null);
  const visibleCardsRef = React.useRef(getInitialVisibleCards());
  const mobileCardIndexRef = React.useRef(0); // Track current card index for mobile rotation

  // Detect mobile and tablet screen sizes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      // Mobile M (375px) and Mobile L (430px) - show 1 card only
      // Use <= 430 to ensure Mobile L (430px) is included in mobile
      setIsMobile(width >= 375 && width <= 430);
      // Tablet starts at 431px (above Mobile L)
      setIsTablet(width >= 431 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Show scroll-to-top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate featured items within each card
  useEffect(() => {
    let seniorHighInterval;
    let basicEducationInterval;
    let peUniformsInterval;
    let higherEducationInterval;

    // Senior High rotation - every 4 seconds
    seniorHighInterval = setInterval(() => {
      setSeniorHighIndex((prev) => 
        (prev + 1) % featuredItems.seniorHigh.length
      );
    }, 4000);

    // Basic Education rotation - every 4 seconds, starts after 1 second
    const basicEducationTimeout = setTimeout(() => {
      basicEducationInterval = setInterval(() => {
        setBasicEducationIndex((prev) => 
          (prev + 1) % featuredItems.basicEducation.length
        );
      }, 4000);
    }, 1000);

    // PE Uniforms rotation - every 4 seconds, starts after 2 seconds
    const peUniformsTimeout = setTimeout(() => {
      peUniformsInterval = setInterval(() => {
        setPeUniformsIndex((prev) => 
          (prev + 1) % featuredItems.peUniforms.length
        );
      }, 4000);
    }, 2000);

    // Higher Education rotation - every 4 seconds, starts after 3 seconds
    const higherEducationTimeout = setTimeout(() => {
      higherEducationInterval = setInterval(() => {
        setHigherEducationIndex((prev) => 
          (prev + 1) % featuredItems.higherEducation.length
        );
      }, 4000);
    }, 3000);

    return () => {
      if (seniorHighInterval) clearInterval(seniorHighInterval);
      if (basicEducationInterval) clearInterval(basicEducationInterval);
      if (peUniformsInterval) clearInterval(peUniformsInterval);
      if (higherEducationInterval) clearInterval(higherEducationInterval);
      clearTimeout(basicEducationTimeout);
      clearTimeout(peUniformsTimeout);
      clearTimeout(higherEducationTimeout);
    };
  }, []);

  // Manual navigation functions for desktop/tablet
  const handleNextCards = useCallback(() => {
    if (isMobile) return;
    
    const currentCards = visibleCardsRef.current;
    if (isTablet) {
      // Tablet: rotate through 2 cards
      if (currentCards.length === 2) {
        const nextCards = currentCards.map(card => (card + 1) % 4);
        const exiting = currentCards.find(card => !nextCards.includes(card));
        const entering = nextCards.find(card => !currentCards.includes(card));
        if (exiting !== undefined) setExitingCard(exiting);
        if (entering !== undefined) setEnteringCard(entering);
        setTimeout(() => {
          setVisibleCards(nextCards);
          visibleCardsRef.current = nextCards;
          setTimeout(() => {
            setExitingCard(null);
            setEnteringCard(null);
          }, 1200);
        }, 0);
      }
    } else {
      // Desktop: rotate through 4 cards (all visible, but rotate which items are shown)
      if (currentCards.length === 4) {
        // Shift all cards forward by 1 position
        const nextCards = currentCards.map(card => (card + 1) % 4);
        // No cards exit or enter since all 4 are always visible, just the content rotates
        setVisibleCards(nextCards);
        visibleCardsRef.current = nextCards;
      }
    }
  }, [isMobile, isTablet]);

  const handlePrevCards = useCallback(() => {
    if (isMobile) return;
    
    const currentCards = visibleCardsRef.current;
    if (isTablet) {
      // Tablet: rotate backwards through 2 cards
      if (currentCards.length === 2) {
        const nextCards = currentCards.map(card => (card - 1 + 4) % 4);
        const exiting = currentCards.find(card => !nextCards.includes(card));
        const entering = nextCards.find(card => !currentCards.includes(card));
        if (exiting !== undefined) setExitingCard(exiting);
        if (entering !== undefined) setEnteringCard(entering);
        setTimeout(() => {
          setVisibleCards(nextCards);
          visibleCardsRef.current = nextCards;
          setTimeout(() => {
            setExitingCard(null);
            setEnteringCard(null);
          }, 1200);
        }, 0);
      }
    } else {
      // Desktop: rotate backwards through 4 cards (all visible, but rotate which items are shown)
      if (currentCards.length === 4) {
        // Shift all cards backward by 1 position
        const nextCards = currentCards.map(card => (card - 1 + 4) % 4);
        // No cards exit or enter since all 4 are always visible, just the content rotates
        setVisibleCards(nextCards);
        visibleCardsRef.current = nextCards;
      }
    }
  }, [isMobile, isTablet]);

  // Card rotation logic - different for mobile, tablet, and desktop
  useEffect(() => {
    // Force mobile to show only 1 card immediately
    if (isMobile) {
      // Mobile: 1 card at a time, continuously cycle through all 4 cards
      const allCards = [0, 1, 2, 3]; // Senior High, Basic Education, PE Uniforms, Higher Education
      
      // Ensure only 1 card is visible on mobile - check ref to avoid dependency issues
      if (visibleCardsRef.current.length > 1) {
        setVisibleCards([0]);
        visibleCardsRef.current = [0];
      }
      
      let currentIndex = visibleCardsRef.current[0] || 0;
      
      // Set initial card if not already set - use ref to avoid dependency issues
      if (visibleCardsRef.current.length !== 1) {
        setVisibleCards([allCards[currentIndex]]);
        visibleCardsRef.current = [allCards[currentIndex]];
        mobileCardIndexRef.current = currentIndex;
      }
      
      const rotateNext = () => {
        const oldIndex = currentIndex;
        currentIndex = (currentIndex + 1) % allCards.length;
        const newCard = allCards[currentIndex];
        const oldCard = allCards[oldIndex];
        
        // Set exiting and entering cards
        setExitingCard(oldCard);
        setEnteringCard(newCard);
        
        setTimeout(() => {
          setVisibleCards([newCard]);
          visibleCardsRef.current = [newCard];
          mobileCardIndexRef.current = currentIndex;
          
          setTimeout(() => {
            setExitingCard(null);
            setEnteringCard(null);
          }, 1000); // Match animation duration
        }, 0);
      };
      
      // Rotate every 4 seconds on mobile
      const mobileInterval = setInterval(rotateNext, 4000);
      
      return () => {
        clearInterval(mobileInterval);
      };
    } else {
      // Double-check we're not on mobile before running tablet/desktop logic
      const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
      const isActuallyMobile = currentWidth >= 375 && currentWidth <= 430;
      
      if (isActuallyMobile) {
        // If we're actually on mobile, don't run tablet/desktop logic
        console.log('🔧 Prevented tablet/desktop logic from running on mobile');
        return;
      }
      
      // Tablet: 2 cards, Desktop: 3 cards rotation
      let timeouts = [];
      
      const scheduleTransition = (delay, newCards, oldCards, isTransition = true) => {
        const timeout = setTimeout(() => {
          if (isTransition) {
            // Find which card is exiting and which is entering
            const exiting = oldCards.find(card => !newCards.includes(card));
            const entering = newCards.find(card => !oldCards.includes(card));
            
            if (exiting !== undefined) setExitingCard(exiting);
            if (entering !== undefined) setEnteringCard(entering);
            
            // After animation, update cards and clear flags
            // Use longer duration for smoother transition
            setTimeout(() => {
              setVisibleCards(newCards);
              visibleCardsRef.current = newCards;
              setTimeout(() => {
                setExitingCard(null);
                setEnteringCard(null);
              }, 1200); // Match animation duration
            }, 0);
          } else {
            setVisibleCards(newCards);
            visibleCardsRef.current = newCards;
          }
        }, delay);
        timeouts.push(timeout);
      };

      const runCycle = () => {
        // Clear any existing timeouts
        timeouts.forEach(clearTimeout);
        timeouts = [];
        
        const currentCards = visibleCardsRef.current;

        if (isTablet) {
          // Tablet: Show only 2 cards - rotate through all 4 cards
          // Step 1: After 5 seconds, Senior High out, PE Uniforms in
          scheduleTransition(5000, [1, 2], currentCards.length === 2 ? currentCards : [0, 1], true);

          // Step 2: After another 5.5 seconds (10.5s total), Basic Education out, Higher Education in
          scheduleTransition(10500, [2, 3], [1, 2], true);

          // Step 3: After another 5.5 seconds (16s total), PE Uniforms out, Senior High in
          scheduleTransition(16000, [3, 0], [2, 3], true);

          // Step 4: After another 5.5 seconds (21.5s total), Higher Education out, Basic Education in
          scheduleTransition(21500, [0, 1], [3, 0], true);
        } else {
          // Desktop: All 4 cards are always visible, no auto-rotation needed
          // Cards will only change when user clicks navigation buttons
        }
      };

      // Set initial cards based on screen size
      if (isTablet) {
        setVisibleCards([0, 1]); // Senior High, Basic Education
        visibleCardsRef.current = [0, 1];
      } else {
        // Desktop: Show all 4 cards in one row
        setVisibleCards([0, 1, 2, 3]); // Senior High, Basic Education, PE Uniforms, Higher Education
        visibleCardsRef.current = [0, 1, 2, 3];
      }

      // Run initial cycle
      runCycle();

      // Repeat cycle - 16s for desktop, 27s for tablet (to complete full rotation of all 4 cards)
      const cycleInterval = setInterval(() => {
        runCycle();
      }, isTablet ? 27000 : 16000);

      return () => {
        clearInterval(cycleInterval);
        timeouts.forEach(clearTimeout);
      };
    }
  }, [isMobile, isTablet]); // Re-run when mobile or tablet state changes

  // Add defensive useLayoutEffect to enforce single card on mobile (runs synchronously before paint)
  useLayoutEffect(() => {
    const currentWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
    const isActuallyMobile = currentWidth >= 375 && currentWidth <= 430;
    
    if (isMobile || isActuallyMobile) {
      setVisibleCards((prev) => {
        if (prev.length > 1 || visibleCardsRef.current.length > 1) {
          console.warn('🔧 Mobile detected with multiple cards, forcing to 1 card immediately');
          const singleCard = [prev[0] || visibleCardsRef.current[0] || 0];
          visibleCardsRef.current = singleCard;
          return singleCard;
        }
        return prev;
      });
    }
  }, [isMobile]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="min-h-screen bg-white flex flex-col overflow-x-hidden">
      {/* Header */}
      <Header />

      {/* Hero Section - Add padding-top to account for fixed header */}
      <section className="relative w-full px-4 sm:px-6 lg:px-8 bg-white pt-20 sm:pt-24">
        {/* Background Image with Text Behind */}
        <FeatureCarousel />

        {/* Content under the Background */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="max-w-xl space-y-4 sm:space-y-6">
            <p className="text-sm sm:text-base lg:text-lg text-[#003363] leading-relaxed">
              A Web-Based Order Tracking System with QR-integrated Inventory
              Monitoring of school uniforms at La Verdad Christian College Inc.,
              Apalit.
            </p>
            <Link
              to="/login"
              className="border-2 border-[#E68B00] text-[#E68B00] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-orange-50 hover:text-orange-600 transition ml-auto inline-flex items-center justify-center w-fit text-sm sm:text-base min-h-[44px]"
            >
              Get Started
            </Link>
          </div>

          {/* Right Content (Social Media Preview) */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg relative flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 lg:gap-4 pb-16 sm:pb-14 lg:pb-14 min-h-0 overflow-hidden">
            <img
              src="../../assets/image/page.png"
              alt="La Verdad Christian College Facebook"
              className="w-full sm:w-[200px] md:w-[280px] lg:w-[200px] xl:w-[240px] h-auto rounded-lg shadow-md flex-shrink-0 object-contain"
            />
            <div className="text-center sm:text-left w-full sm:w-auto min-w-0 flex flex-col items-center sm:items-start lg:items-start flex-1">
              <h2 className="text-lg sm:text-xl md:text-xl font-bold text-[#163869] leading-tight">
                Follow us on our <br className="hidden sm:block" />
                <span className="text-[#E68B00]">Social Media</span>
              </h2>
              <p className="mt-2 text-base sm:text-lg text-[#235292] font-semibold">
                La Verdad Christian College
              </p>
              <p className="text-sm sm:text-base text-orange-600 mt-0">
                Apalit, Pampanga
              </p>
            </div>
            <a
              href="https://www.facebook.com/lvcc.apalit"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
            >
              <button className="rounded-lg p-3 shadow flex items-center transition bg-[#E68B00]/70 hover:bg-[#E68B00]/90">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </a>
            <div className="absolute left-0 bottom-0 w-full h-3 bg-[#163869] rounded-b-xl" />
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section id="featured" className="bg-gray-50 py-8 sm:py-12 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003363] mb-8 sm:mb-12">
            Now <span className="text-[#E68B00]">Available</span>
          </h2>
          <div 
            className={`relative ${
              isMobile 
                ? "overflow-hidden min-h-[400px] !grid !grid-cols-1 mobile-single-card" 
                : isTablet
                ? "overflow-hidden min-h-[400px]"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            }`}
            style={isMobile ? { 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 0,
              maxWidth: '100%'
            } : {}}
          >
            {/* Navigation Buttons - Desktop and Tablet only */}
            {!isMobile && (
              <>
                {/* Left Button */}
                <button
                  onClick={handlePrevCards}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#f59301] text-white flex items-center justify-center shadow-lg hover:bg-orange-700 z-30 text-sm sm:text-base md:text-lg min-w-[44px] min-h-[44px] transition-colors"
                  aria-label="Previous cards"
                >
                  ←
                </button>
                {/* Right Button */}
                <button
                  onClick={handleNextCards}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#f59301] text-white flex items-center justify-center shadow-lg hover:bg-orange-700 z-30 text-sm sm:text-base md:text-lg min-w-[44px] min-h-[44px] transition-colors"
                  aria-label="Next cards"
                >
                  →
                </button>
              </>
            )}
            {/* Card 1 - Senior High */}
            {(visibleCards.includes(0) || exitingCard === 0) && (
              <div
                key="senior-high"
                className={`flex flex-col h-full ${
                  isMobile ? "!w-full !absolute !inset-0" 
                  : isTablet 
                    ? `w-[calc(50%-12px)] absolute top-0 ${
                        visibleCards.indexOf(0) === 0 ? "left-0" : "right-0"
                      }`
                  : ""
                }`}
                style={{
                  ...(isMobile ? {
                    width: '100%',
                    maxWidth: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: visibleCards.includes(0) ? 10 : 0
                  } : {}),
                  ...(!isMobile && !isTablet && visibleCards.includes(0) ? {
                    // Use CSS order to control grid position in desktop view
                    order: visibleCards.indexOf(0) + 1,
                  } : {}),
                  animation: exitingCard === 0
                    ? "fadeOutLeft 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    : enteringCard === 0
                    ? "slideInFromRight 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    : "",
                  transition: isTablet && !exitingCard && !enteringCard ? "all 0.3s ease-in-out" : "",
                  willChange: (exitingCard === 0 || enteringCard === 0) ? "transform, opacity" : "auto",
                }}
              >
                <div className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                    {featuredItems.seniorHigh[seniorHighIndex].title} <br />{" "}
                    <span className="text-[#E68B00]">
                      {featuredItems.seniorHigh[seniorHighIndex].subtitle}
                    </span>
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    {featuredItems.seniorHigh[seniorHighIndex].description}
                  </p>
                  <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                    <div className="absolute -left-2 bottom-0 pointer-events-none select-none z-0">
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                        }}
                      >
                        {featuredItems.seniorHigh[seniorHighIndex].watermark[0]}
                      </div>
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                          marginTop: "-0.1em",
                        }}
                      >
                        {featuredItems.seniorHigh[seniorHighIndex].watermark[1]}
                      </div>
                    </div>
                    <img
                      key={seniorHighIndex}
                      src={featuredItems.seniorHigh[seniorHighIndex].image}
                      alt="Senior High Uniforms"
                      className="relative z-10 w-full h-full object-contain"
                      style={{ animation: "fadeIn 0.6s ease-in-out" }}
                    />
                  </div>
                </div>
                <Link
                  to="/all-products"
                  className="mt-2 text-[#00396E] font-semibold text-sm sm:text-base hover:underline min-h-[44px] inline-flex items-center"
                >
                  → Click here to Order
                </Link>
              </div>
            )}

            {/* Card 2 - Basic Education */}
            {(visibleCards.includes(1) || exitingCard === 1) && (
              <div
                key="basic-education"
                className={`flex flex-col h-full ${
                  isMobile ? "!w-full !absolute !inset-0" 
                  : isTablet 
                    ? `w-[calc(50%-12px)] absolute top-0 ${
                        visibleCards.indexOf(1) === 0 ? "left-0" : "right-0"
                      }`
                  : ""
                }`}
                style={{
                  ...(isMobile ? {
                    width: '100%',
                    maxWidth: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: visibleCards.includes(1) ? 10 : 0
                  } : {}),
                  ...(!isMobile && !isTablet && visibleCards.includes(1) ? {
                    // Use CSS order to control grid position in desktop view
                    order: visibleCards.indexOf(1) + 1,
                  } : {}),
                  animation: exitingCard === 1
                    ? "fadeOutLeft 1s ease-in-out"
                    : enteringCard === 1
                    ? "slideInFromRight 1s ease-in-out"
                    : "",
                }}
              >
                <div className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                    {featuredItems.basicEducation[basicEducationIndex].title} <br />{" "}
                    <span className="text-[#E68B00]">
                      {featuredItems.basicEducation[basicEducationIndex].subtitle}
                    </span>
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    {featuredItems.basicEducation[basicEducationIndex].description}
                  </p>
                  <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                    <div className="absolute -left-2 bottom-0 pointer-events-none select-none z-0">
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                        }}
                      >
                        {featuredItems.basicEducation[basicEducationIndex].watermark[0]}
                      </div>
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                          marginTop: "-0.1em",
                        }}
                      >
                        {featuredItems.basicEducation[basicEducationIndex].watermark[1]}
                      </div>
                    </div>
                    <img
                      key={basicEducationIndex}
                      src={featuredItems.basicEducation[basicEducationIndex].image}
                      alt="Basic Education Uniforms"
                      className="relative z-10 w-full h-full object-contain"
                      style={{ animation: "fadeIn 0.6s ease-in-out" }}
                    />
                  </div>
                </div>
                <Link
                  to="/all-products"
                  className="mt-2 text-[#00396E] font-semibold text-sm sm:text-base hover:underline min-h-[44px] inline-flex items-center"
                >
                  → Click here to Order
                </Link>
              </div>
            )}

            {/* Card 3 - PE Uniforms */}
            {(visibleCards.includes(2) || exitingCard === 2) && (
              <div
                key="pe-uniforms"
                className={`flex flex-col h-full ${
                  isMobile ? "!w-full !absolute !inset-0" 
                  : isTablet 
                    ? `w-[calc(50%-12px)] absolute top-0 ${
                        visibleCards.indexOf(2) === 0 ? "left-0" : "right-0"
                      }`
                  : ""
                }`}
                style={{
                  ...(isMobile ? {
                    width: '100%',
                    maxWidth: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: visibleCards.includes(2) ? 10 : 0
                  } : {}),
                  ...(!isMobile && !isTablet && visibleCards.includes(2) ? {
                    // Use CSS order to control grid position in desktop view
                    order: visibleCards.indexOf(2) + 1,
                  } : {}),
                  animation: exitingCard === 2
                    ? "fadeOutLeft 1s ease-in-out"
                    : enteringCard === 2
                    ? "slideInFromRight 1s ease-in-out"
                    : "",
                }}
              >
                <div className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                    {featuredItems.peUniforms[peUniformsIndex].title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    {featuredItems.peUniforms[peUniformsIndex].description}
                  </p>
                  <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                    <div className="absolute -left-2 bottom-0 pointer-events-none select-none z-0">
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                        }}
                      >
                        {featuredItems.peUniforms[peUniformsIndex].watermark[0]}
                      </div>
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                          marginTop: "-0.1em",
                        }}
                      >
                        {featuredItems.peUniforms[peUniformsIndex].watermark[1]}
                      </div>
                    </div>
                    <img
                      key={peUniformsIndex}
                      src={featuredItems.peUniforms[peUniformsIndex].image}
                      alt="PE Uniforms"
                      className="relative z-10 w-full h-full object-contain"
                      style={{ animation: "fadeIn 0.6s ease-in-out" }}
                    />
                  </div>
                </div>
                <Link
                  to="/all-products"
                  className="mt-2 text-[#00396E] font-semibold text-sm sm:text-base hover:underline min-h-[44px] inline-flex items-center"
                >
                  → Click here to Order
                </Link>
              </div>
            )}

            {/* Card 4 - Higher Education */}
            {(visibleCards.includes(3) || exitingCard === 3) && (
              <div
                key="higher-education"
                className={`flex flex-col h-full ${
                  isMobile ? "!w-full !absolute !inset-0" 
                  : isTablet 
                    ? `w-[calc(50%-12px)] absolute top-0 ${
                        visibleCards.indexOf(3) === 0 ? "left-0" : "right-0"
                      }`
                  : ""
                }`}
                style={{
                  ...(isMobile ? {
                    width: '100%',
                    maxWidth: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: visibleCards.includes(3) ? 10 : 0
                  } : {}),
                  ...(!isMobile && !isTablet && visibleCards.includes(3) ? {
                    // Use CSS order to control grid position in desktop view
                    order: visibleCards.indexOf(3) + 1,
                  } : {}),
                  animation: exitingCard === 3
                    ? "fadeOutLeft 1s ease-in-out"
                    : "",
                  willChange: exitingCard === 3 ? "transform, opacity" : "auto",
                }}
              >
                <div className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                    {featuredItems.higherEducation[higherEducationIndex].title} <br />{" "}
                    <span className="text-[#E68B00]">
                      {featuredItems.higherEducation[higherEducationIndex].subtitle}
                    </span>
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    {featuredItems.higherEducation[higherEducationIndex].description}
                  </p>
                  <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                    <div className="absolute -left-2 bottom-0 pointer-events-none select-none z-0">
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                        }}
                      >
                        {featuredItems.higherEducation[higherEducationIndex].watermark[0]}
                      </div>
                      <div
                        className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-bold text-blue-200/30 select-none uppercase"
                        style={{
                          letterSpacing: "0.05em",
                          lineHeight: "0.85",
                          margin: 0,
                          padding: 0,
                          display: "block",
                          marginTop: "-0.1em",
                        }}
                      >
                        {featuredItems.higherEducation[higherEducationIndex].watermark[1]}
                      </div>
                    </div>
                    <img
                      key={higherEducationIndex}
                      src={featuredItems.higherEducation[higherEducationIndex].image}
                      alt="Higher Education Uniforms"
                      className="relative z-10 w-full h-full object-contain"
                      style={{ animation: "fadeIn 0.6s ease-in-out" }}
                    />
                  </div>
                </div>
                <Link
                  to="/all-products"
                  className="mt-2 text-[#00396E] font-semibold text-sm sm:text-base hover:underline min-h-[44px] inline-flex items-center"
                >
                  → Click here to Order
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section - Vision & Mission - FIXED: Proper spacing and image containment */}
      <section className="relative w-full py-8 sm:py-12 lg:py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Vision & Mission Grid - Text on Top */}
          <div
            id="about"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 mb-8 sm:mb-12 lg:mb-16"
          >
            {/* Vision */}
            <div id="vision" className="text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#163869] mb-3 sm:mb-4">
                Vision
              </h2>
              {/* Orange underline */}
              <div className="w-16 sm:w-20 h-1 bg-[#E68B00] mx-auto mb-4 sm:mb-6"></div>
              <p className="text-sm sm:text-base lg:text-lg text-[#003363] font-SFPro leading-relaxed max-w-md mx-auto">
                The institution that ensures
                <span className="text-[#E68B00] font-semibold">
                  {" "}
                  quality learning{" "}
                </span>
                and{" "}
                <span className="text-[#E68B00] font-semibold">
                  biblical moral standards.
                </span>
              </p>
            </div>

            {/* Mission */}
            <div id="mission" className="text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#163869] mb-3 sm:mb-4">
                Mission
              </h2>
              {/* Orange underline */}
              <div className="w-16 sm:w-20 h-1 bg-[#E68B00] mx-auto mb-4 sm:mb-6"></div>
              <p className="text-sm sm:text-base lg:text-lg text-[#003363] font-SFPro leading-relaxed max-w-md mx-auto">
                To be the frontrunner in providing
                <span className="text-[#E68B00] font-semibold">
                  {" "}
                  academic excellence{" "}
                </span>
                and
                <span className="text-[#E68B00] font-semibold">
                  {" "}
                  morally upright principles.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Background Image - Responsive full viewport corner-to-corner */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-screen overflow-hidden">
        <img
          src="../../assets/image/Untitled design.png"
          alt="La Verdad Christian College Building"
          className="w-full h-full object-cover object-center"
        />
      </section>

      {/* Contact Section */}
      <div
        id="contact"
        className="w-full min-h-screen flex flex-col items-center justify-center bg-[#fefefe] py-8 sm:py-12 lg:py-16"
      >
        <div className="w-full max-w-6xl flex flex-col lg:flex-row justify-center items-start gap-8 lg:gap-16 px-4 sm:px-6 lg:px-8">
          {/* LEFT: Contact Form with Image */}
          <div className="w-full lg:w-1/2">
            <ContactForm />
          </div>

          {/* RIGHT: Contact Info */}
          <div className="w-full lg:w-1/2 flex flex-col justify-start items-start">
            <h3 className="text-lg sm:text-xl font-semibold text-[#163869] mb-2">
              Contact <span className="text-[#E68B00]">Us</span>
            </h3>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#163869] mb-4 leading-tight">
              We are here to <br />
              <span className="text-[#E68B00]">assist</span> you
            </div>
            <p className="text-[#163869] text-sm sm:text-base mb-6 lg:mb-8 max-w-xl leading-relaxed">
              If you have any inquiries, require assistance, or wish to provide
              feedback, we are here to assist you.
            </p>

            {/* Contact Information */}
            <div className="w-full space-y-4 sm:space-y-6">
              <h4 className="text-base sm:text-lg lg:text-xl font-bold text-[#163869]">
                Contact <span className="text-[#E68B00]">information</span>
              </h4>

              {/* Address */}
              <div className="flex items-start gap-3 min-h-[44px]">
                <span className="text-[#163869] text-lg sm:text-xl flex-shrink-0">
                  📍
                </span>
                <div>
                  <span className="font-bold text-[#163869] block text-sm sm:text-base">
                    Address
                  </span>
                  <span className="text-[#163869] text-sm sm:text-base leading-relaxed">
                    Mac Arthur High-way, Sampaloc, Apalit,
                    <br />
                    Pampanga
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="flex items-start gap-3 min-h-[44px]">
                <span className="text-[#163869] text-lg sm:text-xl flex-shrink-0">
                  ✉
                </span>
                <div>
                  <span className="font-bold text-[#163869] block text-sm sm:text-base">
                    Contact
                  </span>
                  <span className="text-[#163869] text-sm sm:text-base leading-relaxed">
                    +639479998499
                    <br />
                    support@laverdad.edu.ph
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Google Maps */}
        <div className="w-full flex flex-col items-center mt-12 sm:mt-16 lg:mt-24">
          <div className="text-lg sm:text-xl lg:text-2xl text-center font-bold text-[#163869] mb-3 px-4 sm:px-6 lg:px-8">
            Find Us on <span className="text-[#E68B00]">Google Maps</span>
          </div>
          <p className="mt-2 sm:mt-3 text-[#163869] text-sm sm:text-base text-center max-w-xl mb-6 sm:mb-8 leading-relaxed px-4 sm:px-6 lg:px-8">
            If you have any inquiries, require assistance, or wish to provide
            feedback, we are here to assist you
          </p>
          <div className="w-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123347.40710675181!2d120.61418624335936!3d14.959002300000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33965634a341dc6f%3A0x17091aa8b0043f89!2sLa%20Verdad%20Christian%20College!5e0!3m2!1sen!2sph!4v1737910779201!5m2!1sen!2sph"
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Map"
            ></iframe>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button - Mobile Only */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-[#003363] text-white rounded-full p-3 shadow-lg hover:bg-[#0C2340] transition-all duration-300 hover:scale-110 active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}

    </div>
  );
}
