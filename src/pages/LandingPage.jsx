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
            <p className="text-lg text-gray-700">
              A Web-Based Order Tracking System with QR-integrated Inventory
              Monitoring of school uniforms at La Verdad Christian College Inc.,
              Apalit.
            </p>
            <Link
              to="/get-started"
              className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition ml-auto block w-fit"
            >
              Get Started
            </Link>
          </div>

          {/* Right Content (Social Media Preview) */}
          <div className="bg-white p-4 rounded-xl shadow-lg text-center">
            <img
              src="../../assets/image/page.png"
              alt="Follow us on Social Media"
              className="w-[180px] h-auto mx-auto rounded-lg"
            />
            <p className="mt-4 text-sm text-gray-600">
              Follow us on{" "}
              <span className="font-semibold text-orange-500">
                Social Media
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold  text-[#003363] mb-12">
            What’s <span className="text-orange-500">New</span>
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
