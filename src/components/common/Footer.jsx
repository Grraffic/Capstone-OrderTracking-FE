import { CiFacebook } from "react-icons/ci";
import { TfiEmail } from "react-icons/tfi";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-Footer">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row lg:justify-between gap-8 lg:gap-4">
          {/* Logo and Description */}
          <div className="flex flex-col items-center lg:items-start max-w-full lg:max-w-xl">
            <Link
              to="/home/announcement"
              className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4"
            >
              <img
                src="../../../assets/image/LV Logo.png"
                alt="LV Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 hover:scale-105 transition-transform cursor-pointer"
              />
              <p className="text-center sm:text-left font-regular text-xl sm:text-2xl md:text-[32px] text-LBackground">
                LA VERDAD CHRISTIAN COLLEGE
              </p>
            </Link>
            <p className="text-sm sm:text-[14px] text-center lg:text-left font-LatoRegular text-LBackground max-w-[510px] mt-2 ml-24">
              Seamless appointment management—stay organized, save time, and
              never miss an appointment with ease and efficiency.
            </p>
          </div>

          {/* Follow Us and Contact Us Container */}
          <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-12 lg:gap-16">
            {/* Follow Us Section */}
            <div className="flex flex-col items-center space-y-3">
              <p className="font-LatoRegular text-xl sm:text-2xl text-LBackground">
                FOLLOW US
              </p>
              <div className="flex justify-center items-center space-x-4">
                <a
                  href="https://www.facebook.com/lvcc.apalit"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our Facebook page"
                  className="hover:scale-110 transition-transform"
                >
                  <CiFacebook className="text-Primary w-8 h-8 sm:w-10 sm:h-10 hover:text-PrimaryDark transition-colors" />
                </a>
                <a
                  href="mailto:support@laverdad.edu.ph"
                  aria-label="Send us an email"
                  className="hover:scale-110 transition-transform"
                >
                  <TfiEmail className="text-Primary w-6 h-6 sm:w-8 sm:h-8 hover:text-PrimaryDark transition-colors" />
                </a>
              </div>
            </div>

            {/* Contact Us Section */}
            <div className="flex flex-col items-center space-y-3">
              <p className="font-LatoRegular text-xl sm:text-2xl text-LBackground">
                CONTACT US
              </p>
              <div className="text-center">
                <p className="text-xs sm:text-[14px] font-LatoRegular text-LBackground">
                  support@laverdad.edu.ph
                </p>
                <p className="text-xs sm:text-[14px] font-LatoRegular text-LBackground">
                  +639479998499
                </p>
                <p className="text-xs sm:text-[14px] font-LatoRegular text-LBackground max-w-[200px]">
                  Mac Arthur High-way, Sampaloc, Apalit, Pampanga
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b-2 border-Primary opacity-50 w-[90%] mx-auto"></div>

      {/* Copyright */}
      <p className="text-center text-sm sm:text-base py-4 sm:py-8">
        © 2024 . La Verdad Christian College, Inc.
      </p>
    </footer>
  );
};

export default Footer;
