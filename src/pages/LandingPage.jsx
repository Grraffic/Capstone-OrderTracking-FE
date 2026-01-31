import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";
import { useScrollOnState } from "../hooks/useScrollOnState";
import Header from "../components/common/Header";
import ContactForm from "../components/common/ContactForm";
import FeatureCarousel from "../constants/carouselSlides";

export default function LandingPage() {
  useScrollOnState();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show scroll-to-top button when user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              className="border-2 border-[#E68B00] text-[#E68B00] px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-orange-50 hover:text-orange-600 transition ml-auto block w-fit text-sm sm:text-base min-h-[44px] flex items-center justify-center"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="flex flex-col h-full">
              <div
                className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white"
              >
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                  Senior High <br /> Uniforms
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  are now Available!
                </p>
                <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                  {/* Background text under the image (watermark) */}
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
                      Senior
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
                      High School
                    </div>
                  </div>

                  <img
                    src="../../assets/image/SHS BLOUSE.png"
                    alt="Senior High Uniforms"
                    className="relative z-10 w-full h-full object-contain"
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

            {/* Card 2 */}
            <div className="flex flex-col h-full">
              <div
                className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white"
              >
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                  Basic Education Uniforms
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  are now in stock!
                </p>
                <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                  {/* Background text under the image (watermark) */}
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
                      Basic
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
                      Education
                    </div>
                  </div>

                  <img
                    src="../../assets/image/ELEMENTARY BLOUSE.png"
                    alt="Basic Education Uniforms"
                    className="relative z-10 w-full h-full object-contain"
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

            {/* Card 3 */}
            <div className="flex flex-col h-full sm:col-span-2 lg:col-span-1">
              <div
                className="p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition flex flex-col flex-1 overflow-hidden bg-white"
              >
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#003363] mb-1">
                  PE Uniforms are
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  are now Available!
                </p>
                <div className="relative w-full h-40 sm:h-48 lg:h-56 mt-auto overflow-hidden">
                  {/* Background text under the image (watermark) */}
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
                      PE
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
                      Uniform
                    </div>
                  </div>

                  <img
                    src="../../assets/image/JERSEY.png"
                    alt="PE Uniforms"
                    className="relative z-10 w-full h-full object-contain"
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
        <div className="w-full flex flex-col items-center mt-12 sm:mt-16 lg:mt-24 px-4 sm:px-6 lg:px-8">
          <div className="text-lg sm:text-xl lg:text-2xl text-center font-bold text-[#163869] mb-3">
            Find Us on <span className="text-[#E68B00]">Google Maps</span>
          </div>
          <p className="mt-2 sm:mt-3 text-[#163869] text-sm sm:text-base text-center max-w-xl mb-6 sm:mb-8 leading-relaxed px-4">
            If you have any inquiries, require assistance, or wish to provide
            feedback, we are here to assist you
          </p>
          <div className="w-full max-w-7xl">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123347.40710675181!2d120.61418624335936!3d14.959002300000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33965634a341dc6f%3A0x17091aa8b0043f89!2sLa%20Verdad%20Christian%20College!5e0!3m2!1sen!2sph!4v1737910779201!5m2!1sen!2sph"
              className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-lg shadow-lg"
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
