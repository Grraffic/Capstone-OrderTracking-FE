import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="relative w-full px-8 bg-white">
        {/* Background Image with Text Behind */}
        <div className="relative w-full h-[70vh]">
          {/* Text BEHIND the image */}

          <h1 className="absolute px-8 py-6 tracking-[-10px] leading-none text-[130px] font-SFRegular text-[#00396E] opacity-100 z-0">
            La Verdad{" "}
            <span className="text-[#f59301] drop-shadow-lg leading-[90px] text-[130px] flex font-SFRegular">
              OrderFlow
            </span>
          </h1>

          <p className="absolute right-8 top-10 font-SFRegular text-xl text-[#00396E] opacity-100 z-0">
            A seamless Order Tracking for{" "}
            <span className="text-[#E68B00]">School Uniform and Items</span>
          </p>

          {/* Foreground Image */}
          <img
            src="../../assets/image/LandingPage.png"
            alt="La Verdad Christian College"
            className="relative z-10 w-full h-full object-cover shadow-gray-800 rounded-xl shadow-md bg-black bg-opacity-10"
          />
        </div>

        {/* Content under the Background */}
        <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl space-y-6">
            <p className="text-lg text-[#003363]">
              A Web-Based Order Tracking System with QR-integrated Inventory
              Monitoring of school uniforms at La Verdad Christian College Inc.,
              Apalit.
            </p>
            <Link
              to="/get-started"
              className="border-2 border-[#E68B00] text-[#E68B00] px-8 py-3 rounded-full font-semibold hover:bg-orange-50 hover:text-orange-600 transition ml-auto block w-fit"
            >
              Get Started
            </Link>
          </div>

          {/* Right Content (Social Media Preview) */}
          <div className="bg-white p-6 rounded-xl shadow-lg relative flex items-center">
            <img
              src="../../assets/image/page.png"
              alt="La Verdad Christian College Facebook"
              className="w-[320px] h-auto rounded-lg shadow-md"
            />
            <div className="ml-8 text-left">
              <h2 className="text-2xl font-bold text-[#163869]">
                Follow us on our <br />
                <span className="text-[#E68B00]">Social Media</span>
              </h2>
              <p className="mt-2 text-lg text-[#235292] font-semibold">
                La Verdad Christian College
              </p>
              <p className="text-base text-orange-600">Apalit, Pampanga</p>
            </div>
            <a
              href="https://www.facebook.com/lvcc.apalit"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4"
            >
              <button className="bg-yellow-400 rounded-lg p-3 shadow flex items-center">
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
      <section className="bg-gray-50 py-4">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold  text-[#003363] mb-12">
            Now <span className="text-[#E68B00]">Available</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl text-[38px] font-semibold text-[#003363]">
                Senior High Uniforms
              </h3>
              <p className="text-gray-600">are now Available!</p>
              <img
                src="../../assets/image/card1.png"
                alt="Senior High Uniforms"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div>
                <Link
                  to="/order"
                  className="text-orange-500 font-semibold mt-4 inline-block hover:underline"
                >
                  Click here to Order →
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold">
                Basic Education Uniforms
              </h3>
              <p className="text-gray-600">are now Available!</p>
              <img
                src="../../assets/image/card2.png"
                alt="Basic Education Uniforms"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <Link
                to="/order"
                className="text-orange-500 font-semibold mt-4 inline-block hover:underline"
              >
                Click here to Order →
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold">Notebooks</h3>
              <p className="text-gray-600">are now Available!</p>
              <img
                src="../../assets/image/card3.png"
                alt="Notebooks"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <Link
                to="/order"
                className="text-orange-500 font-semibold mt-4 inline-block hover:underline"
              >
                Click here to Order →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="relative w-full h-[80vh] my-10 overflow-hidden rounded-lg">
        {/* LAYER 1: Solid background */}
        <div className="absolute inset-0 w-full h-full bg-[#fefefe] z-0 opacity-95" />

        {/* LAYER 2: Background image, half-height or custom */}
        <div
          className="absolute inset-x-0 bottom-0 w-full h-[50vh] bg-center z-10"
          style={{
            backgroundImage:
              "url('../../public/assets/image/Untitled design.png')",
          }}
        />

        {/* LAYER 3: Vision & Mission text on top */}
        <div className="absolute inset-0 flex flex-col justify-start items-center h-full z-20 px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full p-10">
            {/* Vision */}
            <div className="text-center p-6">
              <h2 className="text-4xl font-bold text-[#163869] mb-2">Vision</h2>
              <p className="mt-2 text-lg text-[#003363] font-SFPro">
                The institution that ensures
                <span className="text-[#E68B00] font-semibold">
                  {" "}
                  quality learning{" "}
                </span>
                and <br />
                <span className="text-[#E68B00] font-semibold ">
                  {" "}
                  biblical moral standards.
                </span>
              </p>
            </div>
            {/* Mission */}
            <div className="text-center p-6 ">
              <h2 className="text-4xl font-bold text-[#163869] mb-2">
                Mission
              </h2>
              <p className="mt-2 text-lg text-[#003363] font-SFPro">
                To be the frontrunner in providing
                <span className="text-[#E68B00] font-semibold">
                  {" "}
                  academic <br /> excellence{" "}
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
      </div>

      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-[#fefefe] py-10">
        {/* Main content: Card and Info */}
        <div className="w-full max-w-6xl flex flex-col md:flex-row justify-center items-center gap-16 px-4">
          {/* LEFT: Contact Card - vertically centered */}
          <div className="bg-[#f9f9fa] rounded-2xl shadow-xl p-10 max-w-md w-full flex flex-col border border-gray-100">
            <h3 className="text-2xl font-bold mb-8">
              <span className="text-[#163869]">Get </span>
              <span className="text-[#E68B00]">in Touch</span>
            </h3>
            <label className="text-sm font-bold text-[#163869] mb-0.5">
              Name
            </label>
            <input
              className="mb-5 text-[15px] border-none border-b border-[#62759d] bg-transparent focus:outline-none"
              type="text"
              placeholder="Enter your name"
            />

            <label className="text-sm font-bold text-[#163869] mb-0.5">
              E-mail
            </label>
            <input
              className="mb-5 text-[15px] border-none border-b border-[#62759d] bg-transparent focus:outline-none"
              type="email"
              placeholder="Enter your e-mail"
            />

            <label className="text-sm font-bold text-[#163869] mb-0.5">
              Message
            </label>
            <textarea
              className="mb-7 text-[15px] border-none border-b border-[#62759d] bg-transparent focus:outline-none resize-none"
              rows={3}
              placeholder="Write your message here"
            />

            <button className="bg-[#163869] text-white px-6 py-2 text-sm rounded-lg font-bold self-end -mt-2 mb-4 shadow">
              Send Message
            </button>
            {/* Bottom image */}
            <div
              className="w-full relative overflow-hidden flex rounded-lg"
              style={{ height: "200px" }}
            >
              <img
                src="../../public/assets/image/Untitled%20design.png"
                alt="Campus"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* RIGHT: Contact Info - left-aligned text */}
          <div className="flex-1 flex flex-col justify-start items-start mb-28">
            {/* Contact Us heading */}
            <h3 className="text-xl font-semibold text-[#163869] mb-2">
              Contact <span className="text-[#E68B00]">Us</span>
            </h3>
            {/* Large heading */}
            <div className="text-[2.7rem] md:text-5xl font-bold text-[#163869] mb-2 leading-snug ">
              We are here to <br />{" "}
              <span className="text-[#E68B00]">assist</span> you
            </div>
            {/* Subtext */}
            <p className="text-[#163869] text-base mb-8 max-w-xl">
              If you have any inquiries, require assistance, or wish to <br />{" "}
              provide feedback, we are here to assist you.
            </p>
            {/* Contact information block */}
            <h4 className="mt-2 text-xl font-bold text-[#163869]">
              Contact <span className="text-[#E68B00]">information</span>
            </h4>
            {/* Address */}
            <div className="mt-5 flex flex-row items-start gap-2">
              <span className="text-[#163869] text-lg mt-0.5">📍</span>
              <div>
                <span className="font-bold text-[#163869]">Address</span>
                <br />
                <span className="text-[#163869] text-base">
                  Mac Arthur High-way, Sampaloc, Apalit, <br />
                  Pampanga
                </span>
              </div>
            </div>
            {/* Contact details */}
            <div className="mt-6 flex flex-row items-start gap-2">
              <span className="text-[#163869] text-lg mt-0.5">✉</span>
              <div>
                <span className="font-bold text-[#163869]">Contact</span>
                <br />
                <span className="text-[#163869] text-base">
                  +639479998499
                  <br />
                  support@laverdad.edu.ph
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Google Maps */}
        <div className="w-full flex flex-col items-center mt-24">
          <div className="text-[1.26rem] font-bold text-[#163869]">
            Find Us on <span className="text-[#E68B00]">Google Maps</span>
          </div>
          <p className="mt-3 text-[#163869] text-base text-center max-w-xl">
            If you have any inquiries, require assistance, or wish to provide
            feedback, we are here to assist you
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
